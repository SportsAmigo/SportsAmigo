const { User, Event } = require('../models');

/**
 * Moderator Controller
 * Handles organizer verification, event approval, and moderation tasks
 */

/**
 * Get pending organizers for verification
 */
exports.getPendingOrganizers = async (req, res) => {
  try {
    // Only moderators and admins can access this
    if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only moderators and admins can access this'
      });
    }

    const pendingOrganizers = await User.find({
      role: 'organizer',
      verificationStatus: 'pending'
    }).sort({ created_at: -1 });

    res.json({
      success: true,
      data: pendingOrganizers
    });
  } catch (error) {
    console.error('Error getting pending organizers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending organizers',
      error: error.message
    });
  }
};

/**
 * Approve organizer
 */
exports.approveOrganizer = async (req, res) => {
  try {
    // Only moderators and admins can approve
    if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only moderators and admins can approve organizers'
      });
    }

    const { organizerId } = req.params;
    const { notes } = req.body;

    const organizer = await User.findByIdAndUpdate(
      organizerId,
      {
        verificationStatus: 'verified',
        'verificationDocuments.reviewedAt': new Date(),
        'verificationDocuments.reviewedBy': req.user._id
      },
      { new: true }
    );

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    // TODO: Send email notification to organizer

    res.json({
      success: true,
      message: 'Organizer approved successfully',
      data: organizer
    });
  } catch (error) {
    console.error('Error approving organizer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve organizer',
      error: error.message
    });
  }
};

/**
 * Reject organizer
 */
exports.rejectOrganizer = async (req, res) => {
  try {
    // Only moderators and admins can reject
    if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only moderators and admins can reject organizers'
      });
    }

    const { organizerId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const organizer = await User.findByIdAndUpdate(
      organizerId,
      {
        verificationStatus: 'rejected',
        'verificationDocuments.reviewedAt': new Date(),
        'verificationDocuments.reviewedBy': req.user._id,
        'verificationDocuments.rejectionReason': reason
      },
      { new: true }
    );

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    // TODO: Send email notification to organizer with reason

    res.json({
      success: true,
      message: 'Organizer rejected',
      data: organizer
    });
  } catch (error) {
    console.error('Error rejecting organizer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject organizer',
      error: error.message
    });
  }
};

/**
 * Suspend organizer
 */
exports.suspendOrganizer = async (req, res) => {
  try {
    // Only admins can suspend
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can suspend organizers'
      });
    }

    const { organizerId } = req.params;
    const { reason } = req.body;

    const organizer = await User.findByIdAndUpdate(
      organizerId,
      {
        verificationStatus: 'suspended',
        'verificationDocuments.rejectionReason': reason
      },
      { new: true }
    );

    if (!organizer) {
      return res.status(404).json({
        success: false,
        message: 'Organizer not found'
      });
    }

    // Cancel all upcoming events from this organizer
    await Event.updateMany(
      {
        organizer_id: organizerId,
        status: { $in: ['pending_approval', 'approved', 'upcoming'] }
      },
      {
        status: 'cancelled'
      }
    );

    res.json({
      success: true,
      message: 'Organizer suspended and events cancelled',
      data: organizer
    });
  } catch (error) {
    console.error('Error suspending organizer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend organizer',
      error: error.message
    });
  }
};

/**
 * Get pending events for approval
 */
exports.getPendingEvents = async (req, res) => {
  try {
    // Only moderators and admins can access this
    if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only moderators and admins can access this'
      });
    }

    const pendingEvents = await Event.find({
      status: 'pending_approval'
    })
      .populate('organizer_id', 'first_name last_name email organizerTier verificationStatus')
      .sort({ created_at: -1 });

    res.json({
      success: true,
      data: pendingEvents
    });
  } catch (error) {
    console.error('Error getting pending events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get pending events',
      error: error.message
    });
  }
};

/**
 * Approve event
 */
exports.approveEvent = async (req, res) => {
  try {
    // Only moderators and admins can approve
    if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only moderators and admins can approve events'
      });
    }

    const { eventId } = req.params;
    const { notes } = req.body;

    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        status: 'approved',
        'approvalStatus.reviewedBy': req.user._id,
        'approvalStatus.reviewedAt': new Date(),
        'approvalStatus.approvalNotes': notes
      },
      { new: true }
    ).populate('organizer_id', 'first_name last_name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // TODO: Send email notification to organizer

    res.json({
      success: true,
      message: 'Event approved successfully',
      data: event
    });
  } catch (error) {
    console.error('Error approving event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve event',
      error: error.message
    });
  }
};

/**
 * Reject event
 */
exports.rejectEvent = async (req, res) => {
  try {
    // Only moderators and admins can reject
    if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only moderators and admins can reject events'
      });
    }

    const { eventId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        status: 'cancelled',
        'approvalStatus.reviewedBy': req.user._id,
        'approvalStatus.reviewedAt': new Date(),
        'approvalStatus.rejectionReason': reason
      },
      { new: true }
    ).populate('organizer_id', 'first_name last_name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // TODO: Send email notification to organizer with reason
    // TODO: Process refunds if there are registrations

    res.json({
      success: true,
      message: 'Event rejected',
      data: event
    });
  } catch (error) {
    console.error('Error rejecting event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject event',
      error: error.message
    });
  }
};

/**
 * Get moderator dashboard statistics
 */
exports.getModeratorDashboard = async (req, res) => {
  try {
    // Only moderators and admins can access
    if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only moderators and admins can access this'
      });
    }

    const [
      pendingOrganizersCount,
      pendingEventsCount,
      verifiedOrganizersCount,
      approvedEventsToday
    ] = await Promise.all([
      User.countDocuments({ role: 'organizer', verificationStatus: 'pending' }),
      Event.countDocuments({ status: 'pending_approval' }),
      User.countDocuments({ role: 'organizer', verificationStatus: 'verified' }),
      Event.countDocuments({
        status: 'approved',
        'approvalStatus.reviewedAt': {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        pendingOrganizers: pendingOrganizersCount,
        pendingEvents: pendingEventsCount,
        verifiedOrganizers: verifiedOrganizersCount,
        approvedToday: approvedEventsToday
      }
    });
  } catch (error) {
    console.error('Error getting moderator dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get moderator dashboard',
      error: error.message
    });
  }
};

/**
 * Get all organizers with filters
 */
exports.getAllOrganizers = async (req, res) => {
  try {
    // Only moderators and admins can access
    if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only moderators and admins can access this'
      });
    }

    const { verificationStatus, organizerTier, page = 1, limit = 20 } = req.query;

    const query = { role: 'organizer' };
    if (verificationStatus) query.verificationStatus = verificationStatus;
    if (organizerTier) query.organizerTier = organizerTier;

    const organizers = await User.find(query)
      .select('-password')
      .sort({ created_at: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        organizers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error getting organizers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get organizers',
      error: error.message
    });
  }
};

/**
 * Request more information from organizer
 */
exports.requestMoreInfo = async (req, res) => {
  try {
    // Only moderators and admins can request info
    if (req.user.role !== 'moderator' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only moderators and admins can request information'
      });
    }

    const { organizerId } = req.params;
    const { requestedInfo, message } = req.body;

    // TODO: Implement notification system to send message to organizer
    // For now, just add a note

    const organizer = await User.findByIdAndUpdate(
      organizerId,
      {
        'verificationDocuments.reviewedBy': req.user._id,
        'verificationDocuments.rejectionReason': `More info requested: ${message}`
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Information request sent to organizer',
      data: organizer
    });
  } catch (error) {
    console.error('Error requesting more info:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request information',
      error: error.message
    });
  }
};
