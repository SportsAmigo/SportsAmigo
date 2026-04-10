/**
 * Shop Login Routes - Dedicated authentication for shop purchases
 * Separate from dashboard login, validates against Player credentials
 */

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// Import User schema for validation
const UserSchema = require('../models/schemas/userSchema');

/**
 * GET /shop-login - Display shop login page
 */
router.get('/', (req, res) => {
    // If already logged in to shop, redirect to checkout
    if (req.session.shopUser) {
        return res.redirect('/checkout');
    }
    
    // Get cart data from session
    const cart = req.session.cart || { items: [], itemCount: 0, totalAmount: 0 };
    
    // Render shop login page
    res.render('shop/shop-login', {
        title: 'Login to Complete Purchase - SportsAmigo',
        cart: cart,
        error: null,
        returnUrl: req.query.returnUrl || '/checkout'
    });
});

/**
 * POST /shop-login - Process shop login
 */
router.post('/', async (req, res) => {
    try {
        const { email, password, returnUrl } = req.body;
        
        // Validate input
        if (!email || !password) {
            return res.render('shop/shop-login', {
                title: 'Login to Complete Purchase - SportsAmigo',
                cart: req.session.cart || { items: [], itemCount: 0, totalAmount: 0 },
                error: 'Please provide both email and password',
                returnUrl: returnUrl || '/checkout'
            });
        }
        
        // Find user by email
        const user = await UserSchema.findOne({ 
            email: email.toLowerCase().trim() 
        });
        
        if (!user) {
            return res.render('shop/shop-login', {
                title: 'Login to Complete Purchase - SportsAmigo',
                cart: req.session.cart || { items: [], itemCount: 0, totalAmount: 0 },
                error: 'Invalid email or password',
                returnUrl: returnUrl || '/checkout'
            });
        }
        
        // Check if user is a Player (only Players can shop)
        if (user.role !== 'player') {
            return res.render('shop/shop-login', {
                title: 'Login to Complete Purchase - SportsAmigo',
                cart: req.session.cart || { items: [], itemCount: 0, totalAmount: 0 },
                error: 'Only Player accounts can make purchases. Please contact admin if you need to shop.',
                returnUrl: returnUrl || '/checkout'
            });
        }
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.render('shop/shop-login', {
                title: 'Login to Complete Purchase - SportsAmigo',
                cart: req.session.cart || { items: [], itemCount: 0, totalAmount: 0 },
                error: 'Invalid email or password',
                returnUrl: returnUrl || '/checkout'
            });
        }
        
        // Create shop-specific session (separate from dashboard)
        req.session.shopUser = {
            id: user._id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            walletBalance: user.walletBalance || 0
        };
        
        // Also create regular user session for dashboard access
        req.session.user = {
            id: user._id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            walletBalance: user.walletBalance || 0
        };
        
        // Associate cart with user if they had items as guest
        if (req.session.cart && req.session.cart.items.length > 0) {
            req.session.cart.userId = user._id;
        }
        
        console.log(`Shop login successful for: ${user.email}`);
        
        // Redirect to checkout or specified return URL
        const redirectUrl = returnUrl || '/checkout';
        res.redirect(redirectUrl);
        
    } catch (error) {
        console.error('Shop login error:', error);
        res.render('shop/shop-login', {
            title: 'Login to Complete Purchase - SportsAmigo',
            cart: req.session.cart || { items: [], itemCount: 0, totalAmount: 0 },
            error: 'An error occurred during login. Please try again.',
            returnUrl: req.query.returnUrl || '/checkout'
        });
    }
});

/**
 * POST /shop-logout - Logout from shop (keep cart)
 */
router.post('/logout', (req, res) => {
    // Remove both shop user session and regular user session but keep cart
    req.session.shopUser = null;
    req.session.user = null;
    
    // Redirect back to cart
    res.redirect('/cart');
});

/**
 * GET /shop-register - Display shop registration page
 */
router.get('/register', (req, res) => {
    res.render('shop/shop-register', {
        title: 'Create Account - SportsAmigo',
        cart: req.session.cart || { items: [], itemCount: 0, totalAmount: 0 },
        error: null,
        success: null
    });
});

/**
 * POST /shop-register - Process new user registration for shop
 */
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, email, password, confirmPassword } = req.body;
        
        // Validate input
        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            return res.render('shop/shop-register', {
                title: 'Create Account - SportsAmigo',
                cart: req.session.cart || { items: [], itemCount: 0, totalAmount: 0 },
                error: 'All fields are required',
                success: null
            });
        }
        
        if (password !== confirmPassword) {
            return res.render('shop/shop-register', {
                title: 'Create Account - SportsAmigo',
                cart: req.session.cart || { items: [], itemCount: 0, totalAmount: 0 },
                error: 'Passwords do not match',
                success: null
            });
        }
        
        if (password.length < 6) {
            return res.render('shop/shop-register', {
                title: 'Create Account - SportsAmigo',
                cart: req.session.cart || { items: [], itemCount: 0, totalAmount: 0 },
                error: 'Password must be at least 6 characters long',
                success: null
            });
        }
        
        // Check if user already exists
        const existingUser = await UserSchema.findOne({ 
            email: email.toLowerCase().trim() 
        });
        
        if (existingUser) {
            return res.render('shop/shop-register', {
                title: 'Create Account - SportsAmigo',
                cart: req.session.cart || { items: [], itemCount: 0, totalAmount: 0 },
                error: 'An account with this email already exists',
                success: null
            });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);
        
        // Create new user with player role (default for shop registration)
        const newUser = await UserSchema.create({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role: 'player',
            walletBalance: 500, // Welcome bonus for new shop users
            created_at: new Date()
        });
        
        console.log(`New shop user registered: ${newUser.email}`);
        
        // Auto-login after registration
        req.session.shopUser = {
            id: newUser._id,
            email: newUser.email,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            role: newUser.role,
            walletBalance: newUser.walletBalance
        };
        
        // Also create regular user session for dashboard access
        req.session.user = {
            id: newUser._id,
            email: newUser.email,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            role: newUser.role,
            walletBalance: newUser.walletBalance
        };
        
        // Associate cart with new user
        if (req.session.cart) {
            req.session.cart.userId = newUser._id;
        }
        
        // Redirect to checkout
        res.redirect('/checkout');
        
    } catch (error) {
        console.error('Shop registration error:', error);
        res.render('shop/shop-register', {
            title: 'Create Account - SportsAmigo',
            cart: req.session.cart || { items: [], itemCount: 0, totalAmount: 0 },
            error: 'An error occurred during registration. Please try again.',
            success: null
        });
    }
});

/**
 * Middleware to check if user is logged in to shop
 */
router.requireShopLogin = (req, res, next) => {
    if (!req.session.shopUser) {
        // Store the original URL they were trying to access
        const returnUrl = req.originalUrl;
        return res.redirect(`/shop-login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
    
    // Make shop user available in templates
    res.locals.shopUser = req.session.shopUser;
    next();
};

/**
 * Middleware to make shop user available in all shop templates
 */
router.addShopUserToLocals = (req, res, next) => {
    res.locals.shopUser = req.session.shopUser || null;
    next();
};

module.exports = router;