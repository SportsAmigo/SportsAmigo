/**
 * Value-Added Services (VAS) Routes
 * 
 * Handles all VAS purchases for organizers and players
 */

const express = require('express');
const router = express.Router();

const {
  getVASProducts,
  getMyVASPurchases,
  buyEventInsurance,
  buyMarketingBoost,
  buyCertificates,
  buySMSPackage,
  buyPremiumProfile,
  buyPerformanceAnalytics,
  buyPlayerInsurance,
  cancelVAS,
  getVASRevenueStats,
  checkVASStatus
} = require('../controllers/vasController');

// Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(401).json({
    success: false,
    error: 'Authentication required'
  });
}

// Middleware to check if user is organizer
function isOrganizer(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'organizer') {
    return next();
  }
  res.status(403).json({
    success: false,
    error: 'Organizer access required'
  });
}

// Middleware to check if user is player
function isPlayer(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'player') {
    return next();
  }
  res.status(403).json({
    success: false,
    error: 'Player access required'
  });
}

// Middleware to check if user is admin
function isAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  res.status(403).json({
    success: false,
    error: 'Admin access required'
  });
}

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * GET /api/vas/products - Get all VAS products with pricing
 * Query: ?category=organizer|player
 */
router.get('/products', getVASProducts);

/**
 * GET /api/vas/products/:category - Get VAS products by category
 */
router.get('/products/:category', (req, res) => {
  req.query.category = req.params.category;
  getVASProducts(req, res);
});

// ============================================
// AUTHENTICATED ROUTES
// ============================================

/**
 * GET /api/vas/my-purchases - Get user's VAS purchases
 * Query: ?status=active|expired&serviceType=...
 */
router.get('/my-purchases', isAuthenticated, getMyVASPurchases);

/**
 * GET /api/vas/check/:serviceType - Check if user has active VAS
 */
router.get('/check/:serviceType', isAuthenticated, checkVASStatus);

/**
 * POST /api/vas/cancel/:id - Cancel VAS purchase
 */
router.post('/cancel/:id', isAuthenticated, cancelVAS);

// ============================================
// ORGANIZER ROUTES
// ============================================

/**
 * POST /api/vas/organizer/insurance - Purchase event insurance
 * Body: { eventId, insuranceType: 'basic'|'standard'|'premium' }
 */
router.post('/organizer/insurance', isAuthenticated, isOrganizer, buyEventInsurance);

/**
 * POST /api/vas/organizer/marketing - Purchase marketing boost
 * Body: { eventId, boostType: 'basic'|'standard'|'premium' }
 */
router.post('/organizer/marketing', isAuthenticated, isOrganizer, buyMarketingBoost);

/**
 * POST /api/vas/organizer/certificates - Purchase certificate generation
 * Body: { eventId, certificateCount: number }
 */
router.post('/organizer/certificates', isAuthenticated, isOrganizer, buyCertificates);

/**
 * POST /api/vas/organizer/sms - Purchase SMS notification package
 * Body: { eventId, smsCount: number }
 */
router.post('/organizer/sms', isAuthenticated, isOrganizer, buySMSPackage);

// ============================================
// PLAYER ROUTES
// ============================================

/**
 * POST /api/vas/player/premium-profile - Purchase premium player profile
 * Body: {} (no body required, uses session user)
 */
router.post('/player/premium-profile', isAuthenticated, isPlayer, buyPremiumProfile);

/**
 * POST /api/vas/player/analytics - Purchase performance analytics
 * Body: {} (no body required)
 */
router.post('/player/analytics', isAuthenticated, isPlayer, buyPerformanceAnalytics);

/**
 * POST /api/vas/player/insurance - Purchase player insurance
 * Body: { insurancePlan: 'basic'|'comprehensive' }
 */
router.post('/player/insurance', isAuthenticated, isPlayer, buyPlayerInsurance);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * GET /api/vas/admin/revenue - Get VAS revenue statistics
 * Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 */
router.get('/admin/revenue', isAuthenticated, isAdmin, getVASRevenueStats);

// ============================================
// VIEW ROUTES (for rendering pages)
// ============================================

/**
 * GET /vas/organizer/services - View all organizer services
 */
router.get('/organizer/services', isAuthenticated, isOrganizer, (req, res) => {
  res.render('vas/organizer-services', {
    title: 'Value-Added Services - SportsAmigo',
    user: req.session.user
  });
});

/**
 * GET /vas/player/services - View all player services
 */
router.get('/player/services', isAuthenticated, isPlayer, (req, res) => {
  res.render('vas/player-services', {
    title: 'Enhanced Services - SportsAmigo',
    user: req.session.user
  });
});

/**
 * GET /vas/my-services - View user's purchased services
 */
router.get('/my-services', isAuthenticated, (req, res) => {
  res.render('vas/my-services', {
    title: 'My Services - SportsAmigo',
    user: req.session.user
  });
});

module.exports = router;
