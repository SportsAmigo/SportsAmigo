const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const User = require('../models/user');
const Subscription = require('../models/schemas/subscriptionSchema');

/**
 * API Authentication Routes for React Frontend
 * These routes mirror auth.js but are specifically for API consumption
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and create session
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: player@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [player, manager, organizer, moderator, admin]
 *                 description: Optional - verifies user has this specific role
 *                 example: player
 *     responses:
 *       200:
 *         description: Login successful - session created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful!
 *                 user:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     name: { type: string }
 *                     email: { type: string }
 *                     role: { type: string }
 *                     first_name: { type: string }
 *                     last_name: { type: string }
 *                     phone: { type: string }
 *                     profile_image: { type: string }
 *                     subscription:
 *                       type: object
 *                       properties:
 *                         plan: { type: string, enum: [free, pro, enterprise] }
 *                         status: { type: string }
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Email not verified or role mismatch
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Authenticate user
        const user = await userController.authUser(email, password);
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Check role if provided
        if (role && user.role !== role) {
            return res.status(403).json({ 
                success: false, 
                message: `You are registered as a ${user.role}, not a ${role}` 
            });
        }

        // Check if email is verified (only for new users with OTP field)
        // Legacy users created before OTP implementation are automatically allowed
        if (user.isEmailVerified === false && user.otp) {
            return res.status(403).json({ 
                success: false, 
                message: 'Please verify your email before logging in' 
            });
        }

        // Auto-verify legacy users (created before OTP feature)
        if (user.isEmailVerified === false && !user.otp) {
            user.isEmailVerified = true;
            user.emailVerifiedAt = new Date();
            await user.save();
        }

        // Get fresh user data
        const freshUserData = await User.getUserById(user._id);
        
        if (!freshUserData) {
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to retrieve user data' 
            });
        }

        // Create session
        const sessionUser = freshUserData.toObject ? freshUserData.toObject() : freshUserData;
        sessionUser.name = sessionUser.first_name + (sessionUser.last_name ? ' ' + sessionUser.last_name : '');
        
        req.session.user = sessionUser;

        // Fetch active subscription so the badge shows immediately after login
        let subscriptionData = { plan: 'free', status: 'active' };
        try {
            const sub = await Subscription.findOne({
                user: sessionUser._id,
                status: 'active'
            }).sort({ createdAt: -1 });
            if (sub) {
                subscriptionData = { plan: sub.plan, status: sub.status };
            }
        } catch (_) { /* non-fatal — fall back to free */ }

        req.session.save(err => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Session error' 
                });
            }

            return res.json({ 
                success: true, 
                message: 'Login successful!', 
                user: { 
                    id: sessionUser._id, 
                    name: sessionUser.name, 
                    email: sessionUser.email, 
                    role: sessionUser.role, 
                    first_name: sessionUser.first_name, 
                    last_name: sessionUser.last_name, 
                    phone: sessionUser.phone,
                    age: sessionUser.profile?.age || '',
                    address: sessionUser.profile?.address || '',
                    bio: sessionUser.bio || '',
                    organization: sessionUser.profile?.organization_name || '',
                    profile_image: sessionUser.profile_image,
                    subscription: subscriptionData
                } 
            });
        });

    } catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'An error occurred during login' 
        });
    }
});

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Send OTP for email verification during signup
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - first_name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newuser@example.com
 *               first_name:
 *                 type: string
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               role:
 *                 type: string
 *                 enum: [player, manager, organizer]
 *                 example: player
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Email already registered or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/send-otp', userController.sendOTP);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and complete user registration
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - password
 *               - first_name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               password:
 *                 type: string
 *                 format: password
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [player, manager, organizer]
 *               preferred_sports:
 *                 type: array
 *                 items:
 *                   type: string
 *               organization_name:
 *                 type: string
 *                 description: For organizers
 *               team_name:
 *                 type: string
 *                 description: For managers
 *     responses:
 *       200:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/verify-otp', userController.verifyOTP);

/**
 * @swagger
 * /api/auth/send-login-otp:
 *   post:
 *     summary: Send OTP for two-factor authentication during login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, format: password }
 *               role: { type: string, enum: [player, manager, organizer, moderator, admin] }
 *     responses:
 *       200:
 *         description: OTP sent to email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/send-login-otp', userController.sendLoginOTP);

/**
 * @swagger
 * /api/auth/verify-login-otp:
 *   post:
 *     summary: Verify login OTP and create session
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email: { type: string, format: email }
 *               otp: { type: string, example: "123456" }
 *               role: { type: string, enum: [player, manager, organizer, moderator, admin] }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 message: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/verify-login-otp', userController.verifyLoginOTP);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Initiate password reset - send OTP to email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Email not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/forgot-password', userController.forgotPassword);

/**
 * @swagger
 * /api/auth/verify-reset-otp:
 *   post:
 *     summary: Verify password reset OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email: { type: string, format: email }
 *               otp: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/verify-reset-otp', userController.verifyResetOTP);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with verified OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email: { type: string, format: email }
 *               otp: { type: string, example: "123456" }
 *               newPassword: { type: string, format: password }
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid OTP or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/reset-password', userController.resetPassword);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and destroy session
 *     tags: [Authentication]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       500:
 *         description: Error during logout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error logging out' 
            });
        }
        res.clearCookie('connect.sid');
        return res.json({ 
            success: true, 
            message: 'Logout successful' 
        });
    });
});

/**
 * @swagger
 * /api/auth/check-session:
 *   get:
 *     summary: Check if user has an active session
 *     description: Returns current user data if authenticated, with fresh subscription status
 *     tags: [Authentication]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Session status
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     authenticated: { type: boolean, example: true }
 *                     user:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         name: { type: string }
 *                         email: { type: string }
 *                         role: { type: string }
 *                         first_name: { type: string }
 *                         last_name: { type: string }
 *                         phone: { type: string }
 *                         profile_image: { type: string }
 *                         verificationStatus: { type: string }
 *                         subscription:
 *                           type: object
 *                           properties:
 *                             plan: { type: string }
 *                             status: { type: string }
 *                 - type: object
 *                   properties:
 *                     authenticated: { type: boolean, example: false }
 */
router.get('/check-session', async (req, res) => {
    if (req.session && req.session.user) {
        // Fetch active subscription from DB so the badge reflects real state after purchase
        let subscriptionData = { plan: 'free', status: 'active' };
        try {
            const sub = await Subscription.findOne({
                user: req.session.user._id,
                status: 'active'
            }).sort({ createdAt: -1 });
            if (sub) {
                subscriptionData = { plan: sub.plan, status: sub.status };
            }
        } catch (_) { /* non-fatal — fall back to free */ }

        return res.json({ 
            authenticated: true, 
            user: { 
                id: req.session.user._id, 
                name: req.session.user.name, 
                email: req.session.user.email, 
                role: req.session.user.role, 
                first_name: req.session.user.first_name, 
                last_name: req.session.user.last_name, 
                phone: req.session.user.phone,
                age: req.session.user.profile?.age || '',
                address: req.session.user.profile?.address || '',
                bio: req.session.user.bio || '',
                organization: req.session.user.profile?.organization_name || '',
                profile_image: req.session.user.profile_image,
                verificationStatus: req.session.user.verificationStatus,
                subscription: subscriptionData
            } 
        });
    } else {
        return res.json({ authenticated: false });
    }
});

/**
 * @swagger
 * /api/auth/user:
 *   get:
 *     summary: Get current authenticated user's full profile
 *     tags: [Authentication]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 user: { $ref: '#/components/schemas/User' }
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/user', async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ 
            success: false, 
            message: 'Not authenticated' 
        });
    }

    try {
        const user = await User.getUserById(req.session.user._id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        return res.json({ 
            success: true, 
            user: { 
                id: user._id, 
                name: user.first_name + (user.last_name ? ' ' + user.last_name : ''), 
                email: user.email, 
                role: user.role, 
                first_name: user.first_name, 
                last_name: user.last_name, 
                phone: user.phone,
                age: user.profile?.age || '',
                address: user.profile?.address || '',
                bio: user.bio || '',
                organization: user.profile?.organization_name || '',
                profile_image: user.profile_image 
            } 
        });
    } catch (err) {
        console.error('Get user error:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Error retrieving user data' 
        });
    }
});

module.exports = router;
