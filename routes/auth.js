const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Middleware to check if user is logged in
const isLoggedIn = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
};

// Home page with role selection
router.get('/', (req, res) => {
    res.render('home');
});

// Login page for each role
router.get('/login/:role', (req, res) => {
    const { role } = req.params;
    if (!['organizer', 'player', 'manager'].includes(role)) {
        return res.redirect('/');
    }
    res.render('login', { role, error: null });
});

// Handle login form submission
router.post('/login/:role', async (req, res, next) => {
    try {
        // Add role to body
        req.body.role = req.params.role;
        const { email, password } = req.body;
        const role = req.body.role || req.params.role || 'player';
        
        console.log('Login attempt:', { email, role });
        
        // Authenticate user
        const user = await userController.authUser(email, password);
        
        if (!user) {
            console.log('Login failed: Invalid credentials');
            return res.render('login', { 
                role,
                error: 'Invalid email or password',
                validationErrors: {},
                email: email || ''
            });
        }
        
        console.log('User authenticated:', user.email, 'Role:', user.role);
        
        // Check if the user's role matches the requested role
        if (role && user.role !== role) {
            console.log('Login failed: Role mismatch. User role:', user.role, 'Requested role:', role);
            return res.render('login', { 
                role,
                error: `You are registered as a ${user.role}, not a ${role}. Please use the correct login page.`,
                validationErrors: {},
                email: email || ''
            });
        }
        
        // Fetch fresh user data from database to ensure we have the latest data
        const User = require('../models/user');
        const freshUserData = await User.getUserById(user._id);
        
        if (!freshUserData) {
            return res.render('login', { 
                role,
                error: 'Failed to retrieve user data. Please try again.',
                validationErrors: {},
                email: email || ''
            });
        }
        
        // Create a complete user object for the session
        const sessionUser = freshUserData.toObject ? freshUserData.toObject() : freshUserData;
        
        // Add UI-friendly field name forms to ensure all templates can use them
        sessionUser.name = sessionUser.first_name + (sessionUser.last_name ? ' ' + sessionUser.last_name : '');
        
        console.log('Setting user session with complete user data:', {
            name: sessionUser.name,
            email: sessionUser.email,
            role: sessionUser.role,
            profile_image: sessionUser.profile_image,
            age: sessionUser.age,
            address: sessionUser.address,
            bio: sessionUser.bio
        });
        
        // Set user session with fresh data
        req.session.user = sessionUser;
        
        // Save session to ensure persistence
        req.session.save(err => {
            if (err) {
                console.error('Error saving session:', err);
            }
            console.log('User logged in successfully:', freshUserData.email, 'Profile image:', freshUserData.profile_image);
            
            // Redirect to appropriate dashboard
            return res.redirect(`/${user.role}`);
        });
    } catch (err) {
        console.error('Error during login:', err);
        return res.render('login', { 
            error: 'An error occurred. Please try again.',
            validationErrors: {},
            email: req.body.email || ''
        });
    }
});

// Handle main login form submission (without role)
router.post('/login', userController.login);

// Signup page for each role
router.get('/signup/:role', (req, res) => {
    const { role } = req.params;
    if (!['organizer', 'player', 'manager'].includes(role)) {
        return res.redirect('/');
    }
    res.render('signup', { role, error: null });
});

// Handle signup form submission
router.post('/signup/:role', (req, res, next) => {
    // Add role to body
    req.body.role = req.params.role;
    
    // Form validation
    const validationErrors = {};
    
    if (!req.body.first_name) validationErrors.first_name = 'First name is required';
    if (!req.body.last_name) validationErrors.last_name = 'Last name is required';
    
    // Email validation
    if (!req.body.email) {
        validationErrors.email = 'Email is required';
    } else {
        // Regex pattern for email validation
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(req.body.email)) {
            validationErrors.email = 'Please enter a valid email address';
        }
    }
    
    // Phone validation
    if (!req.body.phone) {
        validationErrors.phone = 'Phone number is required';
    } else {
        // Regex pattern for 10-digit phone number
        const phonePattern = /^[0-9]{10}$/;
        if (!phonePattern.test(req.body.phone)) {
            validationErrors.phone = 'Please enter a valid 10-digit phone number';
        }
    }
    
    if (!req.body.password) validationErrors.password = 'Password is required';
    if (req.body.password && req.body.password.length < 6) validationErrors.password = 'Password must be at least 6 characters';
    if (!req.body.confirm_password) validationErrors.confirm_password = 'Please confirm your password';
    if (req.body.password !== req.body.confirm_password) validationErrors.confirm_password = 'Passwords do not match';
    
    // If validation fails, re-render the form with errors
    if (Object.keys(validationErrors).length > 0) {
        return res.render('signup', { 
            role: req.params.role,
            error: 'Please fix the errors below',
            validationErrors,
            formData: { 
                first_name: req.body.first_name, 
                last_name: req.body.last_name, 
                email: req.body.email, 
                phone: req.body.phone 
            }
        });
    }
    
    userController.register(req, res, next);
});

// Logout route
router.get('/logout', userController.logout);

// Test route to check session
router.get('/session-test', (req, res) => {
    res.json({
        session: req.session,
        sessionID: req.sessionID,
        user: req.session.user,
        locals: res.locals
    });
});

// 404 route
router.get('/404', (req, res) => {
    res.status(404).render('404', { layout: 'layouts/errorpages' });
});

// 500 route
router.get('/500', (req, res) => {
    res.status(500).render('500', { layout: 'layouts/errorpages' });
});

module.exports = router; 