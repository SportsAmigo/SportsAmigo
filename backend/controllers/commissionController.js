const { Commission, Event, User } = require('../models');

/**
 * Commission Controller
 * Handles commission tracking and payout management
 */

/**
 * Create commission record for an event registration
 */
exports.createCommission = async (req, res) => {
  try {
    const { eventId, organizerId, totalRevenue, commissionRate } = req.body;

    const commission = await Commission.createCommission({
      event: eventId,
      organizer: organizerId,
      totalRevenue,
      commissionRate: commissionRate || 15
    });

    // Update event revenue
    await Event.updateEvent(eventId, {
      'revenue.totalCollected': totalRevenue,
      'revenue.platformCommission': commission.commissionAmount,
      'revenue.organizerPayout': commission.organizerPayout
    });

    res.json({
      success: true,
      message: 'Commission created successfully',
      data: commission
    });
  } catch (error) {
    console.error('Error creating commission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create commission',
      error: error.message
    });
  }
};

/**
 * Get platform revenue dashboard
 */
exports.getRevenueDashboard = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;

    const filters = {};
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (status) filters.status = status;

    const revenueStats = await Commission.getPlatformRevenue(filters);

    res.json({
      success: true,
      data: revenueStats
    });
  } catch (error) {
    console.error('Error getting revenue dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get revenue dashboard',
      error: error.message
    });
  }
};

/**
 * Get organizer earnings
 */
exports.getOrganizerEarnings = async (req, res) => {
  try {
    const organizerId = req.params.organizerId || req.user._id;

    const earnings = await Commission.getOrganizerEarnings(organizerId);
    const commissions = await Commission.getCommissionsByOrganizer(organizerId);

    res.json({
      success: true,
      data: {
        summary: earnings,
        commissions: commissions
      }
    });
  } catch (error) {
    console.error('Error getting organizer earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get organizer earnings',
      error: error.message
    });
  }
};

/**
 * Get commissions for a specific event
 */
exports.getEventCommissions = async (req, res) => {
  try {
    const { eventId } = req.params;

    const commissions = await Commission.getCommissionsByEvent(eventId);

    res.json({
      success: true,
      data: commissions
    });
  } catch (error) {
    console.error('Error getting event commissions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get event commissions',
      error: error.message
    });
  }
};

/**
 * Update commission status (for admin)
 */
exports.updateCommissionStatus = async (req, res) => {
  try {
    const { commissionId } = req.params;
    const { status, payoutMethod, payoutReference, notes } = req.body;

    // Only admin can update commission status
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update commission status'
      });
    }

    const updatedCommission = await Commission.updateCommissionStatus(
      commissionId,
      status,
      { payoutMethod, payoutReference, notes }
    );

    res.json({
      success: true,
      message: 'Commission status updated successfully',
      data: updatedCommission
    });
  } catch (error) {
    console.error('Error updating commission status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update commission status',
      error: error.message
    });
  }
};

/**
 * Get commissions eligible for payout
 */
exports.getEligiblePayouts = async (req, res) => {
  try {
    // Only admin can access this
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can access payout information'
      });
    }

    const eligibleCommissions = await Commission.getEligibleForPayout();

    res.json({
      success: true,
      data: eligibleCommissions
    });
  } catch (error) {
    console.error('Error getting eligible payouts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get eligible payouts',
      error: error.message
    });
  }
};

/**
 * Process bulk payouts
 */
exports.processBulkPayouts = async (req, res) => {
  try {
    // Only admin can process payouts
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can process payouts'
      });
    }

    const { commissionIds, payoutMethod } = req.body;

    const results = [];

    for (const commissionId of commissionIds) {
      try {
        const updated = await Commission.updateCommissionStatus(
          commissionId,
          'paid',
          { 
            payoutMethod,
            payoutReference: `BULK_${Date.now()}_${commissionId.substring(0, 8)}`
          }
        );
        results.push({ commissionId, success: true, data: updated });
      } catch (error) {
        results.push({ commissionId, success: false, error: error.message });
      }
    }

    res.json({
      success: true,
      message: 'Bulk payout processing completed',
      results
    });
  } catch (error) {
    console.error('Error processing bulk payouts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process bulk payouts',
      error: error.message
    });
  }
};

/**
 * Get commission details by ID
 */
exports.getCommissionById = async (req, res) => {
  try {
    const { commissionId } = req.params;

    const commission = await Commission.getCommissionById(commissionId);

    if (!commission) {
      return res.status(404).json({
        success: false,
        message: 'Commission not found'
      });
    }

    // Check authorization (admin or the organizer)
    if (req.user.role !== 'admin' && commission.organizer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this commission'
      });
    }

    res.json({
      success: true,
      data: commission
    });
  } catch (error) {
    console.error('Error getting commission details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get commission details',
      error: error.message
    });
  }
};
