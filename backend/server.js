const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const csrf = require('csurf');

// ============================================================================
// 1. SECURITY MIDDLEWARES - Import helmet for HTTP security headers
// ============================================================================
const helmet = require('helmet');

// ============================================================================
// 2. LOGGING MIDDLEWARES - Import morgan and rotating-file-stream for advanced logging
// ============================================================================
const morgan = require('morgan');
const rfs = require('rotating-file-stream');

// ============================================================================
// 3. FILE UPLOAD MIDDLEWARE - Import multer for handling multipart/form-data
// ============================================================================
const multer = require('multer');

// ============================================================================
// 4. VALIDATION MIDDLEWARE - Import express-validator for input validation
// ============================================================================
const { body, validationResult } = require('express-validator');

const User = require('./models/user');
const app = express();
const port = process.env.PORT || 5000;

// Database setup - use the existing connection in mongodb.js
const mongoose = require('./config/mongodb');

// ============================================================================
// MIDDLEWARE CONFIGURATION (Order matters!)
// ============================================================================

// ----------------------------------------------------------------------------
// 1. SECURITY CONFIGURATION (Helmet & CORS)
// ----------------------------------------------------------------------------
/**
 * HELMET: Sets secure HTTP headers to protect against common web vulnerabilities
 * - Prevents clickjacking (X-Frame-Options)
 * - Prevents MIME type sniffing (X-Content-Type-Options)
 * - Enables XSS filter (X-XSS-Protection)
 * - Enforces HTTPS in production (Strict-Transport-Security)
 */
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for development; configure properly in production
    crossOriginEmbedderPolicy: false // Allow loading external resources
}));

/**
 * CORS: Cross-Origin Resource Sharing configuration
 * - Allows React frontend to communicate with backend API
 * - Enables credentials (cookies, authorization headers)
 * - Restricts origins to trusted domains (localhost for development)
 */
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// ----------------------------------------------------------------------------
// 2. ADVANCED LOGGING (Morgan + Rotating File Stream)
// ----------------------------------------------------------------------------
/**
 * Create logs directory if it doesn't exist
 * All HTTP access logs will be stored here with automatic rotation
 */
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
    console.log('📁 Logs directory created:', logsDir);
}

/**
 * ROTATING FILE STREAM: Automatically rotates log files daily
 * - Prevents single log file from growing too large
 * - Creates new log file each day (access-YYYY-MM-DD.log)
 * - Automatically archives old logs
 * - interval: '1d' = rotate daily, maxFiles: 30 = keep last 30 days
 */
const accessLogStream = rfs.createStream('access.log', {
    interval: '1d', // Rotate daily
    maxFiles: 30, // Keep logs for 30 days
    path: logsDir
});

/**
 * MORGAN: HTTP request logger middleware
 * - 'combined' format includes: IP, timestamp, method, URL, status, user-agent
 * - Logs all requests to rotating file for audit trail and debugging
 * - Also logs to console in development mode for real-time monitoring
 */
app.use(morgan('combined', { stream: accessLogStream })); // Log to file
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev')); // Also log to console in dev mode
}

// ----------------------------------------------------------------------------
// Body Parser Middleware
// ----------------------------------------------------------------------------
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ----------------------------------------------------------------------------
// 3. FILE UPLOAD CONFIGURATION (Multer)
// ----------------------------------------------------------------------------
/**
 * Create uploads directory structure if it doesn't exist
 * Organizes uploads into subdirectories for better file management
 */
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const profileUploadsDir = path.join(uploadsDir, 'profile');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(profileUploadsDir)) {
    fs.mkdirSync(profileUploadsDir, { recursive: true });
}

/**
 * MULTER STORAGE CONFIGURATION: Defines where and how to store uploaded files
 * - destination: Stores profile images in uploads/profile directory
 * - filename: Generates unique filename using timestamp and original name
 * - Prevents file conflicts and enables easy file organization
 */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, profileUploadsDir); // Save to uploads/profile
    },
    filename: function (req, file, cb) {
        // Create unique filename: timestamp-originalname.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

/**
 * MULTER MIDDLEWARE: Handles multipart/form-data (file uploads)
 * - Limits file size to 5MB to prevent abuse
 * - Filters file types to only accept images (jpg, jpeg, png, gif)
 * - Provides security against malicious file uploads
 */
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

/**
 * UPLOAD HELPER MIDDLEWARE for Profile Images
 * - Specifically configured for handling 'profileImage' field
 * - Use in routes like: app.post('/upload', uploadProfile, handler)
 */
const uploadProfile = upload.single('profileImage');

// Serve static files (images, uploads)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'sportsamigo-app-secret-2023',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/sportsamigo',
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
}));

// ----------------------------------------------------------------------------
// 4. CSRF PROTECTION CONFIGURATION
// ----------------------------------------------------------------------------
/**
 * CSRF: Cross-Site Request Forgery Protection
 * - Protects against unauthorized commands being transmitted from a user that the web application trusts
 * - Generates unique tokens for each session that must be included in state-changing requests
 * - Cookie-based CSRF tokens work well with session-based authentication
 */
const csrfProtection = csrf({ 
    cookie: false, // Use session-based tokens instead of cookies
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'] // Don't require CSRF for safe methods
});

// Apply CSRF protection to all routes except health check and GET requests
// Note: Frontend needs to fetch token via GET /api/csrf-token and include it in POST/PUT/DELETE requests
app.use((req, res, next) => {
    // Skip CSRF for health check, login, and registration endpoints
    if (req.path === '/api/health' || 
        req.path === '/api/csrf-token' ||
        req.path.includes('/api/auth/login') ||
        req.path.includes('/api/auth/register')) {
        return next();
    }
    csrfProtection(req, res, next);
});

// Endpoint to get CSRF token for frontend
app.get('/api/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// Middleware to attach user data to request
app.use((req, res, next) => {
    if (req.session && req.session.user) {
        req.user = req.session.user;
    }
    if (req.session && req.session.shopUser) {
        req.shopUser = req.session.shopUser;
    }
    if (req.session && req.session.cart) {
        req.cart = req.session.cart;
    } else {
        req.cart = { items: [], itemCount: 0, totalAmount: 0 };
    }
    next();
});

// Import API routes
const authRoutes = require('./routes/auth');
const authApiRoutes = require('./routes/auth-api');
const organizerRoutes = require('./routes/organizer');
const organizerApiRoutes = require('./routes/organizer-api');
const playerRoutes = require('./routes/player');
const managerRoutes = require('./routes/manager');
const apiRoutes = require('./routes/api');
const shopRoutes = require('./routes/shop');
const walletRoutes = require('./routes/wallet');
const shopLoginRoutes = require('./routes/shopLogin');
const checkoutRoutes = require('./routes/checkout');
const cartRoutes = require('./routes/cart');
const matchRoutes = require('./routes/matches');

// Admin routes with error handling
let adminRoutes;
try {
    adminRoutes = require('./routes/admin');
    console.log('Admin routes loaded successfully');
} catch (err) {
    console.error('Error loading admin routes:', err.message);
    adminRoutes = null;
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// ============================================================================
// 4. VALIDATION MIDDLEWARE EXAMPLE (Express Validator)
// ============================================================================
/**
 * EXPRESS-VALIDATOR: Available for input validation in routes
 * 
 * Example usage in any route:
 * router.post('/endpoint', [
 *   body('email').isEmail().withMessage('Invalid email'),
 *   body('password').isLength({ min: 6 }).withMessage('Password too short')
 * ], (req, res) => {
 *   const errors = validationResult(req);
 *   if (!errors.isEmpty()) {
 *     return res.status(400).json({ errors: errors.array() });
 *   }
 *   // Process valid data...
 * });
 * 
 * The uploadProfile middleware is available for file uploads:
 * router.post('/upload', uploadProfile, (req, res) => { ... });
 */


// ============================================================================
// APPLICATION ROUTES
// ============================================================================
// Note: Middleware order is critical - Security/Logging/Parsing must come 
// before routes, and error handlers must come last

// Mount API routes
app.use('/api/auth', authApiRoutes); // Use auth-api for React frontend
app.use('/auth', authRoutes); // Keep auth.js for backward compatibility
app.use('/api/organizer', organizerApiRoutes); // React API routes
app.use('/organizer', organizerRoutes); // EJS/web routes
app.use('/api/player', playerRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api', apiRoutes);
app.use('/api/shop', require('./routes/shop-api'));
app.use('/api/wallet', walletRoutes);
app.use('/api/shop-login', shopLoginRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/matches', matchRoutes);

if (adminRoutes) {
    app.use('/api/admin', adminRoutes);
    console.log('Admin routes configured successfully');
}

// ============================================================================
// 5. ERROR HANDLING & LOGGING MIDDLEWARE (Must be last)
// ============================================================================

// 404 Not Found Handler
app.use((req, res, next) => {
    const error = {
        success: false,
        message: 'API endpoint not found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    };
    
    // Log 404 errors to file
    console.error(`404 Error: ${req.method} ${req.path}`);
    
    res.status(404).json(error);
});

// Global Error Handler with Enhanced Logging
app.use((err, req, res, next) => {
    // Determine error status code
    const statusCode = err.statusCode || err.status || 500;
    
    // Log error details
    const errorLog = {
        timestamp: new Date().toISOString(),
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent')
    };
    
    // Console log the error with stack trace
    console.error('===== SERVER ERROR =====');
    console.error('Time:', errorLog.timestamp);
    console.error('Path:', errorLog.path);
    console.error('Method:', errorLog.method);
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    console.error('========================');
    
    // Write detailed error log to file
    const errorLogPath = path.join(__dirname, 'logs', 'error.log');
    fs.appendFile(errorLogPath, JSON.stringify(errorLog, null, 2) + '\n\n', (writeErr) => {
        if (writeErr) console.error('Failed to write error log:', writeErr);
    });
    
    // Handle specific error types
    if (err.code === 'EBADCSRFTOKEN') {
        return res.status(403).json({
            success: false,
            message: 'Invalid or missing CSRF token',
            error: 'CSRF_VALIDATION_FAILED'
        });
    }
    
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation error',
            errors: err.errors
        });
    }
    
    // Generic error response
    res.status(statusCode).json({
        success: false,
        message: statusCode === 500 ? 'Internal server error' : err.message,
        error: process.env.NODE_ENV === 'development' ? {
            message: err.message,
            stack: err.stack
        } : undefined
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
    console.log(`Frontend should be running on http://localhost:3000`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
