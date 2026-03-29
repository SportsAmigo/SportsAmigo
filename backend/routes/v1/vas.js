/**
 * v1 VAS Routes — RESTful API
 *
 * POST  /api/v1/events/:eventId/vas/purchase  — Purchase VAS for a specific event
 * GET   /api/v1/events/:eventId/vas            — Active VAS for a specific event
 * GET   /api/v1/organizers/vas/summary          — All VAS across all events (dashboard)
 * GET   /api/v1/organizers/vas/history           — Payment history for VAS purchases
 * GET   /api/v1/organizers/vas/receipt/:txnId    — Download PDF receipt for a VAS purchase
 * GET   /api/v1/vas/products                     — List all VAS products (catalog)
 */

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const VASModel = require('../../models/schemas/vasSchema');
const Event = require('../../models/schemas/eventSchema');
const User = require('../../models/schemas/userSchema');
const { processPayment, lookupVASPrice, CANONICAL_PRICES } = require('../../services/paymentService');
const { generateReceiptPDF } = require('../../services/receiptService');

// ─── Auth middleware ─────────────────────────────────────────────────────
function isAuthenticated(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }
  next();
}

function isOrganizer(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'organizer') {
    return res.status(403).json({ success: false, message: 'Only organizers can purchase VAS.' });
  }
  next();
}

// ─── VAS Product Catalog ─────────────────────────────────────────────────
const VAS_CATALOG = {
  event_insurance: {
    name: 'Event Insurance',
    serviceCategory: 'organizer',
    tiers: {
      basic:    { name: 'Basic Coverage',    price: 2999,  coverage: '₹1,00,000' },
      standard: { name: 'Standard Coverage', price: 4999,  coverage: '₹2,50,000' },
      premium:  { name: 'Premium Coverage',  price: 9999,  coverage: '₹5,00,000' }
    }
  },
  photography_booking: {
    name: 'Professional Photography',
    serviceCategory: 'organizer',
    tiers: {
      basic:    { name: 'Basic Package',    price: 4999,  hours: '2-3 hours' },
      standard: { name: 'Standard Package', price: 9999,  hours: '4-6 hours' },
      premium:  { name: 'Premium Package',  price: 19999, hours: 'Full day + drone' }
    }
  },
  marketing_boost: {
    name: 'Marketing Boost',
    serviceCategory: 'organizer',
    tiers: {
      basic:    { name: 'Basic Boost',    price: 999,  impressions: '5,000' },
      standard: { name: 'Standard Boost', price: 1999, impressions: '15,000' },
      premium:  { name: 'Premium Boost',  price: 4999, impressions: '50,000' }
    }
  },
  certificate_generation: {
    name: 'Certificate Generation',
    serviceCategory: 'organizer',
    tiers: {
      basic:    { name: 'Basic Certificates',    price: 10, perUnit: 'per certificate' },
      standard: { name: 'Standard (50+)',         price: 7,  perUnit: 'per certificate' },
      premium:  { name: 'Premium (100+)',          price: 5,  perUnit: 'per certificate' }
    }
  },
  sms_notifications: {
    name: 'SMS Notifications',
    serviceCategory: 'organizer',
    tiers: {
      '100':  { name: '100 SMS',  price: 100, rate: '₹1.00/SMS' },
      '500':  { name: '500 SMS',  price: 450, rate: '₹0.90/SMS' },
      '1000': { name: '1000 SMS', price: 800, rate: '₹0.80/SMS' }
    }
  }
};

// ─── GET /api/v1/vas/products ────────────────────────────────────────────
router.get('/vas/products', isAuthenticated, (req, res) => {
  res.json({ success: true, data: VAS_CATALOG });
});

// ─── POST /api/v1/events/:eventId/vas/purchase ──────────────────────────
router.post('/events/:eventId/vas/purchase', isOrganizer, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { serviceType, tier, quantity, idempotencyKey } = req.body;
    const userId = req.session.user._id;

    // Validate eventId
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: 'Invalid event ID.' });
    }

    // Validate service exists in catalog
    const catalogEntry = VAS_CATALOG[serviceType];
    if (!catalogEntry) {
      return res.status(400).json({ success: false, message: `Unknown service type: ${serviceType}` });
    }

    const tierData = catalogEntry.tiers[tier];
    if (!tierData) {
      return res.status(400).json({ success: false, message: `Unknown tier: ${tier} for ${serviceType}` });
    }

    // Server-side price (prevents frontend tampering)
    let amount = tierData.price;
    let smsCount = 0;
    let certCount = 0;

    // For per-unit pricing, multiply by quantity
    if (serviceType === 'certificate_generation') {
      certCount = quantity || (tier === 'basic' ? 1 : tier === 'standard' ? 50 : 100);
      amount = tierData.price * certCount;
    } else if (serviceType === 'sms_notifications') {
      smsCount = parseInt(tier);
      amount = tierData.price;
    }

    // Verify the event belongs to the organizer
    const event = await Event.findOne({ _id: eventId });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Check for duplicate active VAS for same event & service type
    const existingVAS = await VASModel.findOne({
      userId,
      eventId,
      serviceType,
      status: { $in: ['active', 'pending'] }
    });
    if (existingVAS) {
      return res.status(400).json({
        success: false,
        message: `You already have an active ${catalogEntry.name} for this event.`
      });
    }

    // Process payment
    const result = await processPayment({
      type: 'vas',
      userId,
      amount,
      idempotencyKey,
      onSuccess: async (session, transactionId) => {
        // Build service-specific details
        const serviceDetails = {};
        switch (serviceType) {
          case 'event_insurance':
            serviceDetails.insuranceType = tier;
            serviceDetails.coverageAmount = { basic: 100000, standard: 250000, premium: 500000 }[tier];
            serviceDetails.policyNumber = `INS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            break;
          case 'photography_booking':
            serviceDetails.photosCount = { basic: 50, standard: 100, premium: 200 }[tier];
            break;
          case 'marketing_boost':
            serviceDetails.boostType = tier;
            serviceDetails.impressions = 0;
            serviceDetails.clicks = 0;
            serviceDetails.conversions = 0;
            break;
          case 'certificate_generation':
            serviceDetails.certificateCount = certCount;
            serviceDetails.generatedCount = 0;
            break;
          case 'sms_notifications':
            serviceDetails.smsCount = smsCount;
            serviceDetails.smsUsed = 0;
            break;
        }

        const vasPurchase = new VASModel({
          userId,
          eventId,
          serviceType,
          serviceCategory: 'organizer',
          price: amount,
          paymentId: transactionId,
          paymentMethod: 'card',
          paymentStatus: 'completed',
          subscriptionPeriod: 'one_time',
          status: 'active',
          serviceDetails,
          usage: serviceType === 'sms_notifications'
            ? { remainingUsage: smsCount }
            : serviceType === 'certificate_generation'
            ? { remainingUsage: certCount }
            : undefined
        });
        const saveOpts = session ? { session } : {};
        await vasPurchase.save(saveOpts);

        return {
          transactionId,
          vasId: vasPurchase._id,
          serviceType,
          tier,
          amount,
          eventId,
          eventName: event.name || event.title || event.eventName
        };
      }
    });

    if (!result.success) {
      return res.status(500).json({ success: false, message: 'Payment failed: ' + result.error, status: 'FAILED' });
    }

    const user = await User.findById(userId);
    const organizerName = user ? `${user.first_name} ${user.last_name}` : 'Organizer';
    const eventName = result.receiptData?.eventName || 'Event';

    res.json({
      success: true,
      message: `${catalogEntry.name} (${tierData.name}) purchased successfully for ${eventName}!`,
      transactionId: result.transactionId,
      status: 'SUCCESS',
      data: result.receiptData,
      receipt: {
        transactionId: result.transactionId,
        organizerName,
        productType: 'VAS',
        planOrPackage: `${catalogEntry.name} - ${tierData.name}`,
        eventName,
        eventId,
        amount,
        dateTime: new Date().toISOString(),
        paymentStatus: 'SUCCESS'
      }
    });
  } catch (error) {
    console.error('v1 POST /events/:eventId/vas/purchase error:', error);
    res.status(500).json({ success: false, message: 'VAS purchase failed.' });
  }
});

// ─── GET /api/v1/events/:eventId/vas ─────────────────────────────────────
router.get('/events/:eventId/vas', isOrganizer, async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.session.user._id;

    const vasList = await VASModel.find({
      userId,
      eventId,
      status: { $in: ['active', 'completed'] }
    }).sort({ createdAt: -1 });

    res.json({ success: true, data: vasList });
  } catch (error) {
    console.error('v1 GET /events/:eventId/vas error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch event VAS.' });
  }
});

// ─── GET /api/v1/organizers/vas/summary ──────────────────────────────────
router.get('/organizers/vas/summary', isOrganizer, async (req, res) => {
  try {
    const userId = req.session.user._id;

    const purchases = await VASModel.find({
      userId,
      serviceCategory: 'organizer'
    })
    .populate('eventId', 'name title eventName start_date event_date')
    .sort({ createdAt: -1 });

    // Format for dashboard
    const summary = purchases.map(p => ({
      _id: p._id,
      serviceType: p.serviceType,
      serviceName: VAS_CATALOG[p.serviceType]?.name || p.serviceType,
      package: p.serviceDetails?.insuranceType || p.serviceDetails?.boostType || 'standard',
      eventId: p.eventId?._id || p.eventId,
      eventName: p.eventId?.name || p.eventId?.title || p.eventId?.eventName || 'Unknown Event',
      purchaseDate: p.createdAt,
      status: p.status,
      amount: p.price,
      transactionId: p.paymentId,
      // SMS-specific
      smsRemaining: p.serviceType === 'sms_notifications' ? p.usage?.remainingUsage : undefined,
      smsTotal: p.serviceType === 'sms_notifications' ? p.serviceDetails?.smsCount : undefined,
      // Certificate-specific
      certsRemaining: p.serviceType === 'certificate_generation' ? p.usage?.remainingUsage : undefined,
      certsTotal: p.serviceType === 'certificate_generation' ? p.serviceDetails?.certificateCount : undefined,
      // Marketing-specific
      impressions: p.serviceType === 'marketing_boost' ? p.serviceDetails?.impressions : undefined,
      clicks: p.serviceType === 'marketing_boost' ? p.serviceDetails?.clicks : undefined
    }));

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('v1 GET /organizers/vas/summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch VAS summary.' });
  }
});

// ─── GET /api/v1/organizers/vas/history ──────────────────────────────────
router.get('/organizers/vas/history', isOrganizer, async (req, res) => {
  try {
    const userId = req.session.user._id;

    const purchases = await VASModel.find({
      userId,
      serviceCategory: 'organizer'
    })
    .populate('eventId', 'name title eventName')
    .sort({ createdAt: -1 });

    const history = purchases.map(p => ({
      transactionId: p.paymentId || `VAS_${p._id}`,
      date: p.createdAt,
      item: `${VAS_CATALOG[p.serviceType]?.name || p.serviceType} — ${p.eventId?.name || p.eventId?.title || 'Event'}`,
      productType: 'VAS',
      amount: p.price,
      status: p.paymentStatus === 'completed' ? 'success' : (p.paymentStatus || p.status),
      eventName: p.eventId?.name || p.eventId?.title || p.eventId?.eventName || 'Unknown',
      serviceType: p.serviceType
    }));

    res.json({ success: true, data: history });
  } catch (error) {
    console.error('v1 GET /organizers/vas/history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch VAS history.' });
  }
});

// ─── GET /api/v1/organizers/vas/receipt/:txnId ───────────────────────────
router.get('/organizers/vas/receipt/:txnId', isOrganizer, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { txnId } = req.params;

    const vasPurchase = await VASModel.findOne({
      userId,
      paymentId: txnId
    }).populate('eventId', 'name title eventName');

    if (!vasPurchase) {
      return res.status(404).json({ success: false, message: 'VAS transaction not found.' });
    }

    const user = await User.findById(userId);
    const organizerName = user ? `${user.first_name} ${user.last_name}` : 'Organizer';
    const eventName = vasPurchase.eventId?.name || vasPurchase.eventId?.title || 'Event';

    const pdfBuffer = await generateReceiptPDF({
      organizerName,
      productType: 'VAS',
      planOrPackage: VAS_CATALOG[vasPurchase.serviceType]?.name || vasPurchase.serviceType,
      eventName,
      eventId: String(vasPurchase.eventId?._id || vasPurchase.eventId),
      amount: vasPurchase.price,
      transactionId: txnId,
      dateTime: vasPurchase.createdAt.toISOString(),
      paymentStatus: (vasPurchase.paymentStatus || 'completed').toUpperCase()
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=SportsAmigo_VAS_Receipt_${txnId}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('v1 GET /organizers/vas/receipt error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate VAS receipt.' });
  }
});

module.exports = router;
