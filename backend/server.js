const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const User = require('./models/user');
const app = express();
const port = process.env.PORT || 5000;

// Database setup - use the existing connection in mongodb.js
const mongoose = require('./config/mongodb');

// CORS Configuration - Allow React frontend to communicate with backend
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true, // Allow cookies to be sent
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (images, uploads)
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

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

// Error handling middleware
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.path
    });
});

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Backend server running on http://localhost:${port}`);
    console.log(`Frontend should be running on http://localhost:3000`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
