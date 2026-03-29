/**
 * v1 Subscription Routes — RESTful API
 *
 * POST   /api/v1/subscriptions/create-order          — Create Razorpay order for subscription
 * POST   /api/v1/subscriptions/verify-payment         — Verify Razorpay payment & activate subscription
 * POST   /api/v1/subscriptions/upgrade/create-order   — Create Razorpay order for plan upgrade
 * POST   /api/v1/subscriptions/upgrade/verify-payment — Verify upgrade payment & switch plan
 * GET    /api/v1/subscriptions/current                — Active subscription for dashboard
 * GET    /api/v1/subscriptions/history                — Payment history for subscriptions
 * GET    /api/v1/subscriptions/plans                  — List available plans & pricing
 * GET    /api/v1/subscriptions/receipt/:txnId          — Download PDF receipt
 */

const express = require('express');
const router = express.Router();
const Subscription = require('../../models/schemas/subscriptionSchema');
const User = require('../../models/schemas/userSchema');
const { razorpay, verifyPaymentSignature } = require('../../config/razorpay');
const { lookupSubscriptionPrice, CANONICAL_PRICES } = require('../../services/paymentService');
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

/**
 * @swagger
 * /api/v1/subscriptions/plans:
 *   get:
 *     summary: List all available subscription plans with pricing
 *     tags: [Subscriptions v1]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Plans retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     free:
 *                       type: object
 *                       properties:
 *                         name: { type: string, example: "Free Plan" }
 *                         price:
 *                           type: object
 *                           properties:
 *                             monthly: { type: number, example: 0 }
 *                             yearly: { type: number, example: 0 }
 *                         commissionRate: { type: number, example: 20 }
 *                         features: { type: object }
 *                     pro:
 *                       type: object
 *                       properties:
 *                         name: { type: string, example: "Pro Plan" }
 *                         price:
 *                           type: object
 *                           properties:
 *                             monthly: { type: number }
 *                             yearly: { type: number }
 *                         commissionRate: { type: number, example: 15 }
 *                         features: { type: object }
 *                     enterprise:
 *                       type: object
 *                       properties:
 *                         name: { type: string, example: "Enterprise Plan" }
 *                         price: { type: object }
 *                         commissionRate: { type: number, example: 12 }
 *                         features: { type: object }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/v1/subscriptions/current:
 *   get:
 *     summary: Get current active subscription for the organizer
 *     tags: [Subscriptions v1]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Current subscription details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id: { type: string }
 *                     plan: { type: string, enum: [free, pro, enterprise] }
 *                     billingCycle: { type: string, enum: [monthly, yearly] }
 *                     status: { type: string, enum: [active, cancelled, expired] }
 *                     startDate: { type: string, format: date-time }
 *                     endDate: { type: string, format: date-time }
 *                     daysRemaining: { type: integer, description: Days until subscription expires }
 *                     features: { type: object }
 *                     usage: { type: object }
 *       403:
 *         description: Not an organizer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/v1/subscriptions/history:
 *   get:
 *     summary: Get subscription payment history for organizer
 *     tags: [Subscriptions v1]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Payment history retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       transactionId: { type: string }
 *                       date: { type: string, format: date-time }
 *                       item: { type: string, example: "Pro Plan (monthly)" }
 *                       productType: { type: string, example: "Subscription" }
 *                       amount: { type: number }
 *                       status: { type: string }
 *                       billingCycle: { type: string }
 *                       plan: { type: string }
 *       403:
 *         description: Not an organizer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

// ─── POST /create-order — Create Razorpay order for new subscription ─────
/**
 * @swagger
 * /api/v1/subscriptions/create-order:
 *   post:
 *     summary: Create a Razorpay order for subscription purchase
 *     description: Validates plan, checks for existing subscription, creates Razorpay order. Frontend uses the returned order to open Razorpay Checkout.
 *     tags: [Subscriptions v1]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan]
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [pro, enterprise]
 *                 example: pro
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 default: monthly
 *     responses:
 *       200:
 *         description: Razorpay order created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 orderId: { type: string, description: Razorpay order ID }
 *                 amount: { type: number, description: Amount in INR }
 *                 amountInPaise: { type: number, description: Amount in paise (for Razorpay) }
 *                 currency: { type: string, example: INR }
 *                 key_id: { type: string, description: Razorpay publishable key }
 *                 plan: { type: string }
 *                 billingCycle: { type: string }
 *                 prefill: { type: object }
 *       400:
 *         description: Invalid plan or active subscription exists
 *       403:
 *         description: Not an organizer
 */
router.post('/create-order', isOrganizer, async (req, res) => {
  console.log('[v1/subscriptions/create-order] Request received:', { body: req.body, userId: req.session.user?._id });
  try {
    const { plan, billingCycle = 'monthly' } = req.body;
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

    const shortUser = String(userId).slice(-6);
    const receipt = `sub_${plan}_${billingCycle}_${shortUser}_${Date.now()}`;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects paise
      currency: 'INR',
      receipt,
      notes: {
        userId: String(userId),
        plan,
        billingCycle,
        type: 'subscription'
      }
    });

    const user = await User.findById(userId);

    res.json({
      success: true,
      orderId: order.id,
      amount,
      amountInPaise: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      plan,
      billingCycle,
      prefill: {
        name: user ? `${user.first_name} ${user.last_name}` : '',
        email: user ? user.email : '',
        contact: user ? user.phone || '' : ''
      }
    });
  } catch (error) {
    console.error('v1 POST /create-order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create payment order.' });
  }
});

// ─── POST /verify-payment — Verify Razorpay signature & activate subscription ─
/**
 * @swagger
 * /api/v1/subscriptions/verify-payment:
 *   post:
 *     summary: Verify Razorpay payment and activate subscription
 *     description: Verifies HMAC-SHA256 signature from Razorpay Checkout response. On success, creates the subscription record and updates the user.
 *     tags: [Subscriptions v1]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpay_order_id, razorpay_payment_id, razorpay_signature, plan]
 *             properties:
 *               razorpay_order_id: { type: string }
 *               razorpay_payment_id: { type: string }
 *               razorpay_signature: { type: string }
 *               plan: { type: string, enum: [pro, enterprise] }
 *               billingCycle: { type: string, enum: [monthly, yearly], default: monthly }
 *     responses:
 *       200:
 *         description: Payment verified, subscription activated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 message: { type: string }
 *                 transactionId: { type: string }
 *                 status: { type: string, example: SUCCESS }
 *                 data: { type: object }
 *                 receipt: { type: object }
 *       400:
 *         description: Payment verification failed or invalid plan
 *       403:
 *         description: Not an organizer
 */
router.post('/verify-payment', isOrganizer, async (req, res) => {
  console.log('[v1/subscriptions/verify-payment] Request received:', { body: req.body, userId: req.session.user?._id });
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, billingCycle = 'monthly' } = req.body;
    const userId = req.session.user._id;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay payment details.' });
    }

    if (!['pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan.' });
    }

    // Verify signature
    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      console.error('[v1/subscriptions/verify-payment] Signature verification FAILED');
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    // Server-side price lookup
    const amount = lookupSubscriptionPrice(plan, billingCycle);
    if (amount === null) {
      return res.status(400).json({ success: false, message: 'Invalid billing cycle.' });
    }

    // Double check no active subscription was created in the meantime
    const existing = await Subscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gte: new Date() }
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `You already have an active ${existing.plan} subscription.`
      });
    }

    // Create subscription
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
        paymentMethod: 'razorpay',
        transactionId: razorpay_payment_id,
        status: 'success'
      }]
    });
    await subscription.save();

    // Update user record
    await User.findByIdAndUpdate(userId, {
      'subscription.plan': plan,
      'subscription.startDate': subscription.startDate,
      'subscription.endDate': subscription.endDate,
      'subscription.status': 'active',
      'subscription.paymentId': razorpay_payment_id
    });

    const user = await User.findById(userId);
    const organizerName = user ? `${user.first_name} ${user.last_name}` : 'Organizer';

    res.json({
      success: true,
      message: `Successfully subscribed to ${plan} plan (${billingCycle})!`,
      transactionId: razorpay_payment_id,
      status: 'SUCCESS',
      data: {
        transactionId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        plan,
        billingCycle,
        amount,
        startDate: subscription.startDate,
        endDate: subscription.endDate
      },
      receipt: {
        transactionId: razorpay_payment_id,
        organizerName,
        productType: 'Subscription',
        planOrPackage: `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
        billingCycle,
        amount,
        dateTime: now.toISOString(),
        paymentStatus: 'SUCCESS'
      }
    });
  } catch (error) {
    console.error('v1 POST /verify-payment error:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed.' });
  }
});

// ─── POST /upgrade/create-order — Razorpay order for plan upgrade ─────────
/**
 * @swagger
 * /api/v1/subscriptions/upgrade/create-order:
 *   post:
 *     summary: Create a Razorpay order for subscription upgrade
 *     description: Creates a Razorpay order for upgrading/downgrading subscription plan
 *     tags: [Subscriptions v1]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPlan]
 *             properties:
 *               newPlan:
 *                 type: string
 *                 enum: [pro, enterprise]
 *                 example: enterprise
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 default: monthly
 *     responses:
 *       200:
 *         description: Razorpay order created for upgrade
 *       400:
 *         description: Invalid plan or billing cycle
 *       403:
 *         description: Not an organizer
 */
router.post('/upgrade/create-order', isOrganizer, async (req, res) => {
  console.log('[v1/subscriptions/upgrade/create-order] Request received:', { body: req.body, userId: req.session.user?._id });
  try {
    const { newPlan, billingCycle = 'monthly' } = req.body;
    const userId = req.session.user._id;

    if (!['pro', 'enterprise'].includes(newPlan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan.' });
    }

    const amount = lookupSubscriptionPrice(newPlan, billingCycle);
    if (amount === null) {
      return res.status(400).json({ success: false, message: 'Invalid billing cycle.' });
    }

    const shortUser = String(userId).slice(-6);
    const receipt = `upg_${newPlan}_${billingCycle}_${shortUser}_${Date.now()}`;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt,
      notes: {
        userId: String(userId),
        newPlan,
        billingCycle,
        type: 'subscription_upgrade'
      }
    });

    const user = await User.findById(userId);

    res.json({
      success: true,
      orderId: order.id,
      amount,
      amountInPaise: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
      newPlan,
      billingCycle,
      prefill: {
        name: user ? `${user.first_name} ${user.last_name}` : '',
        email: user ? user.email : '',
        contact: user ? user.phone || '' : ''
      }
    });
  } catch (error) {
    console.error('v1 POST /upgrade/create-order error:', error);
    res.status(500).json({ success: false, message: 'Failed to create upgrade payment order.' });
  }
});

// ─── POST /upgrade/verify-payment — Verify upgrade payment & switch plan ──
/**
 * @swagger
 * /api/v1/subscriptions/upgrade/verify-payment:
 *   post:
 *     summary: Verify Razorpay payment and complete subscription upgrade
 *     description: Verifies payment signature, cancels old subscription, creates new one
 *     tags: [Subscriptions v1]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpay_order_id, razorpay_payment_id, razorpay_signature, newPlan]
 *             properties:
 *               razorpay_order_id: { type: string }
 *               razorpay_payment_id: { type: string }
 *               razorpay_signature: { type: string }
 *               newPlan: { type: string, enum: [pro, enterprise] }
 *               billingCycle: { type: string, enum: [monthly, yearly], default: monthly }
 *     responses:
 *       200:
 *         description: Upgrade payment verified, subscription switched
 *       400:
 *         description: Payment verification failed
 *       403:
 *         description: Not an organizer
 */
router.post('/upgrade/verify-payment', isOrganizer, async (req, res) => {
  console.log('[v1/subscriptions/upgrade/verify-payment] Request received:', { body: req.body, userId: req.session.user?._id });
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, newPlan, billingCycle = 'monthly' } = req.body;
    const userId = req.session.user._id;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing Razorpay payment details.' });
    }

    if (!['pro', 'enterprise'].includes(newPlan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan.' });
    }

    // Verify signature
    const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    if (!isValid) {
      console.error('[v1/subscriptions/upgrade/verify-payment] Signature verification FAILED');
      return res.status(400).json({ success: false, message: 'Payment verification failed. Invalid signature.' });
    }

    const amount = lookupSubscriptionPrice(newPlan, billingCycle);
    if (amount === null) {
      return res.status(400).json({ success: false, message: 'Invalid billing cycle.' });
    }

    // Cancel all existing active subscriptions
    await Subscription.updateMany(
      { user: userId, status: 'active' },
      { $set: { status: 'cancelled', cancelledAt: new Date(), cancellationReason: `Upgraded to ${newPlan}` } }
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
        paymentMethod: 'razorpay',
        transactionId: razorpay_payment_id,
        status: 'success'
      }]
    });
    await subscription.save();

    // Update user record
    await User.findByIdAndUpdate(userId, {
      'subscription.plan': newPlan,
      'subscription.startDate': subscription.startDate,
      'subscription.endDate': subscription.endDate,
      'subscription.status': 'active',
      'subscription.paymentId': razorpay_payment_id
    });

    const user = await User.findById(userId);
    const organizerName = user ? `${user.first_name} ${user.last_name}` : 'Organizer';

    res.json({
      success: true,
      message: `Successfully upgraded to ${newPlan} plan (${billingCycle})!`,
      transactionId: razorpay_payment_id,
      status: 'SUCCESS',
      data: {
        transactionId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        plan: newPlan,
        billingCycle,
        amount,
        startDate: subscription.startDate,
        endDate: subscription.endDate
      },
      receipt: {
        transactionId: razorpay_payment_id,
        organizerName,
        productType: 'Subscription',
        planOrPackage: `${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)} Plan`,
        billingCycle,
        amount,
        dateTime: now.toISOString(),
        paymentStatus: 'SUCCESS'
      }
    });
  } catch (error) {
    console.error('v1 POST /upgrade/verify-payment error:', error);
    res.status(500).json({ success: false, message: 'Upgrade payment verification failed.' });
  }
});

// ─── GET /receipt/:txnId ─────────────────────────────────────────────────
/**
 * @swagger
 * /api/v1/subscriptions/receipt/{txnId}:
 *   get:
 *     summary: Download PDF receipt for a subscription payment
 *     tags: [Subscriptions v1]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: txnId
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID from payment history
 *     responses:
 *       200:
 *         description: PDF receipt file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not an organizer
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
