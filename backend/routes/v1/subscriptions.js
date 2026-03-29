/**
 * v1 Subscription Routes — RESTful API
 *
 * POST   /api/v1/subscriptions/purchase   — First-time plan purchase
 * POST   /api/v1/subscriptions/upgrade    — Upgrade / downgrade (deactivates old plan)
 * GET    /api/v1/subscriptions/current     — Active subscription for dashboard
 * GET    /api/v1/subscriptions/history     — Payment history for subscriptions
 * GET    /api/v1/subscriptions/plans       — List available plans & pricing
 * GET    /api/v1/subscriptions/receipt/:txnId — Download PDF receipt
 */

const express = require('express');
const router = express.Router();
const Subscription = require('../../models/schemas/subscriptionSchema');
const User = require('../../models/schemas/userSchema');
const { processPayment, lookupSubscriptionPrice, CANONICAL_PRICES } = require('../../services/paymentService');
const { generateReceiptPDF } = require('../../services/receiptService');

console.log('[v1/subscriptions] Router loaded successfully');

// ─── Auth middleware ─────────────────────────────────────────────────────
function isAuthenticated(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  next();
}

function isOrganizer(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'organizer') {
    return res.status(403).json({ success: false, message: 'Only organizers can manage subscriptions.' });
  }
  next();
}

// ─── GET /plans ──────────────────────────────────────────────────────────
router.get('/plans', isAuthenticated, (req, res) => {
  res.json({
    success: true,
    data: {
      free: {
        name: 'Free Plan',
        price: { monthly: 0, yearly: 0 },
        commissionRate: 20,
        features: {
          maxEvents: 3, featuredListings: 0, analytics: false,
          prioritySupport: false, customBranding: false, apiAccess: false, whiteLabel: false
        }
      },
      pro: {
        name: 'Pro Plan',
        price: CANONICAL_PRICES.subscription.pro,
        commissionRate: 15,
        features: {
          maxEvents: -1, featuredListings: 1, analytics: true,
          prioritySupport: true, customBranding: true, apiAccess: false, whiteLabel: false
        }
      },
      enterprise: {
        name: 'Enterprise Plan',
        price: CANONICAL_PRICES.subscription.enterprise,
        commissionRate: 12,
        features: {
          maxEvents: -1, featuredListings: -1, analytics: true,
          prioritySupport: true, customBranding: true, apiAccess: true, whiteLabel: true
        }
      }
    }
  });
});

// ─── GET /current ────────────────────────────────────────────────────────
router.get('/current', isOrganizer, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const subscription = await Subscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gte: new Date() }
    }).sort({ createdAt: -1 });

    if (!subscription) {
      return res.json({
        success: true,
        data: { plan: 'free', status: 'active', message: 'You are on the free plan.' }
      });
    }

    const now = new Date();
    const daysRemaining = Math.max(0, Math.ceil((subscription.endDate - now) / (1000 * 60 * 60 * 24)));

    res.json({
      success: true,
      data: {
        _id: subscription._id,
        plan: subscription.plan,
        billingCycle: subscription.billingCycle,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        daysRemaining,
        features: subscription.features,
        usage: subscription.usage
      }
    });
  } catch (error) {
    console.error('v1 GET /current error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch subscription.' });
  }
});

// ─── GET /history ────────────────────────────────────────────────────────
router.get('/history', isOrganizer, async (req, res) => {
  try {
    const userId = req.session.user._id;

    // All subscription records for this user (past + current)
    const subscriptions = await Subscription.find({ user: userId }).sort({ createdAt: -1 });

    // Flatten paymentHistory entries
    const payments = [];
    subscriptions.forEach(sub => {
      (sub.paymentHistory || []).forEach(ph => {
        payments.push({
          transactionId: ph.transactionId,
          date: ph.paymentDate,
          item: `${sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)} Plan (${sub.billingCycle})`,
          productType: 'Subscription',
          amount: ph.amount,
          status: ph.status,
          billingCycle: sub.billingCycle,
          plan: sub.plan
        });
      });
    });

    // Sort by date descending
    payments.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ success: true, data: payments });
  } catch (error) {
    console.error('v1 GET /history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment history.' });
  }
});

// ─── POST /purchase ──────────────────────────────────────────────────────
router.post('/purchase', isOrganizer, async (req, res) => {
  console.log('[v1/subscriptions/purchase] Request received:', { body: req.body, userId: req.session.user?._id });
  try {
    const { plan, billingCycle = 'monthly', idempotencyKey } = req.body;
    const userId = req.session.user._id;

    // Validate plan
    if (!['pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan. Choose pro or enterprise.' });
    }

    // Server-side price lookup (prevents frontend tampering)
    const amount = lookupSubscriptionPrice(plan, billingCycle);
    if (amount === null) {
      return res.status(400).json({ success: false, message: 'Invalid billing cycle.' });
    }

    // Check duplicate active subscription
    const existing = await Subscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gte: new Date() }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `You already have an active ${existing.plan} subscription. Use the /upgrade endpoint instead.`
      });
    }

    // Process payment transactionally
    const result = await processPayment({
      type: 'subscription',
      userId,
      amount,
      idempotencyKey,
      onSuccess: async (session, transactionId) => {
        const now = new Date();
        const endDate = new Date(now);
        if (billingCycle === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        const subscription = new Subscription({
          user: userId,
          plan,
          billingCycle,
          startDate: now,
          endDate,
          paymentHistory: [{
            amount,
            paymentDate: now,
            paymentMethod: 'demo_payment',
            transactionId,
            status: 'success'
          }]
        });
        const saveOpts = session ? { session } : {};
        await subscription.save(saveOpts);

        // Update user record
        await User.findByIdAndUpdate(userId, {
          'subscription.plan': plan,
          'subscription.startDate': subscription.startDate,
          'subscription.endDate': subscription.endDate,
          'subscription.status': 'active',
          'subscription.paymentId': transactionId
        }, saveOpts);

        return {
          transactionId,
          plan,
          billingCycle,
          amount,
          startDate: subscription.startDate,
          endDate: subscription.endDate
        };
      }
    });

    if (!result.success) {
      return res.status(500).json({ success: false, message: 'Payment failed: ' + result.error, transactionId: result.transactionId, status: 'FAILED' });
    }

    const user = await User.findById(userId);
    const organizerName = user ? `${user.first_name} ${user.last_name}` : 'Organizer';

    res.json({
      success: true,
      message: `Successfully subscribed to ${plan} plan (${billingCycle})!`,
      transactionId: result.transactionId,
      status: 'SUCCESS',
      data: result.receiptData,
      receipt: {
        transactionId: result.transactionId,
        organizerName,
        productType: 'Subscription',
        planOrPackage: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
        billingCycle,
        amount,
        dateTime: new Date().toISOString(),
        paymentStatus: 'SUCCESS'
      }
    });
  } catch (error) {
    console.error('v1 POST /purchase error:', error);
    res.status(500).json({ success: false, message: 'Subscription purchase failed.' });
  }
});

// ─── POST /upgrade ───────────────────────────────────────────────────────
router.post('/upgrade', isOrganizer, async (req, res) => {  console.log('[v1/subscriptions/upgrade] Request received:', { body: req.body, userId: req.session.user?._id });  try {
    const { newPlan, billingCycle = 'monthly', idempotencyKey } = req.body;
    const userId = req.session.user._id;

    if (!['pro', 'enterprise'].includes(newPlan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan.' });
    }

    const amount = lookupSubscriptionPrice(newPlan, billingCycle);
    if (amount === null) {
      return res.status(400).json({ success: false, message: 'Invalid billing cycle.' });
    }

    const result = await processPayment({
      type: 'subscription',
      userId,
      amount,
      idempotencyKey,
      onSuccess: async (session, transactionId) => {
        const saveOpts = session ? { session } : {};
        // Mark all existing active subscriptions as UPGRADED
        await Subscription.updateMany(
          { user: userId, status: 'active' },
          { $set: { status: 'cancelled', cancelledAt: new Date(), cancellationReason: `Upgraded to ${newPlan}` } },
          saveOpts
        );

        // Create new subscription
        const now = new Date();
        const endDate = new Date(now);
        if (billingCycle === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
          endDate.setMonth(endDate.getMonth() + 1);
        }

        const subscription = new Subscription({
          user: userId,
          plan: newPlan,
          billingCycle,
          startDate: now,
          endDate,
          paymentHistory: [{
            amount,
            paymentDate: now,
            paymentMethod: 'demo_payment',
            transactionId,
            status: 'success'
          }]
        });
        await subscription.save(saveOpts);

        await User.findByIdAndUpdate(userId, {
          'subscription.plan': newPlan,
          'subscription.startDate': subscription.startDate,
          'subscription.endDate': subscription.endDate,
          'subscription.status': 'active',
          'subscription.paymentId': transactionId
        }, saveOpts);

        return {
          transactionId,
          plan: newPlan,
          billingCycle,
          amount,
          startDate: subscription.startDate,
          endDate: subscription.endDate
        };
      }
    });

    if (!result.success) {
      return res.status(500).json({ success: false, message: 'Upgrade failed: ' + result.error, status: 'FAILED' });
    }

    const user = await User.findById(userId);
    const organizerName = user ? `${user.first_name} ${user.last_name}` : 'Organizer';

    res.json({
      success: true,
      message: `Successfully upgraded to ${newPlan} plan (${billingCycle})!`,
      transactionId: result.transactionId,
      status: 'SUCCESS',
      data: result.receiptData,
      receipt: {
        transactionId: result.transactionId,
        organizerName,
        productType: 'Subscription',
        planOrPackage: `${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)} Plan`,
        billingCycle,
        amount,
        dateTime: new Date().toISOString(),
        paymentStatus: 'SUCCESS'
      }
    });
  } catch (error) {
    console.error('v1 POST /upgrade error:', error);
    res.status(500).json({ success: false, message: 'Subscription upgrade failed.' });
  }
});

// ─── GET /receipt/:txnId ─────────────────────────────────────────────────
router.get('/receipt/:txnId', isOrganizer, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { txnId } = req.params;

    // Find the subscription containing this transaction
    const subscription = await Subscription.findOne({
      user: userId,
      'paymentHistory.transactionId': txnId
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Transaction not found.' });
    }

    const payment = subscription.paymentHistory.find(p => p.transactionId === txnId);
    const user = await User.findById(userId);
    const organizerName = user ? `${user.first_name} ${user.last_name}` : 'Organizer';

    const pdfBuffer = await generateReceiptPDF({
      organizerName,
      productType: 'Subscription',
      planOrPackage: `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan`,
      billingCycle: subscription.billingCycle,
      amount: payment.amount,
      transactionId: txnId,
      dateTime: payment.paymentDate.toISOString(),
      paymentStatus: payment.status.toUpperCase()
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=SportsAmigo_Receipt_${txnId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('v1 GET /receipt error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate receipt.' });
  }
});

module.exports = router;
