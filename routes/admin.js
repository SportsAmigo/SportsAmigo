const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const adminController = require('../controllers/adminController');

// Import models directly instead of using destructuring
const User = require('../models/user');
const Team = require('../models/team');
const Event = require('../models/event');

// Admin login page
router.get('/login', (req, res) => {
  res.render('admin-login', {
    title: 'Admin Login',
    error: null
  });
});

// Process admin login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Validate input
  if (!email || !password) {
    return res.render('admin-login', {
      title: 'Admin Login',
      error: 'Email and password are required'
    });
  }
  
  try {
    // Find user in database using User model method
    const user = await User.getUserByEmail(email);
    
    if (!user || user.role !== 'admin') {
      console.log('Admin login failed: Invalid credentials or not an admin account');
      return res.render('admin-login', {
        title: 'Admin Login',
        error: 'Invalid credentials or not an admin account'
      });
    }
    
    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      console.log('Admin login failed: Invalid password');
      return res.render('admin-login', {
        title: 'Admin Login',
        error: 'Invalid email or password'
      });
    }
    
    console.log('Admin login successful:', user.email);
    
    // Set user in session
    req.session.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name
    };
    
    // Redirect to admin dashboard
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Admin login error:', err);
    return res.render('admin-login', {
      title: 'Admin Login',
      error: 'Database error occurred'
    });
  }
});

// Admin dashboard
router.get('/', async (req, res) => {
    try {
        // Get stats from admin controller
        const stats = await adminController.getDashboardStats();
        
        // Get recent activities for activity feed
        const recentActivities = await adminController.getRecentActivities(4);
        
        // Get upcoming events
        const upcomingEvents = await adminController.getUpcomingEvents(4);
        
        // Calculate weekly change (this would ideally come from a time-series database)
        // For now, we'll use placeholder values or calculate from available data
        const weeklyUserChange = Math.floor(stats.users.total * 0.05); // Assume 5% weekly growth
        const weeklyEventChange = Math.floor(stats.events.total * 0.1); // Assume 10% weekly growth
        const weeklyTeamChange = Math.floor(stats.teams.total * 0.08); // Assume 8% weekly growth
        
        // Calculate total revenue (placeholder - would come from a payment system in production)
        // For demo purposes, assume each event generates ₹5000 on average
        const totalRevenue = stats.events.total * 5000;
        const weeklyRevenueChange = Math.floor(totalRevenue * 0.04); // Assume 4% weekly growth
        
        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            user: req.session.user,
            counts: {
                users: stats.users.total,
                teams: stats.teams.total,
                events: stats.events.total
            },
            weeklyChanges: {
                users: weeklyUserChange,
                teams: weeklyTeamChange,
                events: weeklyEventChange,
                revenue: weeklyRevenueChange
            },
            revenue: totalRevenue,
            activities: recentActivities,
            upcomingEvents: upcomingEvents,
            pendingApprovals: stats.users.total > 10 ? 5 : 0, // Placeholder - would come from approvals system
            reportedIssues: 3, // Placeholder - would come from issues tracking system
            layout: 'layouts/dashboard',
            path: '/admin'
        });
    } catch (err) {
        console.error('Error loading admin dashboard:', err);
        res.status(500).render('error', {
            message: 'Failed to load admin dashboard',
            error: err
        });
    }
});

// Admin dashboard direct access route (before middleware)
router.get('/dashboard', async (req, res) => {
  try {
    if (!req.session.user || req.session.user.role !== 'admin') {
      return res.redirect('/admin/login');
    }
    
    console.log('Loading admin dashboard for user:', req.session.user.email);
    
    // Get stats from admin controller
    const stats = await adminController.getDashboardStats();
    
    // Get recent activities for activity feed
    const recentActivities = await adminController.getRecentActivities(4);
    
    // Get upcoming events
    const upcomingEvents = await adminController.getUpcomingEvents(4);
    
    // Calculate weekly change (this would ideally come from a time-series database)
    // For now, we'll use placeholder values or calculate from available data
    const weeklyUserChange = Math.floor(stats.users.total * 0.05); // Assume 5% weekly growth
    const weeklyEventChange = Math.floor(stats.events.total * 0.1); // Assume 10% weekly growth
    const weeklyTeamChange = Math.floor(stats.teams.total * 0.08); // Assume 8% weekly growth
    
    // Calculate total revenue (placeholder - would come from a payment system in production)
    // For demo purposes, assume each event generates ₹5000 on average
    const totalRevenue = stats.events.total * 5000;
    const weeklyRevenueChange = Math.floor(totalRevenue * 0.04); // Assume 4% weekly growth
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      user: req.session.user,
      counts: {
        users: stats.users.total,
        teams: stats.teams.total,
        events: stats.events.total
      },
      weeklyChanges: {
        users: weeklyUserChange,
        teams: weeklyTeamChange,
        events: weeklyEventChange,
        revenue: weeklyRevenueChange
      },
      revenue: totalRevenue,
      activities: recentActivities,
      upcomingEvents: upcomingEvents,
      pendingApprovals: stats.users.total > 10 ? 5 : 0, // Placeholder - would come from approvals system
      reportedIssues: 3, // Placeholder - would come from issues tracking system
      layout: 'layouts/dashboard',
      path: '/admin/dashboard'
    });
  } catch (err) {
    console.error('Error loading admin dashboard:', err);
    res.status(500).render('error', {
      message: 'Failed to load admin dashboard',
      error: err
    });
  }
});

// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') {
        next();
    } else {
        res.redirect('/login');
    }
};

// Apply isAdmin middleware to all routes
router.use(isAdmin);

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

// Activity Logs
router.get('/activity-logs', async (req, res) => {
    try {
        // Get recent activities
        const activities = await adminController.getRecentActivities(50); // Get more logs for this page
        
        res.render('admin/activity-logs', {
            title: 'Activity Logs',
            layout: 'layouts/dashboard',
            user: req.session.user,
            activities: activities,
            path: '/admin/activity-logs'
        });
    } catch (error) {
        console.error('Error in activity logs route:', error);
        res.status(500).send('An error occurred while fetching activity logs');
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

// Delete routes for users
router.delete('/managers/:id', async (req, res) => {
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

router.delete('/organizers/:id', async (req, res) => {
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
router.delete('/players/:id', async (req, res) => {
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

// Direct admin login endpoint for troubleshooting 
router.get('/direct-login', async (req, res) => {
  try {
    // Get admin by email
    const adminEmail = 'admin@sportsapp.com';
    const admin = await User.getUserByEmail(adminEmail);
    
    if (!admin || admin.role !== 'admin') {
      return res.status(404).send('Admin account not found. Please run the create-admin-user.js script first.');
    }
    
    // Set up session
    req.session.user = {
      id: admin._id,
      email: admin.email,
      role: admin.role,
      first_name: admin.first_name,
      last_name: admin.last_name
    };
    
    console.log('Direct admin login successful for:', admin.email);
    
    // Redirect to dashboard
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Direct admin login error:', err);
    res.status(500).send('Direct admin login error: ' + err.message);
  }
});

// Test route for admin authentication
router.get('/test-auth', async (req, res) => {
  try {
    // Find all admins
    const admins = await User.getAllUsers({ role: 'admin' });
    
    return res.json({
      count: admins.length,
      admins: admins.map(admin => ({
        id: admin._id,
        email: admin.email,
        name: `${admin.first_name} ${admin.last_name}`,
        login_url: `/admin/direct-login`
      }))
    });
  } catch (err) {
    console.error('Admin test auth error:', err);
    res.status(500).send('Admin test auth error: ' + err.message);
  }
});

module.exports = router; 