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
/**
 * @swagger
 * /api/subscription/plans:
 *   get:
 *     summary: Get available subscription plans
 *     tags: [Subscriptions]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Subscription plans retrieved successfully
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to fetch plans
 */
router.get('/plans', isAuthenticated, subscriptionController.getPlans);

// Get current user subscription
/**
 * @swagger
 * /api/subscription/my-subscription:
 *   get:
 *     summary: Get current organizer subscription
 *     tags: [Subscriptions]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Current subscription retrieved successfully
 *       403:
 *         description: Organizer access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to fetch subscription
 */
router.get('/my-subscription', isOrganizer, subscriptionController.getMySubscription);

// Get subscription history
/**
 * @swagger
 * /api/subscription/history:
 *   get:
 *     summary: Get organizer subscription payment history
 *     tags: [Subscriptions]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Subscription history retrieved successfully
 *       403:
 *         description: Organizer access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to fetch history
 */
router.get('/history', isOrganizer, subscriptionController.getSubscriptionHistory);

// Create new subscription (frontend uses this endpoint)
/**
 * @swagger
 * /api/subscription/create:
 *   post:
 *     summary: Create a new organizer subscription
 *     tags: [Subscriptions]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan]
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [pro, enterprise]
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, yearly]
 *     responses:
 *       200:
 *         description: Subscription created successfully
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Organizer access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to create subscription
 */
router.post('/create', isOrganizer, subscriptionController.createSubscription);

// Upgrade subscription
/**
 * @swagger
 * /api/subscription/upgrade:
 *   post:
 *     summary: Upgrade or change subscription plan
 *     tags: [Subscriptions]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan]
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [pro, enterprise]
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, yearly]
 *     responses:
 *       200:
 *         description: Subscription upgraded successfully
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Organizer access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to upgrade subscription
 */
router.post('/upgrade', isOrganizer, subscriptionController.upgradeSubscription);

// Cancel subscription
/**
 * @swagger
 * /api/subscription/cancel:
 *   post:
 *     summary: Cancel active subscription
 *     tags: [Subscriptions]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *       403:
 *         description: Organizer access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to cancel subscription
 */
router.post('/cancel', isOrganizer, subscriptionController.cancelSubscription);

// Renew subscription
/**
 * @swagger
 * /api/subscription/renew:
 *   post:
 *     summary: Renew existing subscription
 *     tags: [Subscriptions]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     responses:
 *       200:
 *         description: Subscription renewed successfully
 *       403:
 *         description: Organizer access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to renew subscription
 */
router.post('/renew', isOrganizer, subscriptionController.renewSubscription);

// Check event creation eligibility
/**
 * @swagger
 * /api/subscription/can-create-event:
 *   get:
 *     summary: Check if organizer can create a new event under current plan
 *     tags: [Subscriptions]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Eligibility check result
 *       403:
 *         description: Organizer access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to check eligibility
 */
router.get('/can-create-event', isOrganizer, subscriptionController.checkEventCreationEligibility);

// Unified subscribe endpoint (frontend calls this)
/**
 * @swagger
 * /api/subscription/subscribe:
 *   post:
 *     summary: Unified endpoint to create or upgrade subscription
 *     tags: [Subscriptions]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [plan]
 *             properties:
 *               plan:
 *                 type: string
 *                 enum: [pro, enterprise]
 *               billingCycle:
 *                 type: string
 *                 enum: [monthly, yearly]
 *                 default: monthly
 *     responses:
 *       200:
 *         description: Subscription processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid plan or request body
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Organizer access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Subscription process failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
/**
 * @swagger
 * /api/subscription/revenue:
 *   get:
 *     summary: Get subscription revenue metrics (admin)
 *     tags: [Subscriptions]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Revenue stats fetched successfully
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to fetch revenue metrics
 */
router.get('/revenue', isAdmin, subscriptionController.getSubscriptionRevenue);

/**
 * @swagger
 * /api/subscription/active:
 *   get:
 *     summary: Get all active subscriptions (admin)
 *     tags: [Subscriptions]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Active subscriptions fetched successfully
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to fetch active subscriptions
 */
router.get('/active', isAdmin, subscriptionController.getAllActiveSubscriptions);

/**
 * @swagger
 * /api/subscription/expiring:
 *   get:
 *     summary: Get expiring subscriptions (admin)
 *     tags: [Subscriptions]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Expiring subscriptions fetched successfully
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to fetch expiring subscriptions
 */
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
