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
    res.render('index', {
        title: 'SportsAmigo - Home',
        cartCount: res.locals.cartCount || 0,
        user: res.locals.user || null
    });
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
        
        // Check if this is an AJAX request
        const isAjax = req.headers['content-type'] === 'application/json' || 
                      req.headers['x-requested-with'] === 'XMLHttpRequest';
        
        // Authenticate user
        const user = await userController.authUser(email, password);
        
        if (!user) {
            console.log('Login failed: Invalid credentials');
            
            if (isAjax) {
                return res.json({
                    success: false,
                    message: 'Invalid email or password',
                    errors: { email: 'Invalid email or password' }
                });
            }
            
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
            
            const errorMessage = `You are registered as a ${user.role}, not a ${role}. Please use the correct login page.`;
            
            if (isAjax) {
                return res.json({
                    success: false,
                    message: errorMessage,
                    errors: { role: errorMessage }
                });
            }
            
            return res.render('login', { 
                role,
                error: errorMessage,
                validationErrors: {},
                email: email || ''
            });
        }
        
        // Fetch fresh user data from database to ensure we have the latest data
        const User = require('../models/user');
        const freshUserData = await User.getUserById(user._id);
        
        if (!freshUserData) {
            const errorMessage = 'Failed to retrieve user data. Please try again.';
            
            if (isAjax) {
                return res.json({
                    success: false,
                    message: errorMessage
                });
            }
            
            return res.render('login', { 
                role,
                error: errorMessage,
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
                
                if (isAjax) {
                    return res.json({
                        success: false,
                        message: 'Session error. Please try again.'
                    });
                }
                
                return res.render('login', { 
                    role,
                    error: 'Session error. Please try again.',
                    validationErrors: {},
                    email: email || ''
                });
            }
            
            console.log('User logged in successfully:', freshUserData.email, 'Profile image:', freshUserData.profile_image);
            
            if (isAjax) {
                return res.json({
                    success: true,
                    message: 'Login successful!',
                    redirectUrl: `/${user.role}`,
                    user: {
                        name: sessionUser.name,
                        email: sessionUser.email,
                        role: sessionUser.role
                    }
                });
            }
            
            // Redirect to appropriate dashboard
            return res.redirect(`/${user.role}`);
        });
    } catch (err) {
        console.error('Error during login:', err);
        
        const isAjax = req.headers['content-type'] === 'application/json' || 
                      req.headers['x-requested-with'] === 'XMLHttpRequest';
        
        if (isAjax) {
            return res.json({
                success: false,
                message: 'An error occurred. Please try again.'
            });
        }
        
        return res.render('login', { 
            role: req.params.role,
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
router.post('/signup/:role', async (req, res, next) => {
    try {
        // Add role to body
        req.body.role = req.params.role;
        
        // Check if this is an AJAX request
        const isAjax = req.headers['content-type'] === 'application/json' || 
                      req.headers['x-requested-with'] === 'XMLHttpRequest';
        
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
        
        // Phone validation (Indian mobile numbers should start with 6,7,8,9)
        if (!req.body.phone) {
            validationErrors.phone = 'Phone number is required';
        } else {
            // Regex pattern for 10-digit Indian mobile numbers starting with 6-9
            const phonePattern = /^[6-9][0-9]{9}$/;
            if (!phonePattern.test(req.body.phone)) {
                validationErrors.phone = 'Please enter a valid 10-digit mobile number starting with 6,7,8 or 9';
            }
        }
        
        if (!req.body.password) validationErrors.password = 'Password is required';
        if (req.body.password && req.body.password.length < 6) validationErrors.password = 'Password must be at least 6 characters';
        if (!req.body.confirm_password) validationErrors.confirm_password = 'Please confirm your password';
        if (req.body.password !== req.body.confirm_password) validationErrors.confirm_password = 'Passwords do not match';
        
        // If validation fails, return appropriate response
        if (Object.keys(validationErrors).length > 0) {
            if (isAjax) {
                return res.json({
                    success: false,
                    message: 'Please fix the validation errors',
                    errors: validationErrors
                });
            }
            
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
        
        // Create custom request handler for AJAX
        if (isAjax) {
            const userController = require('../controllers/userController');
            
            try {
                // Check if user already exists
                const User = require('../models/user');
                const existingUser = await User.getUserByEmail(req.body.email);
                
                if (existingUser) {
                    return res.json({
                        success: false,
                        message: 'Email already registered',
                        errors: { email: 'This email is already registered' }
                    });
                }
                
                // Create new user
                const newUser = await User.createUser({
                    first_name: req.body.first_name,
                    last_name: req.body.last_name,
                    email: req.body.email,
                    phone: req.body.phone,
                    password: req.body.password,
                    role: req.body.role
                });
                
                if (newUser) {
                    console.log('New user created via AJAX:', newUser.email);
                    
                    return res.json({
                        success: true,
                        message: 'Registration successful! Please login with your credentials.',
                        redirectUrl: `/auth/login/${req.body.role}`,
                        user: {
                            name: newUser.first_name + ' ' + newUser.last_name,
                            email: newUser.email,
                            role: newUser.role
                        }
                    });
                } else {
                    return res.json({
                        success: false,
                        message: 'Failed to create user account'
                    });
                }
                
            } catch (error) {
                console.error('AJAX signup error:', error);
                
                if (error.message && error.message.includes('duplicate')) {
                    return res.json({
                        success: false,
                        message: 'Email already registered',
                        errors: { email: 'This email is already registered' }
                    });
                }
                
                return res.json({
                    success: false,
                    message: 'Registration failed. Please try again.'
                });
            }
        }
        
        // For non-AJAX requests, use the original controller
        userController.register(req, res, next);
        
    } catch (error) {
        console.error('Signup error:', error);
        
        const isAjax = req.headers['content-type'] === 'application/json' || 
                      req.headers['x-requested-with'] === 'XMLHttpRequest';
        
        if (isAjax) {
            return res.json({
                success: false,
                message: 'An error occurred during registration. Please try again.'
            });
        }
        
        return res.render('signup', { 
            role: req.params.role,
            error: 'An error occurred. Please try again.',
            validationErrors: {},
            formData: { 
                first_name: req.body.first_name, 
                last_name: req.body.last_name, 
                email: req.body.email, 
                phone: req.body.phone 
            }
        });
    }
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