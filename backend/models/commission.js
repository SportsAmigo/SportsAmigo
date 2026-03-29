const Commission = require('./schemas/commissionSchema');
const mongoose = require('mongoose');

/**
 * Commission model for tracking platform revenue
 */
module.exports = {
  /**
   * Create a new commission record
   * @param {object} commissionData - Commission data
   * @returns {Promise<object>} - Promise resolving to the created commission
   */
  createCommission: async function(commissionData) {
    try {
      const commission = new Commission(commissionData);
      return await commission.save();
    } catch (err) {
      console.error('Error creating commission:', err);
      throw err;
    }
  },

  /**
   * Get commission by ID
   * @param {string} commissionId - Commission ID
   * @returns {Promise<object>} - Promise resolving to the commission
   */
  getCommissionById: async function(commissionId) {
    try {
      return await Commission.findById(commissionId)
        .populate('event')
        .populate('organizer', 'first_name last_name email');
    } catch (err) {
      console.error('Error getting commission by ID:', err);
      throw err;
    }
  },

  /**
   * Get commissions for an event
   * @param {string} eventId - Event ID
   * @returns {Promise<Array>} - Promise resolving to array of commissions
   */
  getCommissionsByEvent: async function(eventId) {
    try {
      return await Commission.find({ event: eventId })
        .populate('organizer', 'first_name last_name email')
        .sort({ createdAt: -1 });
    } catch (err) {
      console.error('Error getting commissions by event:', err);
      throw err;
    }
  },

  /**
   * Get commissions for an organizer
   * @param {string} organizerId - Organizer ID
   * @returns {Promise<Array>} - Promise resolving to array of commissions
   */
  getCommissionsByOrganizer: async function(organizerId) {
    try {
      return await Commission.find({ organizer: organizerId })
        .populate('event', 'title event_date')
        .sort({ createdAt: -1 });
    } catch (err) {
      console.error('Error getting commissions by organizer:', err);
      throw err;
    }
  },

  /**
   * Get total platform revenue
   * @param {object} filters - Optional filters (date range, status, etc.)
   * @returns {Promise<object>} - Promise resolving to revenue statistics
   */
  getPlatformRevenue: async function(filters = {}) {
    try {
      const query = {};
      
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
        if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
      }
      
      if (filters.status) {
        query.status = filters.status;
      }

      const commissions = await Commission.find(query);
      
      const stats = {
        totalRevenue: 0,
        totalCommission: 0,
        totalPayout: 0,
        totalTransactions: commissions.length,
        byStatus: {}
      };

      commissions.forEach(comm => {
        stats.totalRevenue += comm.totalRevenue || 0;
        stats.totalCommission += comm.commissionAmount || 0;
        stats.totalPayout += comm.organizerPayout || 0;
        
        if (!stats.byStatus[comm.status]) {
          stats.byStatus[comm.status] = {
            count: 0,
            commission: 0
          };
        }
        stats.byStatus[comm.status].count += 1;
        stats.byStatus[comm.status].commission += comm.commissionAmount || 0;
      });

      return stats;
    } catch (err) {
      console.error('Error calculating platform revenue:', err);
      throw err;
    }
  },

  /**
   * Get organizer earnings summary
   * @param {string} organizerId - Organizer ID
   * @returns {Promise<object>} - Promise resolving to earnings summary
   */
  getOrganizerEarnings: async function(organizerId) {
    try {
      const commissions = await Commission.find({ organizer: organizerId });
      
      const earnings = {
        totalRevenue: 0,
        totalCommission: 0,
        totalPayout: 0,
        pendingPayout: 0,
        paidPayout: 0,
        totalEvents: commissions.length
      };

      commissions.forEach(comm => {
        earnings.totalRevenue += comm.totalRevenue || 0;
        earnings.totalCommission += comm.commissionAmount || 0;
        earnings.totalPayout += comm.organizerPayout || 0;
        
        if (comm.status === 'pending' || comm.status === 'processing') {
          earnings.pendingPayout += comm.organizerPayout || 0;
        } else if (comm.status === 'paid') {
          earnings.paidPayout += comm.organizerPayout || 0;
        }
      });

      return earnings;
    } catch (err) {
      console.error('Error calculating organizer earnings:', err);
      throw err;
    }
  },

  /**
   * Update commission status
   * @param {string} commissionId - Commission ID
   * @param {string} status - New status
   * @param {object} additionalData - Additional data to update
   * @returns {Promise<object>} - Promise resolving to updated commission
   */
  updateCommissionStatus: async function(commissionId, status, additionalData = {}) {
    try {
      const updateData = { status, ...additionalData };
      
      if (status === 'paid') {
        updateData.payoutDate = new Date();
      }

      return await Commission.findByIdAndUpdate(
        commissionId,
        updateData,
        { new: true }
      );
    } catch (err) {
      console.error('Error updating commission status:', err);
      throw err;
    }
  },

  /**
   * Get commissions eligible for payout
   * @returns {Promise<Array>} - Promise resolving to array of eligible commissions
   */
  getEligibleForPayout: async function() {
    try {
      const now = new Date();
      return await Commission.find({
        status: 'pending',
        eligibleForPayoutAt: { $lte: now }
      })
        .populate('event', 'title event_date')
        .populate('organizer', 'first_name last_name email phone')
        .sort({ eligibleForPayoutAt: 1 });
    } catch (err) {
      console.error('Error getting eligible payouts:', err);
      throw err;
    }
  }
};
