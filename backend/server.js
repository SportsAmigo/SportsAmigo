require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const csrf = require('csurf');
const helmet = require('helmet');
const morgan = require('morgan');
const rfs = require('rotating-file-stream');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const redisClient = require('./config/redis');

const User = require('./models/user');
const app = express();
// Trust Render/Heroku reverse proxy so req.secure works and secure cookies are sent
app.set('trust proxy', 1);
const port = process.env.PORT || 5000;
const mongoose = require('./config/mongodb');
const mongoUri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    (process.env.NODE_ENV === 'production' ? null : 'mongodb://localhost:27017/sportsamigo');

if (!mongoUri) {
    console.error('MongoDB URI is missing. Set MONGO_URI or MONGODB_URI.');
    process.exit(1);
}

app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://sports-amigo.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, Postman)
        if (!origin) return callback(null, true);
        // Allow exact matches and Vercel preview deployments (*.vercel.app)
        if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'CSRF-Token'],
    exposedHeaders: ['Set-Cookie', 'X-Cache-Status', 'X-Cache-TTL']
};

app.use(cors(corsOptions));
// Use the same corsOptions for preflight so credentials are preserved
app.options('*', cors(corsOptions));

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

const accessLogStream = rfs.createStream('access.log', {
    interval: '1d',
    maxFiles: 30,
    path: logsDir
});

app.use(morgan('combined', { stream: accessLogStream }));
if (process.env.NODE_ENV !== 'production') {
    app.use(morgan('dev'));
}

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const uploadsDir = path.join(__dirname, 'public', 'uploads');
const profileUploadsDir = path.join(uploadsDir, 'profile');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(profileUploadsDir)) {
    fs.mkdirSync(profileUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, profileUploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024
    },
    fileFilter: function (req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

const uploadProfile = upload.single('profileImage');

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Cross-site deployments (e.g. Vercel frontend → Render backend) require
// SameSite=None + Secure=true.  Render does NOT set NODE_ENV automatically,
// so we support explicit env var overrides as a safe fallback.
const isProduction = process.env.NODE_ENV === 'production';
const cookieSecure = process.env.COOKIE_SECURE !== undefined
    ? process.env.COOKIE_SECURE === 'true'
    : isProduction;
const cookieSameSite = process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax');

app.use(session({
    secret: process.env.SESSION_SECRET || 'sportsamigo-app-secret-2023',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: mongoUri,
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60
    }),
    cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSameSite
    }
}));

const csrfProtection = csrf({
    cookie: false,
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
});

// Skip CSRF protection in test environment
if (process.env.NODE_ENV === 'test') {
    app.use((req, res, next) => next());
} else {
    app.use((req, res, next) => {
        if (req.path === '/api/health' ||
            req.path === '/health' ||
            req.path === '/api/csrf-token' ||
            req.path.startsWith('/auth/') ||
            req.path.startsWith('/api/auth/') ||
            req.path.startsWith('/api/shop-login/') ||
            req.path.startsWith('/api/subscription/') ||
            req.path.startsWith('/api/vas/') ||
            req.path.startsWith('/api/v1/') ||
            req.path.startsWith('/api-docs')) {
            return next();
        }
        csrfProtection(req, res, next);
    });
} // end else (non-test CSRF block)

app.get('/api/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

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

const healthRouter = require('./routes/health');
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

// New routes for tier system, commissions, subscriptions, and moderation
const moderatorRoutes = require('./routes/moderator');
const subscriptionRoutes = require('./routes/subscription');
const commissionRoutes = require('./routes/commission');
const tierManagementRoutes = require('./routes/tier-management');
const vasRoutes = require('./routes/vas');

// v1 RESTful routes
const v1SubscriptionRoutes = require('./routes/v1/subscriptions');
const v1VASRoutes = require('./routes/v1/vas');

let adminRoutes;
try {
    adminRoutes = require('./routes/admin');
} catch (err) {
    console.error('Error loading admin routes:', err.message);
    adminRoutes = null;
}

app.use('/health', healthRouter);

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// Swagger API Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'SportsAmigo API Docs',
    customfavIcon: '/images/favicon.ico'
}));

// Raw JSON spec endpoint
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.use('/api/auth', authApiRoutes);
app.use('/auth', authRoutes);
app.use('/api/organizer', organizerApiRoutes);
app.use('/organizer', organizerRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api', apiRoutes);
app.use('/api/shop', require('./routes/shop-api'));
app.use('/api/wallet', walletRoutes);
app.use('/api/shop-login', shopLoginRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/matches', matchRoutes);

// New routes (coordinator = moderator, support both paths)
app.use('/api/moderator', moderatorRoutes);
app.use('/api/coordinator', moderatorRoutes);
app.use('/moderator', moderatorRoutes);
app.use('/coordinator', moderatorRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/subscription', subscriptionRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/commission', commissionRoutes);
app.use('/api/tier', tierManagementRoutes);
app.use('/tier', tierManagementRoutes);
app.use('/api/vas', vasRoutes);
app.use('/vas', vasRoutes);

// v1 RESTful API routes
console.log('[server] Mounting v1 subscription routes at /api/v1/subscriptions');
app.use('/api/v1/subscriptions', v1SubscriptionRoutes);
console.log('[server] Mounting v1 VAS routes at /api/v1');
app.use('/api/v1', v1VASRoutes);

if (adminRoutes) {
    app.use('/api/admin', adminRoutes);
}

app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    const statusCode = err.statusCode || err.status || 500;

    const errorLog = {
        timestamp: new Date().toISOString(),
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('user-agent')
    };

    console.error('===== SERVER ERROR =====');
    console.error('Time:', errorLog.timestamp);
    console.error('Path:', errorLog.path);
    console.error('Method:', errorLog.method);
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    console.error('========================');

    const errorLogPath = path.join(__dirname, 'logs', 'error.log');
    fs.appendFile(errorLogPath, JSON.stringify(errorLog, null, 2) + '\n\n', (writeErr) => {
        if (writeErr) console.error('Failed to write error log:', writeErr);
    });

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

    res.status(statusCode).json({
        success: false,
        message: statusCode === 500 ? 'Internal server error' : err.message,
        error: process.env.NODE_ENV === 'development' ? {
            message: err.message,
            stack: err.stack
        } : undefined
    });
});

if (process.env.NODE_ENV !== 'test') {
    const { startKeepAlive } = require('./utils/keepAlive');

    app.listen(port, () => {
        console.log(`Backend server running on http://localhost:${port}`);
        console.log(`Frontend should be running on http://localhost:3000`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        startKeepAlive();
    });
}

module.exports = app;
