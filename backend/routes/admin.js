const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const adminController = require('../controllers/adminController');

// Import models directly instead of using destructuring
const User = require('../models/user');
const Team = require('../models/team');
const Event = require('../models/event');

// Middleware to ensure admin authentication
const ensureAdminAuth = (req, res, next) => {
  // Check if user is logged in and has admin role
  if (!req.session.user) {
    console.log('Admin auth failed: No session user');
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please log in as admin.'
    });
  }

  if (req.session.user.role !== 'admin') {
    console.log('Admin auth failed: User role is', req.session.user.role);
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }

  console.log('Admin authenticated:', req.session.user.email);
  next();
};

// Apply admin authentication middleware to all routes
router.use(ensureAdminAuth);

function toPositiveInt(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

function getSearchHeaderValues(searchMeta = {}) {
  const engineKey = searchMeta.engine;
  const engine = engineKey === 'solr'
    ? 'SearchStax-Solr'
    : engineKey === 'mongodb'
      ? 'MongoDB-Fallback'
      : 'none';

  const provider = engineKey === 'solr'
    ? 'SearchStax (Apache Solr)'
    : 'MongoDB Fallback';

  return { engine, provider };
}

// ─── Solr / SearchStax Search Endpoint ─────────────────────────────────────────
router.get('/search', async (req, res) => {
  const startTime = Date.now();
  try {
    const { q = '', type = 'all', role } = req.query;
    const page = toPositiveInt(req.query.page, 1);
    const limit = toPositiveInt(req.query.limit, 20);
    const { searchEvents, searchTeams, searchUsers } = require('../services/searchService');
    const { solrConfig } = require('../config/solr');

    const results = {};
    const engines = [];

    if (type === 'all' || type === 'events') {
      const eventResult = await searchEvents({ search: q, page, limit });
      results.events = eventResult;
      if (eventResult.searchMeta) engines.push(eventResult.searchMeta.engine);
    }
    if (type === 'all' || type === 'teams') {
      const teamResult = await searchTeams({ search: q, page, limit });
      results.teams = teamResult;
      if (teamResult.searchMeta) engines.push(teamResult.searchMeta.engine);
    }
    if (type === 'all' || type === 'users') {
      const userResult = await searchUsers({ search: q, page, limit, role });
      results.users = userResult;
      if (userResult.searchMeta) engines.push(userResult.searchMeta.engine);
    }

    const elapsed = Date.now() - startTime;
    const hasSolr = engines.includes('solr');
    const hasFallback = engines.includes('mongodb');
    const engine = hasSolr && hasFallback ? 'Mixed-Solr+Mongo' : hasSolr ? 'SearchStax-Solr' : 'MongoDB-Fallback';
    const provider = hasSolr ? 'SearchStax (Apache Solr)' : 'MongoDB Fallback';

    // These headers are visible in the browser Network tab for professor demo
    res.set('X-Search-Engine', engine);
    res.set('X-Search-Time', `${elapsed}ms`);
    res.set('X-Search-Provider', provider);
    res.set('X-Solr-Enabled', String(solrConfig.enabled));
    res.set('X-Solr-BaseUrl', solrConfig.baseUrl ? 'configured' : 'not-set');

    return res.json({
      success: true,
      query: q,
      type,
      page,
      limit,
      results,
      searchMeta: {
        engine,
        provider,
        solrEnabled: solrConfig.enabled,
        solrConfigured: !!solrConfig.baseUrl,
        responseTimeMs: elapsed,
        timestamp: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Admin search error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Solr Reindex Endpoint (for demo) ──────────────────────────────────────────
router.post('/search/reindex', async (req, res) => {
  try {
    const { reindexEvents, reindexTeams, reindexUsers } = require('../services/solrIndexService');
    const startTime = Date.now();

    const eventCount = await reindexEvents({ commit: true });
    const teamCount = await reindexTeams({ commit: true });
    let userCount = 0;
    try { userCount = await reindexUsers({ commit: true }); } catch (e) { console.warn('User reindex skipped:', e.message); }

    const elapsed = Date.now() - startTime;
    res.set('X-Solr-Reindex-Time', `${elapsed}ms`);
    return res.json({
      success: true,
      data: { events: eventCount, teams: teamCount, users: userCount, timeMs: elapsed }
    });
  } catch (err) {
    console.error('Solr reindex error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard metrics
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics returned
 *
 * /api/admin/users:
 *   get:
 *     summary: Get all users across supported roles
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Users returned
 *
 * /api/admin/users/{role}:
 *   get:
 *     summary: Get users filtered by role
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         required: true
 *         schema:
 *           type: string
 *           enum: [player, manager, organizer]
 *     responses:
 *       200:
 *         description: Filtered users returned
 *       400:
 *         description: Invalid role
 *
 * /api/admin/teams:
 *   get:
 *     summary: Get all teams
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Teams returned
 *   delete:
 *     summary: Delete team by id
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team deleted
 *
 * /api/admin/teams/{id}:
 *   delete:
 *     summary: Delete a team
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team deleted
 *
 * /api/admin/events:
 *   get:
 *     summary: Get all events
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Events returned
 *
 * /api/admin/events/{id}:
 *   get:
 *     summary: Get event details for admin
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event returned
 *   delete:
 *     summary: Delete event by id
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Event deleted
 *
 * /api/admin/matches:
 *   get:
 *     summary: Get all matches for admin view
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Matches returned
 *
 * /api/admin/stats:
 *   get:
 *     summary: Get admin summary statistics
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Stats returned
 *
 * /api/admin/tournaments:
 *   get:
 *     summary: Get tournament list
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Tournaments returned
 *
 * /api/admin/activity-logs:
 *   get:
 *     summary: Get recent admin activity logs
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Activity logs returned
 *
 * /api/admin/transactions:
 *   get:
 *     summary: Get transaction list for admin
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Transactions returned
 *
 * /api/admin/organizers:
 *   get:
 *     summary: Get organizer accounts
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Organizers returned
 *
 * /api/admin/managers:
 *   get:
 *     summary: Get manager accounts
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Managers returned
 *
 * /api/admin/players:
 *   get:
 *     summary: Get player accounts
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Players returned
 *
 * /api/admin/api/orders/{id}:
 *   get:
 *     summary: Get order details by id
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order details returned
 *
 * /api/admin/api/orders/{id}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order status updated
 *
 * /api/admin/api/transactions/export:
 *   get:
 *     summary: Export transactions report
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Export generated
 *
 * /api/admin/api/players/{id}:
 *   get:
 *     summary: Get single player profile for admin
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Player details returned
 *
 * /api/admin/api/managers/{id}:
 *   get:
 *     summary: Get single manager profile for admin
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Manager details returned
 *
 * /api/admin/api/organizers/{id}:
 *   get:
 *     summary: Get single organizer profile for admin
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Organizer details returned
 *
 * /api/admin/api/teams/{id}:
 *   get:
 *     summary: Get single team details for admin
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team details returned
 *
 * /api/admin/users/manager/{id}:
 *   delete:
 *     summary: Delete manager account
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Manager deleted
 *
 * /api/admin/users/organizer/{id}:
 *   delete:
 *     summary: Delete organizer account
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Organizer deleted
 *
 * /api/admin/users/player/{id}:
 *   delete:
 *     summary: Delete player account
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Player deleted
 */

// Admin dashboard - JSON API for React frontend
router.get('/dashboard', async (req, res) => {
  try {
    console.log('API: Admin dashboard requested by:', req.session.user.email);

    // Get stats from admin controller
    const stats = await adminController.getDashboardStats();

    // Get recent activities for activity feed
    const recentActivities = await adminController.getRecentActivities(10);

    // Get upcoming events
    const upcomingEvents = await adminController.getUpcomingEvents(10);

    return res.json({
      success: true,
      counts: {
        users: stats.users.total,
        players: stats.users.players,
        managers: stats.users.managers,
        organizers: stats.users.organizers,
        teams: stats.teams.total,
        events: stats.events.total
      },
      activities: recentActivities,
      upcomingEvents: upcomingEvents
    });
  } catch (err) {
    console.error('Error loading admin dashboard:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to load admin dashboard',
      error: err.message
    });
  }
});

// Get all users by role - JSON API
router.get('/users/:role', async (req, res) => {
  try {
    const { role } = req.params;

    if (!['player', 'manager', 'organizer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be player, manager, or organizer.'
      });
    }

    console.log(`API: Fetching all ${role}s`);
    const users = await adminController.getAllUsersByRole(role);

    return res.json({
      success: true,
      role: role,
      count: users.length,
      users: users
    });
  } catch (err) {
    console.error(`Error fetching ${req.params.role}s:`, err);
    return res.status(500).json({
      success: false,
      message: `Failed to fetch ${req.params.role}s`,
      error: err.message
    });
  }
});

// Get all users (unified view) - JSON API
router.get('/users', async (req, res) => {
  const startTime = Date.now();
  try {
    const q = req.query.q || req.query.search || '';
    const role = req.query.role;
    const page = toPositiveInt(req.query.page, 1);
    const limit = toPositiveInt(req.query.limit, 20);

    // If search query provided, use Solr-powered search
    if (q.trim()) {
      const { searchUsers } = require('../services/searchService');
      const result = await searchUsers({ search: q, role, page, limit });
      const elapsed = Date.now() - startTime;
      const { engine, provider } = getSearchHeaderValues(result.searchMeta);
      res.set('X-Search-Engine', engine);
      res.set('X-Search-Time', `${elapsed}ms`);
      res.set('X-Search-Provider', provider);

      return res.json({
        success: true,
        users: result.results,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        pagination: result.pagination,
        searchMeta: result.searchMeta
      });
    }

    // No search — return all users as before
    const [players, managers, organizers] = await Promise.all([
      adminController.getAllUsersByRole('player'),
      adminController.getAllUsersByRole('manager'),
      adminController.getAllUsersByRole('organizer')
    ]);
    const allUsers = [...players, ...managers, ...organizers]
      .filter((user) => !role || role === 'all' || user.role === role);
    const start = (page - 1) * limit;
    const pagedUsers = allUsers.slice(start, start + limit);
    const totalPages = Math.max(1, Math.ceil(allUsers.length / limit));
    const elapsed = Date.now() - startTime;
    res.set('X-Search-Engine', 'none');
    res.set('X-Search-Time', `${elapsed}ms`);

    return res.json({
      success: true,
      total: allUsers.length,
      page,
      limit,
      totalPages,
      pagination: {
        page,
        limit,
        total: allUsers.length,
        totalPages
      },
      breakdown: {
        players: players.length,
        managers: managers.length,
        organizers: organizers.length
      },
      users: pagedUsers
    });
  } catch (err) {
    console.error('Error fetching all users:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch users', error: err.message });
  }
});

// Get all teams - JSON API
router.get('/teams', async (req, res) => {
  const startTime = Date.now();
  try {
    const q = req.query.q || req.query.search || '';
    const sportType = req.query.sportType;
    const page = toPositiveInt(req.query.page, 1);
    const limit = toPositiveInt(req.query.limit, 20);

    if (q.trim()) {
      const { searchTeams } = require('../services/searchService');
      const result = await searchTeams({ search: q, sportType, page, limit });
      const elapsed = Date.now() - startTime;
      const { engine, provider } = getSearchHeaderValues(result.searchMeta);
      res.set('X-Search-Engine', engine);
      res.set('X-Search-Time', `${elapsed}ms`);
      res.set('X-Search-Provider', provider);
      const formatted = (result.results || []).map(t => ({ ...t, id: (t._id || t.id || '').toString() }));
      return res.json({
        success: true,
        count: formatted.length,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        pagination: result.pagination,
        teams: formatted,
        searchMeta: result.searchMeta
      });
    }

    const teams = await Team.getAllTeams();
    const filteredTeams = teams.filter((team) => !sportType || String(team.sport_type || '').toLowerCase() === String(sportType).toLowerCase());
    const start = (page - 1) * limit;
    const pagedTeams = filteredTeams.slice(start, start + limit);
    const formattedTeams = pagedTeams.map(team => ({ ...team, id: team._id.toString() }));
    const totalPages = Math.max(1, Math.ceil(filteredTeams.length / limit));
    const elapsed = Date.now() - startTime;
    res.set('X-Search-Engine', 'none');
    res.set('X-Search-Time', `${elapsed}ms`);
    return res.json({
      success: true,
      count: formattedTeams.length,
      total: filteredTeams.length,
      page,
      limit,
      totalPages,
      pagination: {
        page,
        limit,
        total: filteredTeams.length,
        totalPages
      },
      teams: formattedTeams || []
    });
  } catch (err) {
    console.error('Error fetching teams:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch teams', error: err.message });
  }
});

// Get all events - JSON API
router.get('/events', async (req, res) => {
  const startTime = Date.now();
  try {
    const q = req.query.q || req.query.search || '';
    const status = req.query.status;
    const statuses = typeof req.query.statuses === 'string'
      ? req.query.statuses.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    if (status && status !== 'all') statuses.push(status);
    const page = toPositiveInt(req.query.page, 1);
    const limit = toPositiveInt(req.query.limit, 20);

    if (q.trim()) {
      const { searchEvents } = require('../services/searchService');
      const result = await searchEvents({ search: q, page, limit, statuses: [...new Set(statuses)] });
      const elapsed = Date.now() - startTime;
      const { engine, provider } = getSearchHeaderValues(result.searchMeta);
      res.set('X-Search-Engine', engine);
      res.set('X-Search-Time', `${elapsed}ms`);
      res.set('X-Search-Provider', provider);
      const formatted = (result.results || []).map(e => ({ ...e, id: (e._id || e.id || '').toString() }));
      return res.json({
        success: true,
        count: formatted.length,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
        pagination: result.pagination,
        events: formatted,
        searchMeta: result.searchMeta
      });
    }

    const events = await Event.getAllEvents();
    const filteredEvents = statuses.length > 0
      ? events.filter((event) => statuses.includes(event.status))
      : events;
    const start = (page - 1) * limit;
    const pagedEvents = filteredEvents.slice(start, start + limit);
    const formattedEvents = pagedEvents.map(event => ({ ...event, id: event._id.toString() }));
    const totalPages = Math.max(1, Math.ceil(filteredEvents.length / limit));
    const elapsed = Date.now() - startTime;
    res.set('X-Search-Engine', 'none');
    res.set('X-Search-Time', `${elapsed}ms`);
    return res.json({
      success: true,
      count: formattedEvents.length,
      total: filteredEvents.length,
      page,
      limit,
      totalPages,
      pagination: {
        page,
        limit,
        total: filteredEvents.length,
        totalPages
      },
      events: formattedEvents || []
    });
  } catch (err) {
    console.error('Error fetching events:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch events', error: err.message });
  }
});

// Get all matches - JSON API
router.get('/matches', async (req, res) => {
  try {
    console.log('API: Fetching all matches');
    // Import Match model
    const Match = require('../models/match');
    const MatchSchema = require('../models/schemas/matchSchema');

    // Get all matches with populated team and event data
    const matches = await MatchSchema.find({})
      .populate('event_id', 'name sport')
      .populate('team_a', 'name')
      .populate('team_b', 'name')
      .sort({ match_date: -1 })
      .lean();

    // Format matches for frontend
    const formattedMatches = matches.map(match => ({
      id: match._id,
      team1_name: match.team_a?.name || 'TBD',
      team2_name: match.team_b?.name || 'TBD',
      team1_score: match.team_a_score,
      team2_score: match.team_b_score,
      event_name: match.event_id?.name || 'N/A',
      match_date: match.match_date,
      status: match.status || 'scheduled'
    }));

    return res.json({
      success: true,
      count: formattedMatches.length,
      matches: formattedMatches
    });
  } catch (err) {
    console.error('Error fetching matches:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch matches',
      error: err.message
    });
  }
});

// System stats
router.get('/stats', async (req, res) => {
  try {
    // Get stats from admin controller
    const stats = await adminController.getDashboardStats();

    return res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('Error generating stats:', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate statistics',
      error: err.message
    });
  }
});

// JSON stats API for React AdminStats page
router.get('/api/stats', async (req, res) => {
  try {
    const SubscriptionSchema = require('../models/schemas/subscriptionSchema');
    const UserSchema = require('../models/schemas/userSchema');
    const EventSchema = require('../models/schemas/eventSchema');
    const TeamSchema = require('../models/schemas/teamSchema');

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

    const [userAgg, teamCount, eventCount, upcomingCount, pastCount,
      activeSubs, expiringSubs, pendingOrgs, coordinators] = await Promise.all([
        UserSchema.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ]),
        TeamSchema.countDocuments(),
        EventSchema.countDocuments(),
        EventSchema.countDocuments({ event_date: { $gt: now } }),
        EventSchema.countDocuments({ event_date: { $lte: now } }),
        SubscriptionSchema.countDocuments({ status: 'active', endDate: { $gte: now } }),
        SubscriptionSchema.countDocuments({ status: 'active', endDate: { $gte: now, $lte: sevenDaysLater } }),
        UserSchema.countDocuments({
          role: 'organizer', $or: [
            { verification_status: 'pending' }, { verification_status: { $exists: false } }
          ]
        }),
        UserSchema.countDocuments({ role: 'coordinator' })
      ]);

    const userCounts = { total: 0, players: 0, managers: 0, organizers: 0, coordinators: 0 };
    userAgg.forEach(r => {
      userCounts.total += r.count;
      if (r._id === 'player') userCounts.players = r.count;
      else if (r._id === 'manager') userCounts.managers = r.count;
      else if (r._id === 'organizer') userCounts.organizers = r.count;
      else if (r._id === 'coordinator') userCounts.coordinators = r.count;
    });

    return res.json({
      success: true,
      data: {
        users: userCounts,
        teams: { total: teamCount },
        events: { total: eventCount, upcoming: upcomingCount, past: pastCount },
        subscriptions: { active: activeSubs, expiringIn7Days: expiringSubs },
        verification: { pendingOrganizers: pendingOrgs },
        coordinator: { actionsToday: 0, total: coordinators }
      }
    });
  } catch (err) {
    console.error('Error fetching JSON stats:', err);
    return res.status(500).json({ success: false, message: 'Failed to load stats', error: err.message });
  }
});



// Teams
router.get('/teams', async (req, res) => {
  try {
    // Get all teams
    const teams = await Team.getAllTeams();

    res.render('admin/teams', {
      title: 'Team Management',
      layout: 'layouts/dashboard',
      user: req.session.user,
      teams: teams || [],
      path: '/admin/teams'
    });
  } catch (error) {
    console.error('Error in teams route:', error);
    res.status(500).send('An error occurred while fetching team data');
  }
});

// Tournaments/Events
router.get('/tournaments', async (req, res) => {
  try {
    // Get all events/tournaments
    const events = await Event.getAllEvents();

    // Format dates for display
    const formattedEvents = events.map(event => ({
      ...event,
      eventDate: event.event_date ?
        new Date(event.event_date).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) : 'TBD'
    }));

    res.render('admin/tournaments', {
      title: 'Event Management',
      layout: 'layouts/dashboard',
      user: req.session.user,
      events: formattedEvents,
      path: '/admin/tournaments'
    });
  } catch (error) {
    console.error('Error in tournaments route:', error);
    res.status(500).send('An error occurred while fetching event data');
  }
});

// Activity Logs - JSON API for React frontend
router.get('/activity-logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    console.log(`API: Fetching ${limit} recent activities`);

    // Get recent activities
    const activities = await adminController.getRecentActivities(limit);

    return res.json({
      success: true,
      count: activities.length,
      activities: activities
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch activity logs',
      error: error.message
    });
  }
});

// Transactions
router.get('/transactions', async (req, res) => {
  try {
    // Import Order model
    const Order = require('../models/order');

    // Get query parameters for filtering and pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status || '';
    const dateFrom = req.query.dateFrom || '';
    const dateTo = req.query.dateTo || '';

    // Build filters
    const filters = {};
    if (status) filters.status = status;
    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    // Get orders
    const result = await Order.getAllOrders(filters, page, limit);

    if (!result.success) {
      throw new Error(result.error);
    }

    const { orders, pagination } = result.data;

    res.render('admin/transactions', {
      title: 'Transactions',
      layout: 'layouts/dashboard',
      user: req.session.user,
      orders: orders,
      pagination: pagination,
      filters: { status, dateFrom, dateTo },
      path: '/admin/transactions'
    });
  } catch (error) {
    console.error('Error in transactions route:', error);
    res.status(500).send('An error occurred while fetching transactions');
  }
});

// API Routes for AJAX calls
// Get single order details
router.get('/api/orders/:id', async (req, res) => {
  try {
    const Order = require('../models/order');
    const OrderSchema = require('../models/schemas/orderSchema');

    // For admin, get order directly without userId restriction
    const order = await OrderSchema.findById(req.params.id)
      .populate('orderItems.itemId')
      .populate('userId', 'first_name last_name email');

    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, order: order });
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch order details' });
  }
});

// Update order status
router.put('/api/orders/:id/status', async (req, res) => {
  try {
    const Order = require('../models/order');
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const result = await Order.updateOrderStatus(req.params.id, status);

    if (!result.success) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    res.json({ success: true, order: result.data });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ success: false, error: 'Failed to update order status' });
  }
});

// Export transactions
router.get('/api/transactions/export', async (req, res) => {
  try {
    const Order = require('../models/order');

    // Get all orders for export
    const result = await Order.getAllOrders({}, 1, 1000); // Get up to 1000 orders

    if (!result.success) {
      throw new Error(result.error);
    }

    const orders = result.data.orders;

    // Create CSV content
    let csvContent = 'Order Number,Customer Name,Customer Email,Items,Total Amount,Payment Method,Status,Order Date\n';

    orders.forEach(order => {
      const customerName = order.customerInfo ? order.customerInfo.fullName : (order.userId ? `${order.userId.first_name} ${order.userId.last_name}` : 'Unknown');
      const customerEmail = order.userId ? order.userId.email : (order.customerInfo ? order.customerInfo.phone : '');
      const itemsText = order.orderItems ? order.orderItems.map(item => `${item.name} (${item.quantity})`).join('; ') : '';

      csvContent += `"${order.orderNumber}","${customerName}","${customerEmail}","${itemsText}","${order.totalAmount}","${order.paymentMethod}","${order.status}","${new Date(order.orderDate).toLocaleDateString()}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions-export.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting transactions:', error);
    res.status(500).json({ success: false, error: 'Failed to export transactions' });
  }
});

// Users management routes
// Organizers
router.get('/organizers', async (req, res) => {
  try {
    // Get real organizers from admin controller
    let organizers = [];

    try {
      organizers = await adminController.getAllUsersByRole('organizer');
      console.log(`Retrieved ${organizers.length} organizers from database`);
    } catch (err) {
      console.error('Error fetching organizers:', err);
      organizers = [];
    }

    // If no organizers found in database, use empty array
    if (!organizers || organizers.length === 0) {
      console.log('No organizers found in database');
    }

    // Format dates for display
    const formattedOrganizers = organizers.map(organizer => ({
      ...organizer,
      // Format joinedDate as DD Month YYYY
      joinedDate: organizer.joinedDate ?
        new Date(organizer.joinedDate).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) : 'Unknown'
    }));

    // Render the view
    res.render('admin/organizers', {
      title: 'Organizer Management',
      layout: 'layouts/dashboard',
      user: req.session.user || { role: 'admin', email: 'admin@example.com' },
      organizers: formattedOrganizers,
      path: '/admin/organizers'
    });
  } catch (error) {
    console.error('Error in organizers route:', error);
    res.status(500).send('An error occurred while fetching organizer data');
  }
});

// Managers
router.get('/managers', async (req, res) => {
  try {
    // Get real managers from admin controller
    let managers = [];

    try {
      managers = await adminController.getAllUsersByRole('manager');
      console.log(`Retrieved ${managers.length} managers from database`);
    } catch (err) {
      console.error('Error fetching managers:', err);
      managers = [];
    }

    // If no managers found in database, use empty array
    if (!managers || managers.length === 0) {
      console.log('No managers found in database');
    }

    // Format dates for display
    const formattedManagers = managers.map(manager => ({
      ...manager,
      // Format joinedDate as DD Month YYYY
      joinedDate: manager.joinedDate ?
        new Date(manager.joinedDate).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) : 'Unknown'
    }));

    // Render the view
    res.render('admin/managers', {
      title: 'Manager Management',
      layout: 'layouts/dashboard',
      user: req.session.user || { role: 'admin', email: 'admin@example.com' },
      managers: formattedManagers,
      path: '/admin/managers'
    });
  } catch (error) {
    console.error('Error in managers route:', error);
    res.status(500).send('An error occurred while fetching manager data');
  }
});

// Players
router.get('/players', async (req, res) => {
  try {
    // Get real players from admin controller
    let players = [];

    try {
      players = await adminController.getAllUsersByRole('player');
      console.log(`Retrieved ${players.length} players from database`);
    } catch (err) {
      console.error('Error fetching players:', err);
      players = [];
    }

    // If no players found in database, use empty array
    if (!players || players.length === 0) {
      console.log('No players found in database');
    }

    // Format dates for display
    const formattedPlayers = players.map(player => ({
      ...player,
      // Format joinedDate as DD Month YYYY
      joinedDate: player.joinedDate ?
        new Date(player.joinedDate).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }) : 'Unknown'
    }));

    // Render the view
    res.render('admin/players', {
      title: 'Player Management',
      layout: 'layouts/dashboard',
      user: req.session.user || { role: 'admin', email: 'admin@example.com' },
      players: formattedPlayers,
      path: '/admin/players'
    });
  } catch (error) {
    console.error('Error in players route:', error);
    res.status(500).send('An error occurred while fetching player data');
  }
});

// API endpoints for user details
router.get('/api/players/:id', async (req, res) => {
  try {
    const playerId = req.params.id;

    // Get player data from admin controller
    try {
      const playerDetails = await adminController.getUserDetailsById(playerId);
      return res.json({ success: true, data: playerDetails });
    } catch (err) {
      console.error('Error getting player details:', err);
      return res.status(404).json({ success: false, message: 'Player not found' });
    }
  } catch (error) {
    console.error('Error in player details API:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/api/managers/:id', async (req, res) => {
  try {
    const managerId = req.params.id;

    // Get manager data from admin controller
    try {
      const managerDetails = await adminController.getUserDetailsById(managerId);
      return res.json({ success: true, data: managerDetails });
    } catch (err) {
      console.error('Error getting manager details:', err);
      return res.status(404).json({ success: false, message: 'Manager not found' });
    }
  } catch (error) {
    console.error('Error in manager details API:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/api/organizers/:id', async (req, res) => {
  try {
    const organizerId = req.params.id;

    // Get organizer data from admin controller
    try {
      const organizerDetails = await adminController.getUserDetailsById(organizerId);
      return res.json({ success: true, data: organizerDetails });
    } catch (err) {
      console.error('Error getting organizer details:', err);
      return res.status(404).json({ success: false, message: 'Organizer not found' });
    }
  } catch (error) {
    console.error('Error in organizer details API:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API endpoint for team details
router.get('/api/teams/:id', async (req, res) => {
  try {
    const teamId = req.params.id;
    console.log(`Fetching team details for ID: ${teamId}`);

    // Get team data using Team model (already returns fully formatted data)
    const team = await Team.getTeamById(teamId);

    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    // Team.getTeamById already returns formatted data with id, manager, members
    // Just need to add a few extra fields for the ViewModal
    const teamDetails = {
      ...team,
      manager_name: team.manager?.name || 'Unknown Manager',
      manager_id: team.manager?.id,
      current_members: team.members ? team.members.length : 0,
      status: team.status || 'Active'
    };

    return res.json({ success: true, data: teamDetails });
  } catch (error) {
    console.error('Error in team details API:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API endpoint for event details
router.get('/api/events/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    console.log(`Fetching event details for ID: ${eventId}`);

    // Get event data using Event model
    const event = await Event.getEventById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Format event details for ViewModal
    const eventDetails = {
      id: event._id?.toString() || event.id,
      title: event.title || event.name,
      name: event.name || event.title,
      sport_type: event.sport_type,
      event_date: event.event_date,
      location: event.location,
      organizer_id: event.organizer_id,
      organizer_name: event.organizer_first_name && event.organizer_last_name
        ? `${event.organizer_first_name} ${event.organizer_last_name}`.trim()
        : 'Unknown Organizer',
      description: event.description,
      status: event.status,
      max_teams: event.max_teams,
      registered_teams: event.team_registrations ? event.team_registrations.length : 0,
      team_registrations: (event.team_registrations || []).map(reg => ({
        team_name: reg.team_name || 'Unknown Team',
        team_id: reg.team_id,
        registration_date: reg.registered_at || reg.registration_date,
        status: reg.status
      })),
      registration_start: event.registration_start,
      registration_end: event.registration_end || event.registration_deadline,
      entry_fee: event.entry_fee,
      prize_pool: event.prize_pool,
      rules: event.rules,
      created_at: event.created_at
    };

    return res.json({ success: true, data: eventDetails });
  } catch (error) {
    console.error('Error in event details API:', error);
    res.status(500).json({ success: false, message: 'Server error', errorDetails: error.message });
  }
});

// Delete routes for users
router.delete('/users/manager/:id', async (req, res) => {
  const managerId = req.params.id;

  console.log(`Attempting to delete manager with ID: ${managerId}`);

  try {
    // Check if manager exists first
    const managerExists = await mongoose.model('User').findById(managerId);
    if (!managerExists) {
      console.error(`Manager with ID ${managerId} not found in database`);
      return res.status(404).json({ success: false, message: 'Manager not found or already deleted' });
    }

    if (managerExists.role !== 'manager') {
      console.error(`User ${managerId} exists but is not a manager (role: ${managerExists.role})`);
      return res.status(400).json({ success: false, message: 'User exists but is not a manager' });
    }

    console.log(`Manager found in database: ${managerExists.first_name} ${managerExists.last_name} (${managerExists.email})`);

    // Use the User model to delete the manager
    const result = await User.deleteUser(managerId);

    if (!result) {
      console.error(`Delete operation returned falsy result for manager ${managerId}`);
      return res.status(404).json({ success: false, message: 'Manager not found or already deleted' });
    }

    console.log(`Manager ${managerId} deleted successfully`);

    // Successfully deleted
    return res.json({ success: true, message: 'Manager deleted successfully' });
  } catch (error) {
    console.error(`Error in delete manager route for ID ${managerId}:`, error);
    return res.status(500).json({ success: false, message: 'Server error occurred' });
  }
});

router.delete('/users/organizer/:id', async (req, res) => {
  const organizerId = req.params.id;

  console.log(`Attempting to delete organizer with ID: ${organizerId}`);

  try {
    // Check if organizer exists first
    const organizerExists = await mongoose.model('User').findById(organizerId);
    if (!organizerExists) {
      console.error(`Organizer with ID ${organizerId} not found in database`);
      return res.status(404).json({ success: false, message: 'Organizer not found or already deleted' });
    }

    if (organizerExists.role !== 'organizer') {
      console.error(`User ${organizerId} exists but is not an organizer (role: ${organizerExists.role})`);
      return res.status(400).json({ success: false, message: 'User exists but is not an organizer' });
    }

    console.log(`Organizer found in database: ${organizerExists.first_name} ${organizerExists.last_name} (${organizerExists.email})`);

    // Use the User model to delete the organizer
    const result = await User.deleteUser(organizerId);

    if (!result) {
      console.error(`Delete operation returned falsy result for organizer ${organizerId}`);
      return res.status(404).json({ success: false, message: 'Organizer not found or already deleted' });
    }

    console.log(`Organizer ${organizerId} deleted successfully`);

    // Successfully deleted
    return res.json({ success: true, message: 'Organizer deleted successfully' });
  } catch (error) {
    console.error(`Error in delete organizer route for ID ${organizerId}:`, error);
    return res.status(500).json({ success: false, message: 'Server error occurred' });
  }
});

// Delete player
router.delete('/users/player/:id', async (req, res) => {
  const playerId = req.params.id;

  console.log(`Attempting to delete player with ID: ${playerId}`);

  try {
    // Check if player exists first
    const playerExists = await mongoose.model('User').findById(playerId);
    if (!playerExists) {
      console.error(`Player with ID ${playerId} not found in database`);
      return res.status(404).json({ success: false, message: 'Player not found or already deleted' });
    }

    if (playerExists.role !== 'player') {
      console.error(`User ${playerId} exists but is not a player (role: ${playerExists.role})`);
      return res.status(400).json({ success: false, message: 'User exists but is not a player' });
    }

    console.log(`Player found in database: ${playerExists.first_name} ${playerExists.last_name} (${playerExists.email})`);

    // Use the User model to delete the player
    const result = await User.deleteUser(playerId);

    if (!result) {
      console.error(`Delete operation returned falsy result for player ${playerId}`);
      return res.status(404).json({ success: false, message: 'Player not found or already deleted' });
    }

    console.log(`Player ${playerId} deleted successfully`);

    // Successfully deleted
    return res.json({ success: true, message: 'Player deleted successfully' });
  } catch (error) {
    console.error(`Error in delete player route for ID ${playerId}:`, error);
    return res.status(500).json({ success: false, message: 'Server error occurred' });
  }
});

// Add routes for team and event deletion
router.delete('/teams/:id', async (req, res) => {
  const teamId = req.params.id;

  console.log(`Attempting to delete team with ID: ${teamId}`);

  try {
    // Check if team exists first
    const teamExists = await mongoose.model('Team').findById(teamId);
    if (!teamExists) {
      console.error(`Team with ID ${teamId} not found in database`);
      return res.status(404).json({ success: false, message: 'Team not found or already deleted' });
    }

    console.log(`Team found in database: ${teamExists.name} (${teamExists.sport_type})`);

    // Use the Team model to delete the team
    const result = await Team.deleteTeam(teamId);

    if (!result) {
      console.error(`Delete operation returned falsy result for team ${teamId}`);
      return res.status(404).json({ success: false, message: 'Team not found or already deleted' });
    }

    console.log(`Team ${teamId} deleted successfully`);

    // Successfully deleted
    return res.json({ success: true, message: 'Team deleted successfully' });
  } catch (error) {
    console.error(`Error in delete team route for ID ${teamId}:`, error);
    return res.status(500).json({ success: false, message: 'Server error occurred' });
  }
});

router.delete('/events/:id', async (req, res) => {
  const eventId = req.params.id;

  console.log(`Attempting to delete event with ID: ${eventId}`);

  try {
    // Check if event exists first
    const eventExists = await mongoose.model('Event').findById(eventId);
    if (!eventExists) {
      console.error(`Event with ID ${eventId} not found in database`);
      return res.status(404).json({ success: false, message: 'Event not found or already deleted' });
    }

    console.log(`Event found in database: ${eventExists.title || eventExists.name || 'Unnamed Event'}`);

    // Use the Event model to delete the event
    const result = await Event.deleteEvent(eventId);

    if (!result) {
      console.error(`Delete operation returned falsy result for event ${eventId}`);
      return res.status(404).json({ success: false, message: 'Event not found or already deleted' });
    }

    console.log(`Event ${eventId} deleted successfully`);

    // Successfully deleted
    return res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error(`Error in delete event route for ID ${eventId}:`, error);
    return res.status(500).json({ success: false, message: 'Server error occurred' });
  }
});

// REMOVED: Direct login bypass routes for security
// Admin users must login through the proper authentication flow


// ============================================================
// NEW ROUTES — Admin Dashboard Expansion (Phase 1-5)
// ============================================================

// Generic user detail by ID (works for all roles)
router.get('/api/users/:id', async (req, res) => {
  try {
    const userDetails = await adminController.getUserDetailsById(req.params.id);
    return res.json({ success: true, data: userDetails });
  } catch (err) {
    console.error('Error getting user details:', err);
    return res.status(404).json({ success: false, message: err.message || 'User not found' });
  }
});

// Generic user delete by ID (any role)
router.delete('/users/any/:id', async (req, res) => {
  try {
    const UserSchemaModel = require('../models/schemas/userSchema');
    const userExists = await UserSchemaModel.findById(req.params.id);
    if (!userExists) return res.status(404).json({ success: false, message: 'User not found' });
    await User.deleteUser(req.params.id);
    return res.json({ success: true, message: userExists.role + ' deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Coordinator detail by ID
router.get('/api/coordinators/:id', async (req, res) => {
  try {
    const details = await adminController.getUserDetailsById(req.params.id);
    return res.json({ success: true, data: details });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message || 'Coordinator not found' });
  }
});

// Delete coordinator
router.delete('/users/coordinator/:id', async (req, res) => {
  try {
    const UserSchemaModel = require('../models/schemas/userSchema');
    const user = await UserSchemaModel.findById(req.params.id);
    if (!user || (user.role !== 'coordinator' && user.role !== 'moderator'))
      return res.status(404).json({ success: false, message: 'Coordinator not found' });
    await User.deleteUser(req.params.id);
    return res.json({ success: true, message: 'Coordinator deleted successfully' });
  } catch (err) {
    console.error('Error deleting coordinator:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Match detail by ID
router.get('/api/matches/:id', async (req, res) => {
  try {
    const matchDetails = await adminController.getMatchDetailsById(req.params.id);
    return res.json({ success: true, data: matchDetails });
  } catch (err) {
    console.error('Error getting match details:', err);
    return res.status(404).json({ success: false, message: err.message || 'Match not found' });
  }
});

// Delete match
router.delete('/matches/:id', async (req, res) => {
  try {
    const MatchSchemaModel = require('../models/schemas/matchSchema');
    const match = await MatchSchemaModel.findById(req.params.id);
    if (!match) return res.status(404).json({ success: false, message: 'Match not found' });
    await MatchSchemaModel.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Match deleted successfully' });
  } catch (err) {
    console.error('Error deleting match:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DB Optimization observability — indexes + Redis benchmark
router.get('/observability/db-optimization', async (req, res) => {
  try {
    const UserSchemaModel = require('../models/schemas/userSchema');
    const TeamSchemaModel = require('../models/schemas/teamSchema');
    const EventSchemaModel = require('../models/schemas/eventSchema');
    const MatchSchemaModel = require('../models/schemas/matchSchema');
    const SubscriptionSchemaModel = require('../models/schemas/subscriptionSchema');

    const [userIndexes, teamIndexes, eventIndexes, matchIndexes, subIndexes] = await Promise.all([
      UserSchemaModel.collection.indexes(),
      TeamSchemaModel.collection.indexes(),
      EventSchemaModel.collection.indexes(),
      MatchSchemaModel.collection.indexes(),
      SubscriptionSchemaModel.collection.indexes()
    ]);

    let redisBench = { status: 'unavailable' };
    try {
      const { redis } = require('../config/redis');
      const testKey = 'admin:db-opt-bench';
      await redis.set(testKey, JSON.stringify({ bench: true }), { ex: 60 });
      const hitStart = Date.now(); await redis.get(testKey); const redisHitMs = Date.now() - hitStart;
      const missStart = Date.now(); await redis.get('miss-' + Date.now()); const redisMissMs = Date.now() - missStart;
      redisBench = { status: 'active', hitLatencyMs: redisHitMs, missLatencyMs: redisMissMs, deltaMs: redisMissMs - redisHitMs };
    } catch (e) { /* Redis optional */ }

    return res.json({
      success: true,
      data: {
        indexes: {
          users: userIndexes.map(i => ({ name: i.name, fields: i.key })),
          teams: teamIndexes.map(i => ({ name: i.name, fields: i.key })),
          events: eventIndexes.map(i => ({ name: i.name, fields: i.key })),
          matches: matchIndexes.map(i => ({ name: i.name, fields: i.key })),
          subscriptions: subIndexes.map(i => ({ name: i.name, fields: i.key }))
        },
        redis: redisBench
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch DB optimization info', error: err.message });
  }
});

// API stats for Swagger
router.get('/observability/api-stats', async (req, res) => {
  try {
    const swaggerSpec = require('../config/swagger');
    const paths = swaggerSpec.paths || {};
    const pathKeys = Object.keys(paths);
    const tagCounts = {};
    pathKeys.forEach(p => { Object.values(paths[p]).forEach(op => { (op.tags || []).forEach(tag => { tagCounts[tag] = (tagCounts[tag] || 0) + 1; }); }); });
    const b2bEndpoints = Object.entries(tagCounts).filter(([t]) => t.startsWith('B2B')).map(([t, c]) => ({ tag: t, count: c }));
    const b2cEndpoints = Object.entries(tagCounts).filter(([t]) => t.startsWith('B2C')).map(([t, c]) => ({ tag: t, count: c }));
    return res.json({ success: true, data: { totalEndpoints: pathKeys.length, tagBreakdown: tagCounts, b2bEndpoints, b2cEndpoints, swaggerUrl: '/api-docs', openApiVersion: swaggerSpec.openapi || '3.0.0' } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch API stats', error: err.message });
  }
});

// Test results
router.get('/observability/test-results', async (req, res) => {
  try {
    const { execSync } = require('child_process');
    const pathMod = require('path');
    const backendDir = pathMod.join(__dirname, '..');
    let results = { status: 'unknown', passed: 0, failed: 0, total: 0, testFiles: [], lastRun: new Date().toISOString() };
    try {
      const raw = execSync('npx jest --json --passWithNoTests 2>&1', { cwd: backendDir, timeout: 60000, encoding: 'utf8' });
      const jsonStart = raw.indexOf('{');
      if (jsonStart !== -1) {
        const json = JSON.parse(raw.slice(jsonStart));
        results = {
          status: json.success ? 'passed' : 'failed',
          passed: json.numPassedTests || 0, failed: json.numFailedTests || 0, total: json.numTotalTests || 0,
          testFiles: (json.testResults || []).map(t => ({ file: pathMod.basename(t.testFilePath), passed: t.numPassingTests, failed: t.numFailingTests, status: t.status })),
          lastRun: new Date().toISOString()
        };
      }
    } catch (e) { results.status = 'error'; results.error = String(e.message || '').slice(0, 500); }
    return res.json({ success: true, data: results });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to run tests', error: err.message });
  }
});

// Deployment info
router.get('/observability/deployment', async (req, res) => {
  try {
    return res.json({
      success: true,
      data: {
        environment: process.env.NODE_ENV || 'development',
        frontend: { url: process.env.FRONTEND_URL || 'https://sports-amigo.vercel.app', platform: 'Vercel' },
        backend: { url: process.env.BACKEND_URL || 'https://sportsamigo.onrender.com', platform: 'Render' },
        commitId: process.env.COMMIT_SHA || process.env.RENDER_GIT_COMMIT || 'N/A',
        branch: process.env.RENDER_GIT_BRANCH || 'main',
        lastChecked: new Date().toISOString()
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch deployment info', error: err.message });
  }
});


// ─── Academic Requirements Proof Endpoint ─────────────────────────────────────
router.get('/academic-proof', async (req, res) => {
  try {
    const path = require('path');
    const fs = require('fs');
    const mongoose = require('mongoose');

    // ── 1. DB Indexes ──────────────────────────────────────────────────────────
    let indexStats = [];
    try {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      for (const col of collections) {
        const indexes = await db.collection(col.name).indexes();
        indexStats.push({ collection: col.name, indexCount: indexes.length, indexes: indexes.map(i => i.name) });
      }
    } catch (e) { indexStats = []; }

    // ── 2. Redis Status ────────────────────────────────────────────────────────
    let redisStatus = { connected: false, hitRate: null, hitsTotal: 0, missesTotal: 0, note: '' };
    try {
      const redisService = require('../services/redisService');
      if (redisService && typeof redisService.getStats === 'function') {
        const stats = await redisService.getStats();
        redisStatus = { connected: true, ...stats };
      } else if (process.env.UPSTASH_REDIS_REST_URL) {
        redisStatus = { connected: true, note: 'Upstash Redis configured (REST mode)' };
      } else {
        redisStatus = { connected: false, note: 'UPSTASH_REDIS_REST_URL not set (dev mode)' };
      }
    } catch (e) { redisStatus.note = e.message; }

    // ── 3. Swagger/API Docs ────────────────────────────────────────────────────
    let swaggerInfo = { available: false, endpointCount: 0, b2bEndpoints: 0, b2cEndpoints: 0 };
    try {
      const swaggerSpec = require('../config/swagger');
      const paths = swaggerSpec.paths || {};
      const pathKeys = Object.keys(paths);
      let b2b = 0, b2c = 0;
      pathKeys.forEach(p => {
        const methods = paths[p];
        Object.values(methods).forEach(op => {
          const tags = (op.tags || []).map(t => t.toLowerCase());
          if (tags.some(t => t.includes('b2b') || t.includes('business'))) b2b++;
          else b2c++;
        });
      });
      swaggerInfo = { available: true, url: '/api-docs', endpointCount: pathKeys.length, b2bEndpoints: b2b, b2cEndpoints: b2c, version: swaggerSpec.info?.version || '1.0.0', title: swaggerSpec.info?.title || 'SportsAmigo API' };
    } catch (e) { swaggerInfo.note = e.message; }

    // ── 4. Unit Tests ──────────────────────────────────────────────────────────
    const testFiles = [];
    const testDirs = [path.join(__dirname, '../__tests__'), path.join(__dirname, '../../frontend/src/__tests__')];
    testDirs.forEach(dir => {
      try {
        if (fs.existsSync(dir)) {
          fs.readdirSync(dir).filter(f => f.endsWith('.test.js')).forEach(f => {
            const content = fs.readFileSync(path.join(dir, f), 'utf8');
            const describeMatches = [...content.matchAll(/describe\s*\(/g)];
            const testMatches = [...content.matchAll(/\b(test|it)\s*\(/g)];
            testFiles.push({ file: f, describes: describeMatches.length, tests: testMatches.length, location: dir.includes('frontend') ? 'frontend' : 'backend' });
          });
        }
      } catch (e) { }
    });

    // ── 5. Docker ──────────────────────────────────────────────────────────────
    const dockerFiles = [path.join(__dirname, '../../backend/Dockerfile'), path.join(__dirname, '../../frontend/Dockerfile'), path.join(__dirname, '../../docker-compose.yml'), path.join(__dirname, '../../docker-compose.yaml')];
    const dockerInfo = dockerFiles.map(f => ({ file: path.basename(f), exists: fs.existsSync(f), path: f.split('SportsAmigo\\')[1] || path.basename(f) })).filter(f => f.exists);

    // ── 6. CI/CD ──────────────────────────────────────────────────────────────
    let ciInfo = { configured: false, workflows: [] };
    const ciDir = path.join(__dirname, '../../.github/workflows');
    try {
      if (fs.existsSync(ciDir)) {
        const workflows = fs.readdirSync(ciDir).filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
        ciInfo = {
          configured: true, platform: 'GitHub Actions', workflows: workflows.map(w => {
            const content = fs.readFileSync(path.join(ciDir, w), 'utf8');
            const onMatch = content.match(/^on:\s*\n([\s\S]*?)(?=\n\w)/m);
            return { name: w, triggers: (content.match(/branches:\s*\[([^\]]+)\]/)?.[1] || 'main') };
          })
        };
      }
    } catch (e) { }

    // ── 7. Deployment ─────────────────────────────────────────────────────────
    const deployment = {
      frontend: { platform: 'Vercel', url: process.env.FRONTEND_URL || 'https://sports-amigo.vercel.app', live: true },
      backend: { platform: 'Render', url: process.env.BACKEND_URL || 'https://sportsamigo.onrender.com', live: true },
      environment: process.env.NODE_ENV || 'development'
    };

    return res.json({
      success: true,
      data: {
        dbOptimization: { indexes: indexStats, totalCollections: indexStats.length, totalIndexes: indexStats.reduce((s, c) => s + c.indexCount, 0) },
        redis: redisStatus,
        swagger: swaggerInfo,
        testing: { files: testFiles, totalTests: testFiles.reduce((s, f) => s + f.tests, 0), totalDescribes: testFiles.reduce((s, f) => s + f.describes, 0), runner: 'Jest + Supertest' },
        docker: { files: dockerInfo, containerized: dockerInfo.length >= 2 },
        ci: ciInfo,
        deployment,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Academic proof error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load academic proof', error: err.message });
  }
});

// ─── Entity Detail Endpoints (AdminEntityModal Deep-Linking) ─────────────────


// User / Player / Manager / Organizer / Coordinator detail by ID
router.get('/api/users/:id', async (req, res) => {
  try {
    const data = await adminController.getUserDetailsById(req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message || 'User not found' });
  }
});

// Role-specific aliases — all delegate to getUserDetailsById
['players', 'managers', 'organizers', 'coordinators'].forEach(role => {
  router.get(`/api/${role}/:id`, async (req, res) => {
    try {
      const data = await adminController.getUserDetailsById(req.params.id);
      return res.json({ success: true, data });
    } catch (err) {
      return res.status(404).json({ success: false, message: err.message || 'User not found' });
    }
  });
});

// Team detail by ID
router.get('/api/teams/:id', async (req, res) => {
  try {
    const data = await adminController.getTeamDetailsById(req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message || 'Team not found' });
  }
});

// Event detail by ID
router.get('/api/events/:id', async (req, res) => {
  try {
    const data = await adminController.getEventDetailsById(req.params.id);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(404).json({ success: false, message: err.message || 'Event not found' });
  }
});


// ─── SECONDARY PAGE ROUTES (Financial, Subscriptions, VAS, Commissions, etc.) ─

const SubscriptionSchema = require('../models/schemas/subscriptionSchema');
const CommissionSchema = require('../models/schemas/commissionSchema');
const VASSchema = require('../models/schemas/vasSchema');
const UserSchema = require('../models/schemas/userSchema');
const EventSchema = require('../models/schemas/eventSchema');

// ── Activity Logs ──────────────────────────────────────────────────────────────
router.get('/activity-logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    // Build logs from recent DB events: subscriptions, VAS, commissions, events, users
    const [recentSubs, recentVAS, recentComms, recentEvents, recentUsers] = await Promise.all([
      SubscriptionSchema.find().sort({ createdAt: -1 }).limit(30)
        .populate('user', 'first_name last_name email role').lean(),
      VASSchema.find().sort({ createdAt: -1 }).limit(30)
        .populate('userId', 'first_name last_name email role').lean(),
      CommissionSchema.find().sort({ createdAt: -1 }).limit(20)
        .populate('organizer', 'first_name last_name email').lean(),
      EventSchema.find().sort({ createdAt: -1 }).limit(20).lean(),
      UserSchema.find().sort({ created_at: -1, createdAt: -1 }).limit(20).lean()
    ]);

    const logs = [];

    recentUsers.forEach(u => {
      logs.push({
        type: 'registration',
        userName: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email,
        userRole: u.role,
        description: `New ${u.role} registered: ${u.first_name || ''} ${u.last_name || ''}`.trim(),
        timestamp: u.created_at || u.createdAt
      });
    });

    recentSubs.forEach(s => {
      const user = s.user;
      logs.push({
        type: 'subscription_purchase',
        userName: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Unknown',
        userRole: user?.role || 'organizer',
        description: `Subscription purchased: ${s.plan} plan (${s.billingCycle})`,
        timestamp: s.createdAt
      });
    });

    recentVAS.forEach(v => {
      const user = v.userId;
      logs.push({
        type: 'vas_purchase',
        userName: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Unknown',
        userRole: user?.role || 'player',
        description: `VAS purchased: ${(v.serviceType || '').replaceAll('_', ' ')}`,
        timestamp: v.createdAt
      });
    });

    recentEvents.forEach(e => {
      logs.push({
        type: 'event_creation',
        userName: 'Organizer',
        userRole: 'organizer',
        description: `Event created: ${e.title || e.name}`,
        timestamp: e.created_at || e.createdAt
      });
    });

    recentComms.forEach(c => {
      const org = c.organizer;
      logs.push({
        type: 'payout_processed',
        userName: org ? `${org.first_name || ''} ${org.last_name || ''}`.trim() : 'Organizer',
        userRole: 'organizer',
        description: `Commission ${c.status}: INR ${c.commissionAmount || 0}`,
        timestamp: c.createdAt
      });
    });

    logs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    return res.json({ success: true, activities: logs.slice(0, limit) });
  } catch (err) {
    console.error('Activity logs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load activity logs', error: err.message });
  }
});

// ── Subscriptions Overview ─────────────────────────────────────────────────────
router.get('/subscriptions/overview', async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [allActive, expiringSoon, planBreakdownAgg] = await Promise.all([
      SubscriptionSchema.find({ status: 'active', endDate: { $gte: now } })
        .populate('user', 'first_name last_name email').lean(),
      SubscriptionSchema.find({ status: 'active', endDate: { $gte: now, $lte: sevenDaysLater } })
        .populate('user', 'first_name last_name email').lean(),
      SubscriptionSchema.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } }
      ])
    ]);

    // Monthly revenue trend (last 6 months)
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const revTrend = await SubscriptionSchema.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: { $cond: [{ $eq: ['$billingCycle', 'yearly'] }, { $divide: [{ $ifNull: ['$pricing.yearly', 0] }, 12] }, { $ifNull: ['$pricing.monthly', 0] }] } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const formatSub = (s) => {
      const lastPayment = (s.paymentHistory || []).slice(-1)[0] || {};
      return {
        _id: s._id,
        userName: s.user ? `${s.user.first_name || ''} ${s.user.last_name || ''}`.trim() : 'Unknown',
        email: s.user?.email || '',
        plan: s.plan,
        billingCycle: s.billingCycle,
        status: s.status,
        startDate: s.startDate,
        endDate: s.endDate,
        daysToExpiry: s.endDate ? Math.max(0, Math.ceil((new Date(s.endDate) - now) / (1000 * 60 * 60 * 24))) : null,
        latestAmount: lastPayment.amount || (s.billingCycle === 'yearly' ? s.pricing?.yearly : s.pricing?.monthly) || 0,
        latestTransactionId: lastPayment.transactionId || null
      };
    };

    const planBreakdown = { free: 0, pro: 0, enterprise: 0 };
    planBreakdownAgg.forEach(p => { if (planBreakdown.hasOwnProperty(p._id)) planBreakdown[p._id] = p.count; });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyRevenueTrend = revTrend.map(r => ({
      period: `${monthNames[r._id.month - 1]} ${r._id.year}`,
      revenue: Math.round(r.revenue),
      count: r.count
    }));

    return res.json({
      success: true,
      data: {
        active: allActive.map(formatSub),
        expiring: expiringSoon.map(formatSub),
        planBreakdown,
        monthlyRevenueTrend
      }
    });
  } catch (err) {
    console.error('Subscriptions overview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load subscriptions', error: err.message });
  }
});

// ── VAS Overview ───────────────────────────────────────────────────────────────
router.get('/vas/overview', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [serviceAgg, categoryAgg, purchases, total] = await Promise.all([
      VASSchema.aggregate([
        { $group: { _id: '$serviceType', totalRevenue: { $sum: '$price' }, count: { $sum: 1 } } },
        { $sort: { totalRevenue: -1 } }
      ]),
      VASSchema.aggregate([
        { $group: { _id: '$serviceCategory', totalRevenue: { $sum: '$price' }, count: { $sum: 1 } } }
      ]),
      VASSchema.find().sort({ createdAt: -1 }).skip(skip).limit(limit)
        .populate('userId', 'first_name last_name email').lean(),
      VASSchema.countDocuments()
    ]);

    const formatServiceName = (type) => (type || '').split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

    return res.json({
      success: true,
      data: {
        summary: serviceAgg.map(s => ({
          serviceType: s._id,
          serviceName: formatServiceName(s._id),
          totalRevenue: s.totalRevenue,
          count: s.count
        })),
        revenueByCategory: categoryAgg.map(c => ({
          category: c._id || 'other',
          totalRevenue: c.totalRevenue,
          count: c.count
        })),
        purchases: purchases.map(v => ({
          _id: v._id,
          purchaserName: v.userId ? `${v.userId.first_name || ''} ${v.userId.last_name || ''}`.trim() : 'Unknown',
          purchaserEmail: v.userId?.email || '',
          serviceName: formatServiceName(v.serviceType),
          serviceType: v.serviceType,
          amount: v.price,
          purchaseDate: v.createdAt,
          transactionId: v.paymentId || null
        })),
        pagination: { page, totalPages: Math.ceil(total / limit), limit, total }
      }
    });
  } catch (err) {
    console.error('VAS overview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load VAS revenue', error: err.message });
  }
});

// ── Commissions Overview ───────────────────────────────────────────────────────
router.get('/commissions/overview', async (req, res) => {
  try {
    const [overviewAgg, eligible] = await Promise.all([
      CommissionSchema.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, totalCommission: { $sum: '$commissionAmount' } } }
      ]),
      CommissionSchema.find({ status: { $in: ['pending', 'approved'] } })
        .populate('organizer', 'first_name last_name email').lean()
    ]);

    return res.json({
      success: true,
      data: {
        overview: overviewAgg,
        eligiblePayouts: eligible.map(c => ({
          _id: c._id,
          organizer: c.organizer,
          commissionAmount: c.commissionAmount,
          totalRevenue: c.totalRevenue,
          status: c.status,
          event: c.event
        }))
      }
    });
  } catch (err) {
    console.error('Commissions overview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load commissions', error: err.message });
  }
});

// ── Verification Hub Overview ──────────────────────────────────────────────────
router.get('/verification/overview', async (req, res) => {
  try {
    const [orgStatusAgg, pendingEventsCount] = await Promise.all([
      UserSchema.aggregate([
        { $match: { role: 'organizer' } },
        { $group: { _id: '$verification_status', count: { $sum: 1 } } }
      ]),
      EventSchema.countDocuments({ status: { $in: ['pending', 'pending_approval'] } })
    ]);

    const statusMap = { pending: 0, verified: 0, rejected: 0, suspended: 0 };
    orgStatusAgg.forEach(s => {
      const key = s._id || 'pending';
      if (statusMap.hasOwnProperty(key)) statusMap[key] = s.count;
      else statusMap.pending += s.count; // unknown statuses count as pending
    });

    return res.json({
      success: true,
      data: {
        organizerStatus: statusMap,
        pendingEvents: pendingEventsCount
      }
    });
  } catch (err) {
    console.error('Verification overview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load verification data', error: err.message });
  }
});

// ── Coordinator Activity ───────────────────────────────────────────────────────
router.get('/coordinator-activity', async (req, res) => {
  try {
    const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

    // Get coordinators and their recent actions from events they've been involved with
    const coordinators = await UserSchema.find({ role: 'coordinator' })
      .select('first_name last_name email').lean();

    // Build basic activity records from coordinators' actions
    // (In a real system this would come from an audit log; we synthesize from available data)
    const events = await EventSchema.find({ 'coordinator_id': { $exists: true } })
      .select('title name status coordinator_id updatedAt').sort({ updatedAt: -1 }).limit(50).lean();

    const actions = [];
    events.forEach(e => {
      const coord = coordinators.find(c => String(c._id) === String(e.coordinator_id));
      actions.push({
        coordinator: coord ? `${coord.first_name || ''} ${coord.last_name || ''}`.trim() : 'Coordinator',
        subtype: e.status === 'approved' ? 'approve_event' : e.status === 'rejected' ? 'reject_event' : 'review_event',
        targetName: e.title || e.name,
        result: e.status,
        timestamp: e.updatedAt || e.created_at
      });
    });

    const actionsToday = actions.filter(a => a.timestamp && new Date(a.timestamp) >= startOfDay).length;

    return res.json({ success: true, data: { actionsToday, actions } });
  } catch (err) {
    console.error('Coordinator activity error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load coordinator activity', error: err.message });
  }
});

// ── Financial Overview ─────────────────────────────────────────────────────────
router.get('/financial-overview', async (req, res) => {
  try {
    const [subRevAgg, vasRevAgg, commAgg, orderStatusAgg] = await Promise.all([
      SubscriptionSchema.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: null,
            monthlyRevenue: { $sum: { $cond: [{ $eq: ['$billingCycle', 'yearly'] }, { $divide: [{ $ifNull: ['$pricing.yearly', 0] }, 12] }, { $ifNull: ['$pricing.monthly', 0] }] } },
            total: { $sum: 1 }
          }
        }
      ]),
      VASSchema.aggregate([
        { $group: { _id: null, totalRevenue: { $sum: '$price' }, count: { $sum: 1 } } }
      ]),
      CommissionSchema.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, totalCommission: { $sum: '$commissionAmount' } } }
      ]),
      CommissionSchema.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$totalRevenue' } } }
      ])
    ]);

    const totalCommission = commAgg.reduce((s, c) => s + (c.totalCommission || 0), 0);
    const pendingCount = commAgg.find(c => c._id === 'pending')?.count || 0;

    // Revenue chart data (last 6 months)
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const [subTrend, vasTrend] = await Promise.all([
      SubscriptionSchema.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: { $ifNull: ['$pricing.monthly', 0] } } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),
      VASSchema.aggregate([
        { $match: { createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$price' } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const makeMonthKey = (d) => `${monthNames[d._id.month - 1]} ${d._id.year}`;
    const monthlyRevenue = {};
    subTrend.forEach(d => { const k = makeMonthKey(d); monthlyRevenue[k] = (monthlyRevenue[k] || 0) + d.revenue; });
    vasTrend.forEach(d => { const k = makeMonthKey(d); monthlyRevenue[k] = (monthlyRevenue[k] || 0) + d.revenue; });
    const revenueChart = Object.entries(monthlyRevenue).map(([period, revenue]) => ({ period, revenue }));

    return res.json({
      success: true,
      data: {
        subscription: { monthlyRevenue: Math.round(subRevAgg[0]?.monthlyRevenue || 0), total: subRevAgg[0]?.total || 0 },
        vas: { totalRevenue: vasRevAgg[0]?.totalRevenue || 0, count: vasRevAgg[0]?.count || 0 },
        commission: { totalCommission, pendingCount },
        ordersByStatus: orderStatusAgg,
        charts: {
          revenueByMonth: revenueChart, orderStatus: orderStatusAgg, revenueMix: [
            { name: 'Subscriptions', value: Math.round(subRevAgg[0]?.monthlyRevenue || 0) },
            { name: 'VAS', value: vasRevAgg[0]?.totalRevenue || 0 },
            { name: 'Commission', value: totalCommission }
          ]
        }
      }
    });
  } catch (err) {
    console.error('Financial overview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load financial overview', error: err.message });
  }
});

// ── Stats ──────────────────────────────────────────────────────────────────────
// (Augment existing /stats route — add monthly registration trend)
router.get('/stats/extended', async (req, res) => {
  try {
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const regTrend = await UserSchema.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, role: '$role' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap = {};
    regTrend.forEach(r => {
      const key = `${monthNames[r._id.month - 1]} ${r._id.year}`;
      if (!trendMap[key]) trendMap[key] = { period: key, players: 0, managers: 0, organizers: 0, coordinators: 0, total: 0 };
      const role = r._id.role;
      if (trendMap[key][role] !== undefined) trendMap[key][role] += r.count;
      trendMap[key].total += r.count;
    });
    return res.json({ success: true, data: { registrationTrend: Object.values(trendMap) } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to load extended stats', error: err.message });
  }
});

module.exports = router;


