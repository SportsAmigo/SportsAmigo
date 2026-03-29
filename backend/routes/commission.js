/**
 * Commission Routes
 * Handles commission tracking and payout management
 */

const express = require('express');
const router = express.Router();
const commissionController = require('../controllers/commissionController');

/**
 * Middleware to check if user is logged in
 */
function isAuthenticated(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    req.user = req.session.user; // Add user to request object
    next();
}

/**
 * Middleware to check if user is admin
 */
function isAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Admin access required'
        });
    }
    req.user = req.session.user;
    next();
}

/**
 * Middleware to check if user is organizer
 */
function isOrganizer(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'organizer') {
        return res.status(403).json({
            success: false,
            message: 'Organizer access required'
        });
    }
    req.user = req.session.user;
    next();
}

// Create commission record (internal use or webhook)
router.post('/create', isAuthenticated, commissionController.createCommission);

// Get organizer earnings (for organizers)
router.get('/my-earnings', isOrganizer, commissionController.getOrganizerEarnings);

// Get organizer earnings by ID (for organizers viewing their own or admin)
router.get('/organizer/:organizerId', isAuthenticated, commissionController.getOrganizerEarnings);

// Get commissions for a specific event
router.get('/event/:eventId', isAuthenticated, commissionController.getEventCommissions);

// Get commission details by ID
router.get('/:commissionId', isAuthenticated, commissionController.getCommissionById);

// Admin routes
router.get('/dashboard/revenue', isAdmin, commissionController.getRevenueDashboard);
router.get('/payouts/eligible', isAdmin, commissionController.getEligiblePayouts);
router.post('/:commissionId/update-status', isAdmin, commissionController.updateCommissionStatus);
router.post('/payouts/bulk-process', isAdmin, commissionController.processBulkPayouts);

// Organizer earnings page
router.get('/earnings', isOrganizer, async (req, res) => {
    try {
        const { Commission } = require('../models');
        const earnings = await Commission.getOrganizerEarnings(req.session.user._id);
        const commissions = await Commission.getCommissionsByOrganizer(req.session.user._id);

        res.render('commission/earnings', {
            title: 'My Earnings',
            user: req.session.user,
            earnings,
            commissions
        });
    } catch (error) {
        console.error('Error loading earnings:', error);
        res.render('error', {
            message: 'Failed to load earnings',
            error: error.message
        });
    }
});

module.exports = router;
