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

/**
 * @swagger
 * /api/commission/create:
 *   post:
 *     summary: Create a commission record
 *     tags: [Commission]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     responses:
 *       200:
 *         description: Commission record created
 *
 * /api/commission/my-earnings:
 *   get:
 *     summary: Get earnings for logged-in organizer
 *     tags: [Commission]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Organizer earnings returned
 *
 * /api/commission/organizer/{organizerId}:
 *   get:
 *     summary: Get organizer earnings by organizer id
 *     tags: [Commission]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: organizerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Organizer earnings returned
 *
 * /api/commission/event/{eventId}:
 *   get:
 *     summary: Get commission records for an event
 *     tags: [Commission]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event commissions returned
 *
 * /api/commission/{commissionId}:
 *   get:
 *     summary: Get commission record by id
 *     tags: [Commission]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: commissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Commission record returned
 *
 * /api/commission/dashboard/revenue:
 *   get:
 *     summary: Get commission revenue dashboard (admin)
 *     tags: [Commission]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Revenue dashboard returned
 *
 * /api/commission/payouts/eligible:
 *   get:
 *     summary: Get eligible payouts (admin)
 *     tags: [Commission]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Eligible payouts returned
 *
 * /api/commission/{commissionId}/update-status:
 *   post:
 *     summary: Update commission payout status (admin)
 *     tags: [Commission]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: commissionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status updated
 *
 * /api/commission/payouts/bulk-process:
 *   post:
 *     summary: Process bulk payouts (admin)
 *     tags: [Commission]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     responses:
 *       200:
 *         description: Bulk payout processing started
 */

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
