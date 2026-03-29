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
    try {
        console.log('API: Fetching all users (unified)');
        
        // Fetch all user types
        const [players, managers, organizers] = await Promise.all([
            adminController.getAllUsersByRole('player'),
            adminController.getAllUsersByRole('manager'),
            adminController.getAllUsersByRole('organizer')
        ]);
        
        // Combine all users
        const allUsers = [...players, ...managers, ...organizers];
        
        return res.json({
            success: true,
            total: allUsers.length,
            breakdown: {
                players: players.length,
                managers: managers.length,
                organizers: organizers.length
            },
            users: allUsers
        });
    } catch (err) {
        console.error('Error fetching all users:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch users',
            error: err.message
        });
    }
});

// Get all teams - JSON API
router.get('/teams', async (req, res) => {
    try {
        console.log('API: Fetching all teams');
        const teams = await Team.getAllTeams();
        
        // Transform _id to id for frontend compatibility
        const formattedTeams = teams.map(team => ({
            ...team,
            id: team._id.toString()
        }));
        
        return res.json({
            success: true,
            count: formattedTeams.length,
            teams: formattedTeams || []
        });
    } catch (err) {
        console.error('Error fetching teams:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch teams',
            error: err.message
        });
    }
});

// Get all events - JSON API
router.get('/events', async (req, res) => {
    try {
        console.log('API: Fetching all events');
        const events = await Event.getAllEvents();
        
        // Transform _id to id for frontend compatibility
        const formattedEvents = events.map(event => ({
            ...event,
            id: event._id.toString()
        }));
        
        return res.json({
            success: true,
            count: formattedEvents.length,
            events: formattedEvents || []
        });
    } catch (err) {
        console.error('Error fetching events:', err);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch events',
            error: err.message
        });
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
        
        res.render('admin/stats', {
            title: 'System Statistics',
            user: req.session.user,
            stats: stats,
            layout: 'layouts/dashboard',
            path: '/admin/stats'
        });
    } catch (err) {
        console.error('Error generating stats:', err);
        res.status(500).render('error', {
            message: 'Failed to generate statistics',
            error: err
        });
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

module.exports = router; 