/**
 * Moderator Routes
 * Handles organizer verification, event approval, and moderation tasks
 */

const express = require('express');
const router = express.Router();
const moderatorController = require('../controllers/moderatorController');

/**
 * Middleware to check if user is moderator or admin
 */
function isModeratorOrAdmin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }

    if (req.session.user.role !== 'moderator' && req.session.user.role !== 'coordinator' && req.session.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Moderator or admin access required.'
        });
    }

    next();
}

// Moderator dashboard
router.get('/dashboard', isModeratorOrAdmin, (req, res) => {
    res.render('moderator/dashboard', {
        title: 'Moderator Dashboard',
        user: req.session.user
    });
});

// Get moderator dashboard statistics
router.get('/api/dashboard-stats', isModeratorOrAdmin, moderatorController.getModeratorDashboard);

// API routes for frontend (JSON responses)
router.get('/pending-organizers', isModeratorOrAdmin, async (req, res) => {
    try {
        const User = require('../models/schemas/userSchema');
        const pendingOrganizers = await User.find({
            role: 'organizer',
            verificationStatus: 'pending'
        }).sort({ created_at: -1 });

        res.json({
            success: true,
            data: pendingOrganizers
        });
    } catch (error) {
        console.error('Error loading pending organizers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load pending organizers',
            error: error.message
        });
    }
});

router.get('/pending-events', isModeratorOrAdmin, async (req, res) => {
    try {
        const Event = require('../models/schemas/eventSchema');
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
        console.error('Error loading pending events:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load pending events',
            error: error.message
        });
    }
});

router.post('/approve-organizer/:id', isModeratorOrAdmin, async (req, res) => {
    try {
        const User = require('../models/schemas/userSchema');
        const organizer = await User.findById(req.params.id);

        if (!organizer) {
            return res.status(404).json({
                success: false,
                message: 'Organizer not found'
            });
        }

        organizer.verificationStatus = 'verified';
        organizer.verificationDocuments.reviewedAt = new Date();
        organizer.verificationDocuments.reviewedBy = req.session.user._id;
        await organizer.save();

        res.json({
            success: true,
            message: 'Organizer approved successfully'
        });
    } catch (error) {
        console.error('Error approving organizer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve organizer',
            error: error.message
        });
    }
});

router.post('/reject-organizer/:id', isModeratorOrAdmin, async (req, res) => {
    try {
        const User = require('../models/schemas/userSchema');
        const { reason } = req.body;

        const organizer = await User.findById(req.params.id);

        if (!organizer) {
            return res.status(404).json({
                success: false,
                message: 'Organizer not found'
            });
        }

        organizer.verificationStatus = 'rejected';
        organizer.verificationDocuments.rejectionReason = reason || 'No reason provided';
        organizer.verificationDocuments.reviewedAt = new Date();
        organizer.verificationDocuments.reviewedBy = req.session.user._id;
        await organizer.save();

        res.json({
            success: true,
            message: 'Organizer rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting organizer:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject organizer',
            error: error.message
        });
    }
});

router.post('/approve-event/:id', isModeratorOrAdmin, async (req, res) => {
    try {
        const Event = require('../models/schemas/eventSchema');
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        event.status = 'upcoming';
        event.approvalStatus = event.approvalStatus || {};
        event.approvalStatus.reviewedBy = req.session.user._id;
        event.approvalStatus.reviewedAt = new Date();
        event.approvalStatus.approvalNotes = 'Event approved by coordinator';
        event.markModified('approvalStatus');
        await event.save();

        res.json({
            success: true,
            message: 'Event approved successfully'
        });
    } catch (error) {
        console.error('Error approving event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to approve event',
            error: error.message
        });
    }
});

router.post('/reject-event/:id', isModeratorOrAdmin, async (req, res) => {
    try {
        const Event = require('../models/schemas/eventSchema');
        const { reason } = req.body;

        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        event.status = 'rejected';
        event.approvalStatus = event.approvalStatus || {};
        event.approvalStatus.rejectionReason = reason || 'No reason provided';
        event.approvalStatus.reviewedBy = req.session.user._id;
        event.approvalStatus.reviewedAt = new Date();
        event.markModified('approvalStatus');
        await event.save();

        res.json({
            success: true,
            message: 'Event rejected successfully'
        });
    } catch (error) {
        console.error('Error rejecting event:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reject event',
            error: error.message
        });
    }
});

// Organizer verification routes (for view rendering)
router.get('/organizers/pending', isModeratorOrAdmin, moderatorController.getPendingOrganizers);
router.get('/organizers', isModeratorOrAdmin, moderatorController.getAllOrganizers);
router.post('/organizers/:organizerId/approve', isModeratorOrAdmin, moderatorController.approveOrganizer);
router.post('/organizers/:organizerId/reject', isModeratorOrAdmin, moderatorController.rejectOrganizer);
router.post('/organizers/:organizerId/suspend', isModeratorOrAdmin, moderatorController.suspendOrganizer);
router.post('/organizers/:organizerId/request-info', isModeratorOrAdmin, moderatorController.requestMoreInfo);

// Event approval routes
router.get('/events/pending', isModeratorOrAdmin, moderatorController.getPendingEvents);
router.post('/events/:eventId/approve', isModeratorOrAdmin, moderatorController.approveEvent);
router.post('/events/:eventId/reject', isModeratorOrAdmin, moderatorController.rejectEvent);

// Pending organizers page
router.get('/pending-organizers', isModeratorOrAdmin, async (req, res) => {
    try {
        const User = require('../models/schemas/userSchema');
        const pendingOrganizers = await User.find({
            role: 'organizer',
            verificationStatus: 'pending'
        }).sort({ created_at: -1 });

        res.render('moderator/pending-organizers', {
            title: 'Pending Organizers',
            user: req.session.user,
            organizers: pendingOrganizers
        });
    } catch (error) {
        console.error('Error loading pending organizers:', error);
        res.render('error', {
            message: 'Failed to load pending organizers',
            error: error.message
        });
    }
});

// Pending events page
router.get('/pending-events', isModeratorOrAdmin, async (req, res) => {
    try {
        const Event = require('../models/schemas/eventSchema');
        const pendingEvents = await Event.find({
            status: 'pending_approval'
        })
            .populate('organizer_id', 'first_name last_name email organizerTier verificationStatus')
            .sort({ created_at: -1 });

        res.render('moderator/pending-events', {
            title: 'Pending Events',
            user: req.session.user,
            events: pendingEvents
        });
    } catch (error) {
        console.error('Error loading pending events:', error);
        res.render('error', {
            message: 'Failed to load pending events',
            error: error.message
        });
    }
});

// ====== COORDINATOR DASHBOARD API ENDPOINTS ======

// Approved organizers
router.get('/approved-organizers', isModeratorOrAdmin, async (req, res) => {
    try {
        const User = require('../models/schemas/userSchema');
        const approved = await User.find({
            role: 'organizer',
            verificationStatus: 'verified'
        }).sort({ 'verificationDocuments.reviewedAt': -1 });

        res.json({ success: true, data: approved });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Approved events
router.get('/approved-events', isModeratorOrAdmin, async (req, res) => {
    try {
        const Event = require('../models/schemas/eventSchema');
        const approved = await Event.find({
            status: { $in: ['upcoming', 'ongoing', 'completed', 'open'] }
        })
            .populate('organizer_id', 'first_name last_name email verificationStatus')
            .sort({ event_date: -1 });

        res.json({ success: true, data: approved });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Rejected applications (both organizers and events)
router.get('/rejected', isModeratorOrAdmin, async (req, res) => {
    try {
        const User = require('../models/schemas/userSchema');
        const Event = require('../models/schemas/eventSchema');

        const [rejectedOrgs, rejectedEvts] = await Promise.all([
            User.find({ role: 'organizer', verificationStatus: 'rejected' }).sort({ 'verificationDocuments.reviewedAt': -1 }),
            Event.find({ status: 'rejected' }).populate('organizer_id', 'first_name last_name email').sort({ reviewedAt: -1 })
        ]);

        res.json({
            success: true,
            data: {
                organizers: rejectedOrgs,
                events: rejectedEvts
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Activity log (coordinator actions)
router.get('/activity-log', isModeratorOrAdmin, async (req, res) => {
    try {
        // Build activity log from approved/rejected organizers and events
        const User = require('../models/schemas/userSchema');
        const Event = require('../models/schemas/eventSchema');

        const [approvedOrgs, rejectedOrgs, approvedEvts, rejectedEvts] = await Promise.all([
            User.find({ role: 'organizer', verificationStatus: 'verified', 'verificationDocuments.reviewedAt': { $exists: true } })
                .sort({ 'verificationDocuments.reviewedAt': -1 }).limit(50),
            User.find({ role: 'organizer', verificationStatus: 'rejected', 'verificationDocuments.reviewedAt': { $exists: true } })
                .sort({ 'verificationDocuments.reviewedAt': -1 }).limit(50),
            Event.find({ status: 'upcoming', 'approvalStatus.reviewedAt': { $exists: true } })
                .sort({ 'approvalStatus.reviewedAt': -1 }).limit(50),
            Event.find({ status: 'rejected', 'approvalStatus.reviewedAt': { $exists: true } })
                .sort({ 'approvalStatus.reviewedAt': -1 }).limit(50)
        ]);

        const logs = [
            ...approvedOrgs.map(o => ({
                timestamp: o.verificationDocuments?.reviewedAt,
                action: 'approved',
                targetType: 'Organizer',
                targetName: `${o.first_name} ${o.last_name}`,
                details: 'Organizer account approved',
                result: 'Verified'
            })),
            ...rejectedOrgs.map(o => ({
                timestamp: o.verificationDocuments?.reviewedAt,
                action: 'rejected',
                targetType: 'Organizer',
                targetName: `${o.first_name} ${o.last_name}`,
                details: o.verificationDocuments?.rejectionReason || 'No reason',
                result: 'Rejected'
            })),
            ...approvedEvts.map(e => ({
                timestamp: e.approvalStatus?.reviewedAt,
                action: 'approved',
                targetType: 'Event',
                targetName: e.title,
                details: 'Event approved and published',
                result: 'Live'
            })),
            ...rejectedEvts.map(e => ({
                timestamp: e.approvalStatus?.reviewedAt,
                action: 'rejected',
                targetType: 'Event',
                targetName: e.title,
                details: e.approvalStatus?.rejectionReason || 'No reason',
                result: 'Rejected'
            }))
        ].sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0)).slice(0, 100);

        res.json({ success: true, data: logs });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
