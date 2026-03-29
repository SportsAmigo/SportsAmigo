/**
 * Value-Added Services (VAS) Model
 * 
 * Handles all value-added service purchases and management
 */

const VAS = require('./schemas/vasSchema');

/**
 * Create a new VAS purchase
 */
async function createVASPurchase(purchaseData) {
  try {
    // Calculate price based on service type and tier
    if (!purchaseData.price) {
      const tier = purchaseData.serviceDetails?.insuranceType || 
                   purchaseData.serviceDetails?.boostType || 
                   'basic';
      purchaseData.price = VAS.getPricing(purchaseData.serviceType, tier);
    }
    
    const vasPurchase = new VAS(purchaseData);
    await vasPurchase.save();
    
    return {
      success: true,
      purchase: vasPurchase
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get user's VAS purchases
 */
async function getUserVASPurchases(userId, filters = {}) {
  try {
    const query = { userId, ...filters };
    
    const purchases = await VAS.find(query)
      .populate('eventId', 'eventName date venue')
      .sort({ createdAt: -1 });
    
    return {
      success: true,
      purchases
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Purchase Event Insurance
 */
async function purchaseEventInsurance(userId, eventId, insuranceType = 'basic') {
  try {
    // Check if insurance already exists for this event
    const existing = await VAS.findOne({
      userId,
      eventId,
      serviceType: 'event_insurance',
      status: 'active'
    });
    
    if (existing) {
      return {
        success: false,
        error: 'Insurance already purchased for this event'
      };
    }
    
    const price = VAS.getPricing('event_insurance', insuranceType);
    
    const coverage = {
      basic: 100000,
      standard: 250000,
      premium: 500000
    };
    
    const purchase = await createVASPurchase({
      userId,
      eventId,
      serviceType: 'event_insurance',
      serviceCategory: 'organizer',
      price,
      subscriptionPeriod: 'one_time',
      serviceDetails: {
        insuranceType,
        coverageAmount: coverage[insuranceType],
        policyNumber: `INS-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`
      }
    });
    
    return purchase;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Purchase Marketing Boost
 */
async function purchaseMarketingBoost(userId, eventId, boostType = 'basic') {
  try {
    const price = VAS.getPricing('marketing_boost', boostType);
    
    const impressionsTarget = {
      basic: 5000,
      standard: 15000,
      premium: 50000
    };
    
    const purchase = await createVASPurchase({
      userId,
      eventId,
      serviceType: 'marketing_boost',
      serviceCategory: 'organizer',
      price,
      subscriptionPeriod: 'one_time',
      serviceDetails: {
        boostType,
        targetAudience: 'All sports enthusiasts in region',
        impressions: 0,
        clicks: 0,
        conversions: 0
      }
    });
    
    return purchase;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Purchase Certificate Generation Package
 */
async function purchaseCertificateGeneration(userId, eventId, certificateCount) {
  try {
    let price;
    
    if (certificateCount <= 50) {
      price = certificateCount * 10;
    } else if (certificateCount <= 100) {
      price = 400 + (certificateCount - 50) * 10;
    } else if (certificateCount <= 500) {
      price = 700;
    } else {
      price = 2500 + Math.ceil((certificateCount - 500) / 100) * 500;
    }
    
    const purchase = await createVASPurchase({
      userId,
      eventId,
      serviceType: 'certificate_generation',
      serviceCategory: 'organizer',
      price,
      subscriptionPeriod: 'one_time',
      serviceDetails: {
        certificateCount,
        generatedCount: 0,
        templateId: 'default'
      },
      usage: {
        remainingUsage: certificateCount
      }
    });
    
    return purchase;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Purchase SMS Notification Package
 */
async function purchaseSMSPackage(userId, eventId, smsCount) {
  try {
    let price;
    let packageType;
    
    if (smsCount <= 1000) {
      price = 999;
      packageType = 'package1000';
    } else if (smsCount <= 5000) {
      price = 4499;
      packageType = 'package5000';
    } else {
      price = 7999 + Math.ceil((smsCount - 10000) / 1000) * 80;
      packageType = 'package10000';
    }
    
    const purchase = await createVASPurchase({
      userId,
      eventId,
      serviceType: 'sms_notifications',
      serviceCategory: 'organizer',
      price,
      subscriptionPeriod: 'one_time',
      serviceDetails: {
        smsCount,
        smsUsed: 0
      },
      usage: {
        remainingUsage: smsCount
      }
    });
    
    return purchase;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Purchase Premium Player Profile
 */
async function purchasePremiumProfile(userId) {
  try {
    // Check if user already has active premium profile
    const existing = await VAS.getActiveService(userId, 'premium_profile');
    
    if (existing) {
      return {
        success: false,
        error: 'Premium profile already active'
      };
    }
    
    const price = VAS.getPricing('premium_profile', 'yearly');
    
    const purchase = await createVASPurchase({
      userId,
      serviceType: 'premium_profile',
      serviceCategory: 'player',
      price,
      subscriptionPeriod: 'yearly',
      autoRenew: true,
      serviceDetails: {
        features: ['verified_badge', 'portfolio', 'stats', 'videos', 'priority_notifications'],
        profileUrl: `/player/profile/${userId}?premium=true`
      }
    });
    
    return purchase;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Purchase Performance Analytics
 */
async function purchasePerformanceAnalytics(userId) {
  try {
    const existing = await VAS.getActiveService(userId, 'performance_analytics');
    
    if (existing) {
      return {
        success: false,
        error: 'Performance analytics already active'
      };
    }
    
    const price = VAS.getPricing('performance_analytics', 'yearly');
    
    const purchase = await createVASPurchase({
      userId,
      serviceType: 'performance_analytics',
      serviceCategory: 'player',
      price,
      subscriptionPeriod: 'yearly',
      autoRenew: true,
      serviceDetails: {
        eventsTracked: 0,
        analyticsEnabled: true
      }
    });
    
    return purchase;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Purchase Player Insurance
 */
async function purchasePlayerInsurance(userId, insurancePlan = 'basic') {
  try {
    const existing = await VAS.getActiveService(userId, 'player_insurance');
    
    if (existing) {
      return {
        success: false,
        error: 'Player insurance already active'
      };
    }
    
    const price = VAS.getPricing('player_insurance', insurancePlan);
    
    const coverageDetails = {
      basic: 'Covers minor injuries during registered events. Max coverage: ₹50,000',
      comprehensive: 'Covers all injuries including major accidents. Max coverage: ₹2,00,000'
    };
    
    const purchase = await createVASPurchase({
      userId,
      serviceType: 'player_insurance',
      serviceCategory: 'player',
      price,
      subscriptionPeriod: 'yearly',
      autoRenew: true,
      serviceDetails: {
        insurancePlan,
        coverageDetails: coverageDetails[insurancePlan],
        policyNumber: `PLY-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`
      }
    });
    
    return purchase;
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Cancel VAS purchase/subscription
 */
async function cancelVASPurchase(purchaseId, userId) {
  try {
    const purchase = await VAS.findOne({
      _id: purchaseId,
      userId
    });
    
    if (!purchase) {
      return {
        success: false,
        error: 'Purchase not found'
      };
    }
    
    if (purchase.status === 'cancelled' || purchase.status === 'completed') {
      return {
        success: false,
        error: 'Purchase already cancelled or completed'
      };
    }
    
    purchase.status = 'cancelled';
    purchase.autoRenew = false;
    await purchase.save();
    
    // Calculate refund if applicable (prorated for subscriptions)
    let refundAmount = 0;
    if (purchase.subscriptionPeriod !== 'one_time' && purchase.endDate) {
      const totalDays = (purchase.endDate - purchase.startDate) / (1000 * 60 * 60 * 24);
      const remainingDays = (purchase.endDate - new Date()) / (1000 * 60 * 60 * 24);
      
      if (remainingDays > 0) {
        refundAmount = Math.floor((purchase.price * remainingDays) / totalDays);
      }
    }
    
    return {
      success: true,
      purchase,
      refundAmount
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get VAS revenue statistics
 */
async function getVASRevenue(startDate, endDate) {
  try {
    const match = {
      paymentStatus: 'completed',
      createdAt: {
        $gte: startDate || new Date(0),
        $lte: endDate || new Date()
      }
    };
    
    const revenue = await VAS.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$serviceType',
          totalRevenue: { $sum: '$price' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
    
    const totalRevenue = revenue.reduce((sum, item) => sum + item.totalRevenue, 0);
    
    return {
      success: true,
      revenue,
      totalRevenue,
      startDate,
      endDate
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  VAS,
  createVASPurchase,
  getUserVASPurchases,
  purchaseEventInsurance,
  purchaseMarketingBoost,
  purchaseCertificateGeneration,
  purchaseSMSPackage,
  purchasePremiumProfile,
  purchasePerformanceAnalytics,
  purchasePlayerInsurance,
  cancelVASPurchase,
  getVASRevenue
};
