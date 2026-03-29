/**
 * Value-Added Services (VAS) Controller
 * 
 * Handles all VAS purchases and management for both organizers and players
 */

const {
  VAS,
  purchaseEventInsurance,
  purchaseMarketingBoost,
  purchaseCertificateGeneration,
  purchaseSMSPackage,
  purchasePremiumProfile,
  purchasePerformanceAnalytics,
  purchasePlayerInsurance,
  getUserVASPurchases,
  cancelVASPurchase,
  getVASRevenue
} = require('../models/vas');

/**
 * VAS discount helper — applies plan-based discount to purchase result
 * @param {Object} result - The purchase result from the model
 * @param {string} plan - User's subscription plan ('free'|'pro'|'enterprise')
 * @returns {Object} result with discount applied
 */
function applyVASDiscount(result, plan) {
  if (!result.success || !result.purchase) return result;
  const discountMap = { free: 1.0, pro: 0.90, enterprise: 0.80 };
  const multiplier = discountMap[plan] ?? 1.0;
  const originalPrice = result.purchase.price;
  const finalPrice = Math.round(originalPrice * multiplier);
  result.purchase.price = finalPrice;
  result.originalPrice = originalPrice;
  result.discountApplied = Math.round((1 - multiplier) * 100);
  result.finalPrice = finalPrice;
  // Persist the discounted price
  if (multiplier < 1.0 && result.purchase.save) {
    result.purchase.save().catch(() => {});
  }
  return result;
}

/**
 * Get all VAS products/services with pricing
 */
async function getVASProducts(req, res) {
  try {
    const category = req.query.category; // 'organizer' or 'player'

    const products = {
      organizer: [
        {
          serviceType: 'event_insurance',
          name: 'Event Insurance',
          description: 'Protect your event from unforeseen circumstances',
          tiers: [
            { name: 'basic', price: 999, coverage: '₹1,00,000', features: ['Weather cancellation', 'Basic liability'] },
            { name: 'standard', price: 2499, coverage: '₹2,50,000', features: ['Weather cancellation', 'Liability coverage', 'Participant injury'] },
            { name: 'premium', price: 4999, coverage: '₹5,00,000', features: ['Full cancellation', 'Comprehensive liability', 'Equipment damage', '24/7 support'] }
          ]
        },
        {
          serviceType: 'photography_booking',
          name: 'Professional Photography',
          description: 'Book professional photographers for your event',
          tiers: [
            { name: 'basic', price: 2999, duration: '2 hours', photos: '50 edited photos' },
            { name: 'standard', price: 4999, duration: '4 hours', photos: '100 edited photos + video highlights' },
            { name: 'premium', price: 9999, duration: 'Full day', photos: '200+ photos + full video coverage' }
          ],
          commission: '20% platform commission on photographer fee'
        },
        {
          serviceType: 'marketing_boost',
          name: 'Marketing Boost',
          description: 'Promote your event to targeted audience',
          tiers: [
            { name: 'basic', price: 499, impressions: '5,000', reach: 'Local area' },
            { name: 'standard', price: 1499, impressions: '15,000', reach: 'City-wide' },
            { name: 'premium', price: 2999, impressions: '50,000', reach: 'Regional', features: ['Social media ads', 'Email campaigns'] }
          ]
        },
        {
          serviceType: 'certificate_generation',
          name: 'Certificate Generation',
          description: 'Generate branded certificates for participants',
          pricing: [
            { quantity: 'Up to 50', price: '₹10/certificate', total: '₹500' },
            { quantity: '51-100', price: '₹8/certificate', total: '₹800' },
            { quantity: '101-500', price: '₹7/certificate', total: '₹3,500' },
            { quantity: '500+', price: '₹5/certificate', total: 'Custom quote' }
          ]
        },
        {
          serviceType: 'sms_notifications',
          name: 'SMS Notifications',
          description: 'Send SMS updates to participants',
          packages: [
            { name: '1,000 SMS', price: 999, perSMS: '₹1.00' },
            { name: '5,000 SMS', price: 4499, perSMS: '₹0.90' },
            { name: '10,000 SMS', price: 7999, perSMS: '₹0.80' }
          ]
        }
      ],
      player: [
        {
          serviceType: 'premium_profile',
          name: 'Premium Player Profile',
          description: 'Enhance your visibility with verified profile',
          price: 299,
          period: 'yearly',
          features: [
            'Verified badge',
            'Portfolio with stats and achievements',
            'Video highlights',
            'Higher visibility to scouts/teams',
            'Priority event notifications',
            'Custom profile URL'
          ]
        },
        {
          serviceType: 'performance_analytics',
          name: 'Performance Analytics',
          description: 'Track your personal stats across all events',
          price: 499,
          period: 'yearly',
          features: [
            'Detailed performance stats',
            'Match-by-match analysis',
            'Progress tracking',
            'Comparison with peers',
            'Performance graphs',
            'Export reports'
          ]
        },
        {
          serviceType: 'player_insurance',
          name: 'Player Insurance',
          description: 'Get injury coverage during events',
          tiers: [
            { name: 'basic', price: 1499, coverage: '₹50,000', features: ['Minor injury coverage', 'Valid for registered events only'] },
            { name: 'comprehensive', price: 1999, coverage: '₹2,00,000', features: ['Major injury coverage', 'Training injuries included', 'Cashless hospitalization'] }
          ],
          period: 'yearly'
        }
      ]
    };

    if (category && products[category]) {
      return res.json({
        success: true,
        category,
        products: products[category]
      });
    }

    res.json({
      success: true,
      products
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get user's VAS purchases
 */
async function getMyVASPurchases(req, res) {
  try {
    const userId = req.session.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.serviceType) filters.serviceType = req.query.serviceType;

    const result = await getUserVASPurchases(userId, filters);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Purchase Event Insurance (Organizer)
 */
async function buyEventInsurance(req, res) {
  try {
    const userId = req.session.user?._id;
    const userRole = req.session.user?.role;

    if (!userId || userRole !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Only organizers can purchase event insurance'
      });
    }

    const { eventId, insuranceType } = req.body;

    if (!eventId || !insuranceType) {
      return res.status(400).json({
        success: false,
        error: 'Event ID and insurance type are required'
      });
    }

    const result = await purchaseEventInsurance(userId, eventId, insuranceType);

    // Apply plan-based discount
    const plan = req.session.user?.subscription?.plan || 'free';
    applyVASDiscount(result, plan);

    if (result.success) {
      res.json({
        success: true,
        message: 'Event insurance purchased successfully',
        purchase: result.purchase,
        originalPrice: result.originalPrice,
        discountApplied: result.discountApplied,
        finalPrice: result.finalPrice
      });
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Purchase Marketing Boost (Organizer)
 */
async function buyMarketingBoost(req, res) {
  try {
    const userId = req.session.user?._id;
    const userRole = req.session.user?.role;

    if (!userId || userRole !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Only organizers can purchase marketing boost'
      });
    }

    const { eventId, boostType } = req.body;

    if (!eventId || !boostType) {
      return res.status(400).json({
        success: false,
        error: 'Event ID and boost type are required'
      });
    }

    const result = await purchaseMarketingBoost(userId, eventId, boostType);

    // Apply plan-based discount
    const plan = req.session.user?.subscription?.plan || 'free';
    applyVASDiscount(result, plan);

    if (result.success) {
      res.json({
        success: true,
        message: 'Marketing boost activated',
        purchase: result.purchase,
        originalPrice: result.originalPrice,
        discountApplied: result.discountApplied,
        finalPrice: result.finalPrice
      });
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Purchase Certificate Generation Package (Organizer)
 */
async function buyCertificates(req, res) {
  try {
    const userId = req.session.user?._id;
    const userRole = req.session.user?.role;

    if (!userId || userRole !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Only organizers can purchase certificate generation'
      });
    }

    const { eventId, certificateCount } = req.body;

    if (!eventId || !certificateCount || certificateCount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Event ID and valid certificate count are required'
      });
    }

    const result = await purchaseCertificateGeneration(userId, eventId, certificateCount);

    // Apply plan-based discount
    const plan = req.session.user?.subscription?.plan || 'free';
    applyVASDiscount(result, plan);

    if (result.success) {
      res.json({
        success: true,
        message: `Certificate package for ${certificateCount} certificates purchased`,
        purchase: result.purchase,
        originalPrice: result.originalPrice,
        discountApplied: result.discountApplied,
        finalPrice: result.finalPrice
      });
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Purchase SMS Notification Package (Organizer)
 */
async function buySMSPackage(req, res) {
  try {
    const userId = req.session.user?._id;
    const userRole = req.session.user?.role;

    if (!userId || userRole !== 'organizer') {
      return res.status(403).json({
        success: false,
        error: 'Only organizers can purchase SMS packages'
      });
    }

    const { eventId, smsCount } = req.body;

    if (!eventId || !smsCount || smsCount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Event ID and valid SMS count are required'
      });
    }

    const result = await purchaseSMSPackage(userId, eventId, smsCount);

    // Apply plan-based discount
    const plan = req.session.user?.subscription?.plan || 'free';
    applyVASDiscount(result, plan);

    if (result.success) {
      res.json({
        success: true,
        message: `SMS package for ${smsCount} messages purchased`,
        purchase: result.purchase,
        originalPrice: result.originalPrice,
        discountApplied: result.discountApplied,
        finalPrice: result.finalPrice
      });
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Purchase Premium Player Profile (Player)
 */
async function buyPremiumProfile(req, res) {
  try {
    const userId = req.session.user?._id;
    const userRole = req.session.user?.role;

    if (!userId || userRole !== 'player') {
      return res.status(403).json({
        success: false,
        error: 'Only players can purchase premium profile'
      });
    }

    const result = await purchasePremiumProfile(userId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Premium profile activated for 1 year',
        purchase: result.purchase
      });
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Purchase Performance Analytics (Player)
 */
async function buyPerformanceAnalytics(req, res) {
  try {
    const userId = req.session.user?._id;
    const userRole = req.session.user?.role;

    if (!userId || userRole !== 'player') {
      return res.status(403).json({
        success: false,
        error: 'Only players can purchase performance analytics'
      });
    }

    const result = await purchasePerformanceAnalytics(userId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Performance analytics activated for 1 year',
        purchase: result.purchase
      });
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Purchase Player Insurance (Player)
 */
async function buyPlayerInsurance(req, res) {
  try {
    const userId = req.session.user?._id;
    const userRole = req.session.user?.role;

    if (!userId || userRole !== 'player') {
      return res.status(403).json({
        success: false,
        error: 'Only players can purchase player insurance'
      });
    }

    const { insurancePlan } = req.body;

    if (!insurancePlan || !['basic', 'comprehensive'].includes(insurancePlan)) {
      return res.status(400).json({
        success: false,
        error: 'Valid insurance plan (basic/comprehensive) is required'
      });
    }

    const result = await purchasePlayerInsurance(userId, insurancePlan);

    if (result.success) {
      res.json({
        success: true,
        message: `${insurancePlan} player insurance activated for 1 year`,
        purchase: result.purchase
      });
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Cancel VAS purchase
 */
async function cancelVAS(req, res) {
  try {
    const userId = req.session.user?._id;
    const purchaseId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const result = await cancelVASPurchase(purchaseId, userId);

    if (result.success) {
      res.json({
        success: true,
        message: 'Purchase cancelled successfully',
        refundAmount: result.refundAmount
      });
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get VAS revenue (Admin only)
 */
async function getVASRevenueStats(req, res) {
  try {
    const userRole = req.session.user?.role;

    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;

    const result = await getVASRevenue(startDate, endDate);

    res.json(result);

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Check if user has specific VAS active
 */
async function checkVASStatus(req, res) {
  try {
    const userId = req.session.user?._id;
    const serviceType = req.params.serviceType;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const hasService = await VAS.hasActiveService(userId, serviceType);
    const service = hasService ? await VAS.getActiveService(userId, serviceType) : null;

    res.json({
      success: true,
      hasService,
      service
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  getVASProducts,
  getMyVASPurchases,
  buyEventInsurance,
  buyMarketingBoost,
  buyCertificates,
  buySMSPackage,
  buyPremiumProfile,
  buyPerformanceAnalytics,
  buyPlayerInsurance,
  cancelVAS,
  getVASRevenueStats,
  checkVASStatus
};
