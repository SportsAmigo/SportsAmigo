const Subscription = require('./schemas/subscriptionSchema');
const User = require('./schemas/userSchema');
const mongoose = require('mongoose');

/**
 * Subscription model for managing premium organizer plans
 */
module.exports = {
  /**
   * Create a new subscription
   * @param {object} subscriptionData - Subscription data
   * @returns {Promise<object>} - Promise resolving to the created subscription
   */
  createSubscription: async function(subscriptionData) {
    try {
      const subscription = new Subscription(subscriptionData);
      const saved = await subscription.save();
      
      // Update user subscription info
      await User.findByIdAndUpdate(subscriptionData.user, {
        'subscription.plan': subscriptionData.plan,
        'subscription.startDate': saved.startDate,
        'subscription.endDate': saved.endDate,
        'subscription.status': 'active'
      });
      
      return saved;
    } catch (err) {
      console.error('Error creating subscription:', err);
      throw err;
    }
  },

  /**
   * Get subscription by ID
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<object>} - Promise resolving to the subscription
   */
  getSubscriptionById: async function(subscriptionId) {
    try {
      return await Subscription.findById(subscriptionId)
        .populate('user', 'first_name last_name email organizerTier');
    } catch (err) {
      console.error('Error getting subscription by ID:', err);
      throw err;
    }
  },

  /**
   * Get active subscription for a user
   * @param {string} userId - User ID
   * @returns {Promise<object>} - Promise resolving to the active subscription
   */
  getUserSubscription: async function(userId) {
    try {
      return await Subscription.findOne({
        user: userId,
        status: 'active',
        endDate: { $gte: new Date() }
      }).sort({ createdAt: -1 });
    } catch (err) {
      console.error('Error getting user subscription:', err);
      throw err;
    }
  },

  /**
   * Get all subscriptions for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Promise resolving to array of subscriptions
   */
  getUserSubscriptionHistory: async function(userId) {
    try {
      return await Subscription.find({ user: userId })
        .sort({ createdAt: -1 });
    } catch (err) {
      console.error('Error getting subscription history:', err);
      throw err;
    }
  },

  /**
   * Update subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} - Promise resolving to updated subscription
   */
  updateSubscription: async function(subscriptionId, updateData) {
    try {
      return await Subscription.findByIdAndUpdate(
        subscriptionId,
        { ...updateData, updatedAt: Date.now() },
        { new: true }
      );
    } catch (err) {
      console.error('Error updating subscription:', err);
      throw err;
    }
  },

  /**
   * Cancel subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<object>} - Promise resolving to cancelled subscription
   */
  cancelSubscription: async function(subscriptionId, reason = '') {
    try {
      const subscription = await Subscription.findByIdAndUpdate(
        subscriptionId,
        {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: reason,
          autoRenew: false
        },
        { new: true }
      );

      // Update user subscription status
      if (subscription) {
        await User.findByIdAndUpdate(subscription.user, {
          'subscription.status': 'cancelled'
        });
      }

      return subscription;
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      throw err;
    }
  },

  /**
   * Renew subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {object} paymentData - Payment information
   * @returns {Promise<object>} - Promise resolving to renewed subscription
   */
  renewSubscription: async function(subscriptionId, paymentData) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Calculate new dates
      const newStartDate = new Date(subscription.endDate);
      const newEndDate = new Date(newStartDate);
      
      if (subscription.billingCycle === 'yearly') {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1);
      } else {
        newEndDate.setMonth(newEndDate.getMonth() + 1);
      }

      // Add payment to history
      subscription.paymentHistory.push({
        amount: paymentData.amount,
        paymentDate: new Date(),
        paymentMethod: paymentData.method,
        transactionId: paymentData.transactionId,
        status: 'success'
      });

      subscription.startDate = newStartDate;
      subscription.endDate = newEndDate;
      subscription.status = 'active';
      subscription.usage.eventsCreated = 0; // Reset usage
      subscription.usage.featuredListingsUsed = 0;
      subscription.usage.resetDate = newEndDate;

      const renewed = await subscription.save();

      // Update user subscription info
      await User.findByIdAndUpdate(subscription.user, {
        'subscription.startDate': newStartDate,
        'subscription.endDate': newEndDate,
        'subscription.status': 'active'
      });

      return renewed;
    } catch (err) {
      console.error('Error renewing subscription:', err);
      throw err;
    }
  },

  /**
   * Upgrade subscription plan
   * @param {string} userId - User ID
   * @param {string} newPlan - New plan type
   * @param {object} paymentData - Payment information
   * @returns {Promise<object>} - Promise resolving to upgraded subscription
   */
  upgradeSubscription: async function(userId, newPlan, paymentData) {
    try {
      const currentSubscription = await this.getUserSubscription(userId);
      
      if (currentSubscription) {
        // Cancel current subscription
        await this.cancelSubscription(currentSubscription._id, 'Upgraded to ' + newPlan);
      }

      // Create new subscription with upgraded plan
      const newSubscription = await this.createSubscription({
        user: userId,
        plan: newPlan,
        billingCycle: paymentData.billingCycle || 'monthly',
        paymentHistory: [{
          amount: paymentData.amount,
          paymentDate: new Date(),
          paymentMethod: paymentData.method,
          transactionId: paymentData.transactionId,
          status: 'success'
        }]
      });

      return newSubscription;
    } catch (err) {
      console.error('Error upgrading subscription:', err);
      throw err;
    }
  },

  /**
   * Check if user can create event based on subscription limits
   * @param {string} userId - User ID
   * @returns {Promise<object>} - Promise resolving to { canCreate: boolean, reason: string }
   */
  canUserCreateEvent: async function(userId) {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) {
        // No active subscription, check free tier limits
        const user = await User.findById(userId);
        if (user && user.subscription && user.subscription.plan === 'free') {
          // Free tier: 3 events per month
          // This would require tracking monthly event count
          return { canCreate: true, reason: 'Free tier' };
        }
        return { canCreate: true, reason: 'Free tier' };
      }

      if (!subscription.isValid()) {
        return { canCreate: false, reason: 'Subscription expired' };
      }

      if (subscription.canCreateEvent()) {
        return { canCreate: true, reason: 'Within subscription limits' };
      }

      return { 
        canCreate: false, 
        reason: `Monthly event limit reached (${subscription.features.maxEvents} events)` 
      };
    } catch (err) {
      console.error('Error checking event creation eligibility:', err);
      throw err;
    }
  },

  /**
   * Increment event usage for subscription
   * @param {string} userId - User ID
   * @returns {Promise<object>} - Promise resolving to updated subscription
   */
  incrementEventUsage: async function(userId) {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (subscription) {
        subscription.usage.eventsCreated += 1;
        return await subscription.save();
      }
      
      return null;
    } catch (err) {
      console.error('Error incrementing event usage:', err);
      throw err;
    }
  },

  /**
   * Get all active subscriptions
   * @returns {Promise<Array>} - Promise resolving to array of active subscriptions
   */
  getActiveSubscriptions: async function() {
    try {
      return await Subscription.find({
        status: 'active',
        endDate: { $gte: new Date() }
      })
        .populate('user', 'first_name last_name email')
        .sort({ endDate: 1 });
    } catch (err) {
      console.error('Error getting active subscriptions:', err);
      throw err;
    }
  },

  /**
   * Get expiring subscriptions
   * @param {number} days - Number of days ahead to check
   * @returns {Promise<Array>} - Promise resolving to subscriptions expiring soon
   */
  getExpiringSubscriptions: async function(days = 7) {
    try {
      const now = new Date();
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);

      return await Subscription.find({
        status: 'active',
        endDate: { $gte: now, $lte: futureDate }
      })
        .populate('user', 'first_name last_name email')
        .sort({ endDate: 1 });
    } catch (err) {
      console.error('Error getting expiring subscriptions:', err);
      throw err;
    }
  },

  /**
   * Get subscription revenue statistics
   * @param {object} filters - Optional filters
   * @returns {Promise<object>} - Promise resolving to revenue stats
   */
  getSubscriptionRevenue: async function(filters = {}) {
    try {
      const query = { status: 'active' };
      
      if (filters.plan) {
        query.plan = filters.plan;
      }

      const subscriptions = await Subscription.find(query);
      
      const stats = {
        totalSubscriptions: subscriptions.length,
        byPlan: {
          free: 0,
          pro: 0,
          enterprise: 0
        },
        monthlyRevenue: 0,
        yearlyRevenue: 0
      };

      subscriptions.forEach(sub => {
        stats.byPlan[sub.plan] += 1;
        
        if (sub.billingCycle === 'monthly') {
          stats.monthlyRevenue += sub.pricing.monthly || 0;
        } else {
          stats.yearlyRevenue += sub.pricing.yearly || 0;
          stats.monthlyRevenue += (sub.pricing.yearly || 0) / 12; // Amortized monthly
        }
      });

      return stats;
    } catch (err) {
      console.error('Error calculating subscription revenue:', err);
      throw err;
    }
  }
};
