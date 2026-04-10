const { Subscription, User } = require('../models');

/**
 * Subscription Controller
 * Handles premium organizer subscription management
 */

/**
 * Get subscription plans
 */
exports.getPlans = async (req, res) => {
  try {
    const plans = {
      free: {
        name: 'Free',
        price: {
          monthly: 0,
          yearly: 0
        },
        features: {
          maxEvents: 3,
          commissionRate: 20,
          featuredListings: 0,
          analytics: false,
          prioritySupport: false,
          customBranding: false
        }
      },
      pro: {
        name: 'Pro',
        price: {
          monthly: 2999,
          yearly: 29999
        },
        features: {
          maxEvents: 'Unlimited',
          commissionRate: 15,
          featuredListings: 1,
          analytics: true,
          prioritySupport: true,
          customBranding: true,
          apiAccess: false,
          whiteLabel: false
        }
      },
      enterprise: {
        name: 'Enterprise',
        price: {
          monthly: 9999,
          yearly: 99999
        },
        features: {
          maxEvents: 'Unlimited',
          commissionRate: 12,
          featuredListings: 'Unlimited',
          analytics: true,
          prioritySupport: true,
          customBranding: true,
          apiAccess: true,
          whiteLabel: true,
          dedicatedSupport: true
        }
      }
    };

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error getting plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription plans',
      error: error.message
    });
  }
};

/**
 * Get current user subscription
 */
exports.getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.getUserSubscription(req.session.user._id);

    if (!subscription) {
      return res.json({
        success: true,
        data: {
          plan: 'free',
          status: 'active',
          message: 'You are on the free plan'
        }
      });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error getting subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription',
      error: error.message
    });
  }
};

/**
 * Get subscription history
 */
exports.getSubscriptionHistory = async (req, res) => {
  try {
    const history = await Subscription.getUserSubscriptionHistory(req.session.user._id);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error getting subscription history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription history',
      error: error.message
    });
  }
};

/**
 * Create new subscription
 */
exports.createSubscription = async (req, res) => {
  try {
    const { plan, billingCycle, paymentMethod, transactionId, amount } = req.body;

    // Validate plan
    if (!['pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.getUserSubscription(req.session.user._id);
    if (existingSubscription && existingSubscription.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription'
      });
    }

    // Create subscription
    const subscription = await Subscription.createSubscription({
      user: req.session.user._id,
      plan,
      billingCycle: billingCycle || 'monthly',
      paymentHistory: [{
        amount,
        paymentDate: new Date(),
        paymentMethod,
        transactionId,
        status: 'success'
      }]
    });

    res.json({
      success: true,
      message: 'Subscription created successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: error.message
    });
  }
};

/**
 * Upgrade subscription
 */
exports.upgradeSubscription = async (req, res) => {
  try {
    const { newPlan, billingCycle, paymentMethod, transactionId, amount } = req.body;

    // Validate new plan
    if (!['pro', 'enterprise'].includes(newPlan)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }

    const upgradedSubscription = await Subscription.upgradeSubscription(
      req.session.user._id,
      newPlan,
      {
        billingCycle: billingCycle || 'monthly',
        method: paymentMethod,
        transactionId,
        amount
      }
    );

    res.json({
      success: true,
      message: 'Subscription upgraded successfully',
      data: upgradedSubscription
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upgrade subscription',
      error: error.message
    });
  }
};

/**
 * Cancel subscription
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const { reason } = req.body;

    const subscription = await Subscription.getUserSubscription(req.session.user._id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    const cancelled = await Subscription.cancelSubscription(subscription._id, reason);

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: cancelled
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
      error: error.message
    });
  }
};

/**
 * Renew subscription (for manual renewal or retry)
 */
exports.renewSubscription = async (req, res) => {
  try {
    const { subscriptionId, paymentMethod, transactionId, amount } = req.body;

    const subscription = await Subscription.getSubscriptionById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Verify ownership
    if (subscription.user.toString() !== req.session.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const renewed = await Subscription.renewSubscription(subscriptionId, {
      method: paymentMethod,
      transactionId,
      amount
    });

    res.json({
      success: true,
      message: 'Subscription renewed successfully',
      data: renewed
    });
  } catch (error) {
    console.error('Error renewing subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to renew subscription',
      error: error.message
    });
  }
};

/**
 * Check if user can create event (subscription limits)
 */
exports.checkEventCreationEligibility = async (req, res) => {
  try {
    const eligibility = await Subscription.canUserCreateEvent(req.session.user._id);

    res.json({
      success: true,
      data: eligibility
    });
  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check eligibility',
      error: error.message
    });
  }
};

/**
 * Get subscription revenue dashboard (Admin only)
 */
exports.getSubscriptionRevenue = async (req, res) => {
  try {
    // Only admin can access
    if (req.session.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access subscription revenue'
      });
    }

    const { plan } = req.query;
    const filters = {};
    if (plan) filters.plan = plan;

    const revenueStats = await Subscription.getSubscriptionRevenue(filters);

    res.json({
      success: true,
      data: revenueStats
    });
  } catch (error) {
    console.error('Error getting subscription revenue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription revenue',
      error: error.message
    });
  }
};

/**
 * Get all active subscriptions (Admin only)
 */
exports.getAllActiveSubscriptions = async (req, res) => {
  try {
    // Only admin can access
    if (req.session.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access this'
      });
    }

    const subscriptions = await Subscription.getActiveSubscriptions();

    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Error getting active subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get active subscriptions',
      error: error.message
    });
  }
};

/**
 * Get expiring subscriptions (Admin only)
 */
exports.getExpiringSubscriptions = async (req, res) => {
  try {
    // Only admin can access
    if (req.session.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access this'
      });
    }

    const { days = 7 } = req.query;
    const expiring = await Subscription.getExpiringSubscriptions(parseInt(days));

    res.json({
      success: true,
      data: expiring
    });
  } catch (error) {
    console.error('Error getting expiring subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get expiring subscriptions',
      error: error.message
    });
  }
};
