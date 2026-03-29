/**
 * Subscription Routes
 * Handles premium organizer subscription management
 */

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

/**
 * Middleware to check if user is logged in
 */
function isAuthenticated(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required. Please log in.'
        });
    }
    next();
}

/**
 * Middleware to check if user is organizer
 */
function isOrganizer(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'organizer') {
        return res.status(403).json({
            success: false,
            message: 'Only organizers can access subscriptions'
        });
    }
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
    next();
}

// Get subscription plans
router.get('/plans', isAuthenticated, subscriptionController.getPlans);

// Get current user subscription
router.get('/my-subscription', isOrganizer, subscriptionController.getMySubscription);

// Get subscription history
router.get('/history', isOrganizer, subscriptionController.getSubscriptionHistory);

// Create new subscription (frontend uses this endpoint)
router.post('/create', isOrganizer, subscriptionController.createSubscription);

// Upgrade subscription
router.post('/upgrade', isOrganizer, subscriptionController.upgradeSubscription);

// Cancel subscription
router.post('/cancel', isOrganizer, subscriptionController.cancelSubscription);

// Renew subscription
router.post('/renew', isOrganizer, subscriptionController.renewSubscription);

// Check event creation eligibility
router.get('/can-create-event', isOrganizer, subscriptionController.checkEventCreationEligibility);

// Unified subscribe endpoint (frontend calls this)
router.post('/subscribe', isOrganizer, async (req, res) => {
    try {
        const { plan, billingCycle } = req.body;
        const { Subscription } = require('../models');

        // Validate plan
        if (!['pro', 'enterprise'].includes(plan)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subscription plan. Choose pro or enterprise.'
            });
        }

        const userId = req.session.user._id;

        // Check if user already has an active subscription
        const existing = await Subscription.getUserSubscription(userId);

        if (existing && existing.plan === plan) {
            return res.json({
                success: true,
                message: `You are already on the ${plan} plan`,
                data: existing
            });
        }

        // Determine pricing
        const pricing = {
            pro: { monthly: 2999, yearly: 29999 },
            enterprise: { monthly: 9999, yearly: 99999 }
        };
        const cycle = billingCycle || 'monthly';
        const amount = pricing[plan][cycle];

        if (existing) {
            // Upgrade existing subscription
            const upgraded = await Subscription.upgradeSubscription(userId, plan, {
                billingCycle: cycle,
                method: 'demo_payment',
                transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                amount
            });
            return res.json({
                success: true,
                message: `Successfully upgraded to ${plan} plan!`,
                data: upgraded
            });
        } else {
            // Create new subscription
            const subscription = await Subscription.createSubscription({
                user: userId,
                plan,
                billingCycle: cycle,
                paymentHistory: [{
                    amount,
                    paymentDate: new Date(),
                    paymentMethod: 'demo_payment',
                    transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                    status: 'success'
                }]
            });
            return res.json({
                success: true,
                message: `Successfully subscribed to ${plan} plan!`,
                data: subscription
            });
        }
    } catch (error) {
        console.error('Error in subscribe:', error);
        res.status(500).json({
            success: false,
            message: 'Subscription failed: ' + error.message,
            error: error.message
        });
    }
});

// Admin routes
router.get('/revenue', isAdmin, subscriptionController.getSubscriptionRevenue);
router.get('/active', isAdmin, subscriptionController.getAllActiveSubscriptions);
router.get('/expiring', isAdmin, subscriptionController.getExpiringSubscriptions);

// Subscription plans page
router.get('/', isAuthenticated, async (req, res) => {
    try {
        res.render('subscription/plans', {
            title: 'Subscription Plans',
            user: req.session.user
        });
    } catch (error) {
        console.error('Error loading subscription plans:', error);
        res.render('error', {
            message: 'Failed to load subscription plans',
            error: error.message
        });
    }
});

// My subscription page
router.get('/manage', isOrganizer, async (req, res) => {
    try {
        const { Subscription } = require('../models');
        const subscription = await Subscription.getUserSubscription(req.session.user._id);

        res.render('subscription/manage', {
            title: 'Manage Subscription',
            user: req.session.user,
            subscription: subscription
        });
    } catch (error) {
        console.error('Error loading subscription management:', error);
        res.render('error', {
            message: 'Failed to load subscription management',
            error: error.message
        });
    }
});

module.exports = router;
