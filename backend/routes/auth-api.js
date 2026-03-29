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
 * Login endpoint
 * POST /api/auth/login
 * Body: { email, password, role }
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
 * Send OTP for email verification during signup
 * POST /api/auth/send-otp
 * Body: { email, first_name, last_name, role }
 */
router.post('/send-otp', userController.sendOTP);

/**
 * Verify OTP and complete signup
 * POST /api/auth/verify-otp
 * Body: { email, otp, password, first_name, last_name, phone, role, preferred_sports?, organization_name?, team_name? }
 */
router.post('/verify-otp', userController.verifyOTP);

/**
 * Send OTP for login verification
 * POST /api/auth/send-login-otp
 * Body: { email, password, role }
 */
router.post('/send-login-otp', userController.sendLoginOTP);

/**
 * Verify login OTP and complete login
 * POST /api/auth/verify-login-otp
 * Body: { email, otp, role }
 */
router.post('/verify-login-otp', userController.verifyLoginOTP);

/**
 * Initiate forgot password - send reset OTP
 * POST /api/auth/forgot-password
 * Body: { email }
 */
router.post('/forgot-password', userController.forgotPassword);

/**
 * Verify password reset OTP
 * POST /api/auth/verify-reset-otp
 * Body: { email, otp }
 */
router.post('/verify-reset-otp', userController.verifyResetOTP);

/**
 * Reset password with verified OTP
 * POST /api/auth/reset-password
 * Body: { email, otp, newPassword }
 */
router.post('/reset-password', userController.resetPassword);

/**
 * Logout endpoint
 * POST /api/auth/logout
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
 * Check session endpoint
 * GET /api/auth/check-session
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
 * Get current user endpoint
 * GET /api/auth/user
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
