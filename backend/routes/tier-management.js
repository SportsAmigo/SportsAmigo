/**
 * Tier Management Routes
 * Handles organizer tier progression and management
 */

const express = require('express');
const router = express.Router();
const tierManagementController = require('../controllers/tierManagementController');

/**
 * Middleware to check if user is logged in
 */
function isAuthenticated(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    req.user = req.session.user;
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

// Get tier benefits information
router.get('/benefits', isAuthenticated, tierManagementController.getTierBenefits);

// Get tier progress for current organizer
router.get('/my-progress', isOrganizer, tierManagementController.getTierProgress);

// Get tier progress for specific organizer (admin or self)
router.get('/progress/:organizerId', isAuthenticated, tierManagementController.getTierProgress);

// Update specific organizer tier (admin only)
router.post('/update/:organizerId', isAdmin, tierManagementController.updateOrganizerTier);

// Batch update all organizer tiers (admin only - cron job trigger)
router.post('/batch-update', isAdmin, tierManagementController.batchUpdateTiers);

// Tier progress page for organizers
router.get('/', isOrganizer, async (req, res) => {
    try {
        const { User } = require('../models');
        const organizer = await User.findById(req.session.user._id);

        res.render('tier/progress', {
            title: 'Tier Progress',
            user: req.session.user,
            organizer
        });
    } catch (error) {
        console.error('Error loading tier progress:', error);
        res.render('error', {
            message: 'Failed to load tier progress',
            error: error.message
        });
    }
});

module.exports = router;
