const express = require('express');
const router = express.Router();
const { Team, User, Event } = require('../models');
const { teamController, eventController, userController } = require('../controllers');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Middleware to check if user is logged in as manager
function isManager(req, res, next) {
    if (req.session.user && req.session.user.role === 'manager') {
        next();
    } else {
        res.redirect('/login');
    }
}

// Apply isManager middleware to all routes
router.use(isManager);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads/profile');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Use user ID and timestamp to make the filename unique
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'profile-' + req.session.user._id + '-' + uniqueSuffix + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb('Error: Images only!');
        }
    }
});

// Manager dashboard
router.get('/', async (req, res) => {
    try {
        // Get teams managed by this user
        const teams = await Team.getTeamsByManager(req.session.user._id);
        
        // Count total players across all teams
        let playerCount = 0;
        // Calculate total wins, losses, and draws
        let totalWins = 0;
        let totalLosses = 0;
        let totalDraws = 0;
        
        teams.forEach(team => {
            playerCount += team.members ? team.members.length : 0;
            totalWins += team.wins || 0;
            totalLosses += team.losses || 0;
            totalDraws += team.draws || 0;
        });
        
        // Count pending join requests across all teams
        let pendingRequestCount = 0;
        teams.forEach(team => {
            if (team.join_requests) {
                const pending = team.join_requests.filter(req => req.status === 'pending');
                pendingRequestCount += pending.length;
            }
        });
        
        // Get upcoming events that the manager's teams are registered for
        let registeredEvents = [];
        try {
            const Event = require('../models/event');
            registeredEvents = await Event.getManagerEvents(req.session.user._id);
        } catch (error) {
            console.error('Error fetching registered events:', error);
        }
        
        // Get the first upcoming event if available
        let upcomingEvent = null;
        if (registeredEvents && registeredEvents.length > 0) {
            upcomingEvent = registeredEvents[0];
        }
        
        // Create recent activities list
        let recentActivities = [];
        
        // Add team creation activities
        teams.forEach(team => {
            recentActivities.push({
                date: team.created_at,
                description: `You created the team "${team.name}"`
            });
            
            // Add team member join activities if available
            if (team.members && team.members.length > 0) {
                team.members.slice(0, 2).forEach(member => {
                    recentActivities.push({
                        date: member.joined_date,
                        description: `New player "${member.first_name || ''} ${member.last_name || ''}" joined "${team.name}"`
                    });
                });
            }
        });
        
        // Add event registration activities
        if (registeredEvents && registeredEvents.length > 0) {
            registeredEvents.slice(0, 2).forEach(event => {
                recentActivities.push({
                    date: event.registration_date || new Date(),
                    description: `You registered "${event.team_name}" for "${event.event_name}"`
                });
            });
        }
        
        // Sort activities by date, most recent first
        recentActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Keep only the 5 most recent activities
        recentActivities = recentActivities.slice(0, 5);
        
        // Return JSON for React frontend
        res.json({
            success: true,
            user: {
                id: req.session.user._id,
                name: req.session.user.name || req.session.user.first_name,
                email: req.session.user.email,
                role: req.session.user.role
            },
            teams: teams,
            teamCount: teams.length,
            playerCount: playerCount,
            eventCount: registeredEvents.length,
            wins: totalWins,
            losses: totalLosses,
            draws: totalDraws,
            pendingRequestCount: pendingRequestCount,
            registeredEvents: registeredEvents || [],
            upcomingEvent: upcomingEvent,
            recentActivities: recentActivities,
            events: registeredEvents || [],
            totalPlayers: playerCount
        });
    } catch (err) {
        console.error('Error loading manager dashboard:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard: ' + err.message
        });
    }
});

router.get('/dashboard', async (req, res) => {
    try {
        // Get teams managed by this user
        const teams = await Team.getTeamsByManager(req.session.user._id);
        
        // Calculate stats
        let playerCount = 0;
        let totalWins = 0;
        let totalLosses = 0;
        let totalDraws = 0;
        
        teams.forEach(team => {
            playerCount += team.members ? team.members.length : 0;
            totalWins += team.wins || 0;
            totalLosses += team.losses || 0;
            totalDraws += team.draws || 0;
        });
        
        // Get registered events
        let registeredEvents = [];
        try {
            const Event = require('../models/event');
            registeredEvents = await Event.getManagerEvents(req.session.user._id);
        } catch (error) {
            console.error('Error fetching registered events:', error);
        }
        
        // Return JSON for React frontend
        res.json({
            success: true,
            teams: teams,
            teamCount: teams.length,
            playerCount: playerCount,
            eventCount: registeredEvents.length,
            wins: totalWins,
            losses: totalLosses,
            draws: totalDraws,
            registeredEvents: registeredEvents || []
        });
    } catch (err) {
        console.error('Error loading manager dashboard:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to load dashboard: ' + err.message
        });
    }
});

// Update profile (API endpoint for React)
router.put('/profile', upload.single('profile_image'), async (req, res) => {
    try {
        const userId = req.session.user._id;
        
        console.log('Received profile update:', req.body);
        console.log('Received file:', req.file);
        
        // Create the updated profile object
        const updatedProfile = {
            first_name: req.body.first_name || '',
            last_name: req.body.last_name || '',
            email: req.body.email || req.session.user.email,
            phone: req.body.phone || '',
            bio: req.body.bio || ''
        };
        
        // If a new image was uploaded, add the path
        if (req.file) {
            updatedProfile.profile_image = '/uploads/profile/' + req.file.filename;
        }
        
        console.log('Updating profile with data:', updatedProfile);
        
        // Update the user in the database
        const updatedUser = await User.updateUser(userId, updatedProfile);
        
        if (!updatedUser) {
            return res.status(500).json({
                success: false,
                message: 'Failed to update user in database'
            });
        }
        
        // Fetch fresh user data
        const freshUserData = await User.getUserById(userId);
        
        if (!freshUserData) {
            return res.status(500).json({
                success: false,
                message: 'Failed to retrieve updated user data'
            });
        }
        
        // Create complete user object for session
        const sessionUser = freshUserData.toObject ? freshUserData.toObject() : freshUserData;
        sessionUser.name = sessionUser.first_name + (sessionUser.last_name ? ' ' + sessionUser.last_name : '');
        
        // Update the session
        req.session.user = sessionUser;
        
        // Save session
        await new Promise((resolve, reject) => {
            req.session.save(err => {
                if (err) reject(err);
                else resolve();
            });
        });
        
        return res.json({
            success: true,
            message: 'Profile updated successfully!',
            user: sessionUser
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        return res.status(500).json({
            success: false,
            message: `Error updating profile: ${err.message}`
        });
    }
});

// Matches page (renamed to Events)
router.get('/matches', async (req, res) => {
    try {
        if (!req.session.user || !req.session.user._id) {
            console.error('No user ID found in session:', req.session);
            return res.status(401).render('error', {
                message: 'User not authenticated',
                error: { status: 401, stack: 'Missing user ID in session' }
            });
        }

        // Check if user is a new user (incomplete profile)
        const isNewUser = !req.session.user.name || !req.session.user.phone || 
                          !req.session.user.age || !req.session.user.address || 
                          !req.session.user.bio;
        
        // Get manager's teams
        const teams = await Team.getTeamsByManager(req.session.user._id);
        


        // Fetch real events from the database
        const allEvents = await Event.getAllEvents();
        
        // Get past events (could filter based on date)
        const pastEvents = allEvents.filter(event => {
            const eventDate = new Date(event.event_date);
            return eventDate < new Date();
        });
        
        // Get upcoming events (could filter based on date)
        const events = allEvents.filter(event => {
            const eventDate = new Date(event.event_date);
            return eventDate >= new Date();
        });
        
        res.render('manager/matches', {
            title: 'Browse Matches',
            user: req.session.user,
            events: events || [],
            pastEvents: pastEvents || [],
            teams: teams || [],
            isNewUser: isNewUser,
            messages: req.session.messages || {},
            layout: 'layouts/dashboard',
            path: '/manager/matches'
        });
        
        // Clear flash messages
        delete req.session.messages;
    } catch (err) {
        console.error('Error loading matches page:', err);
        res.status(500).render('error', {
            message: 'Failed to load matches page',
            error: err
        });
    }
});

// Player Performance page
router.get('/player-performance', async (req, res) => {
    try {
        console.log('Accessing team performance route');
        
        // For demo, directly render the performance template without additional data
        // that might be causing the error. The performance.ejs template now doesn't need player data.
        res.render('manager/performance', {
            title: 'Team Performance',
            user: req.session.user,
            layout: 'layouts/dashboard',
            path: '/manager/player-performance' // Match the sidebar link path
        });
    } catch (err) {
        console.error('Error loading team performance page:', err);
        res.status(500).render('error', {
            message: 'Failed to load team performance data',
            error: err
        });
    }
});

// Profile page
router.get('/profile', async (req, res) => {
    try {
        // Create a profile object from session data
        const profile = {
            ...req.session.user,
            ...req.session.user.profile
        };
        
        // Ensure photoUrl is available from photo_url if needed
        if (!profile.photoUrl && profile.photo_url) {
            profile.photoUrl = profile.photo_url;
        }
        
        // Add debugging to see what data is being passed to the template
        console.log('Profile data being passed to template:', profile);
        
        res.render('manager/profile', {
            title: 'My Profile',
            user: req.session.user,
            profile: profile,
            layout: 'layouts/sidebar-dashboard',
            path: '/manager/profile'
        });
    } catch (err) {
        console.error('Error rendering manager profile:', err);
        res.status(500).render('error', { 
            message: 'Failed to render manager profile', 
            error: err 
        });
    }
});

// My Teams
router.get('/my-teams', async (req, res) => {
    try {
        const teams = await Team.getManagerTeams(req.session.user._id);
        console.log('Manager teams:', teams);
        
        res.json({
            success: true,
            teams: teams || [],
            messages: req.session.messages || {}
        });
        
        // Clear flash messages
        delete req.session.messages;
    } catch (err) {
        console.error('Error retrieving manager teams:', err);
        res.status(500).json({ 
            success: false,
            message: 'Failed to retrieve your teams',
            error: err.message
        });
    }
});

// Create Team Form
router.get('/create-team', (req, res) => {
    res.json({
        success: true,
        user: req.session.user,
        messages: req.session.messages || {}
    });
    
    // Clear flash messages
    delete req.session.messages;
});

// Create Team (Process Form)
router.post('/create-team', async (req, res) => {
    try {
        const { name, sport_type, description, max_members } = req.body;
        
        // Check if this is an AJAX request
        const isAjax = req.headers['content-type'] === 'application/json' || 
                      req.headers['x-requested-with'] === 'XMLHttpRequest';
        
        // Validation
        const validationErrors = {};
        
        if (!name) validationErrors.name = 'Team name is required';
        if (!sport_type) validationErrors.sport_type = 'Sport type is required';
        if (max_members && (isNaN(max_members) || parseInt(max_members) < 1)) {
            validationErrors.max_members = 'Max members must be a positive number';
        }
        
        // Check if manager already has a team with this sport type
        const existingTeam = await Team.find({
            manager_id: req.session.user._id,
            sport_type: sport_type
        });
        
        if (existingTeam && existingTeam.length > 0) {
            validationErrors.sport_type = `You already have a ${sport_type} team. Each manager can only create one team per sport type.`;
        }
        
        // If validation fails, return appropriate response
        if (Object.keys(validationErrors).length > 0) {
            if (isAjax) {
                return res.json({
                    success: false,
                    message: 'Please fix the validation errors',
                    errors: validationErrors
                });
            }
            
            req.session.messages = { error: 'Team name and sport type are required' };
            return res.redirect('/manager/create-team');
        }
        
        // Create team object
        const teamData = {
            name,
            sport_type,
            description,
            max_members: max_members ? parseInt(max_members, 10) : 10,
            manager_id: req.session.user._id
        };
    
        // Save team to database
        try {
            const team = await Team.createTeam(teamData);
            console.log(`Team created with ID: ${team._id}`);
            
            if (isAjax) {
                return res.json({
                    success: true,
                    message: 'Team created successfully!',
                    redirectUrl: '/manager/my-teams',
                    team: {
                        id: team._id,
                        name: team.name,
                        sport_type: team.sport_type,
                        description: team.description,
                        max_members: team.max_members
                    }
                });
            }
            
            req.session.messages = { success: 'Team created successfully!' };
            res.redirect('/manager/my-teams');
        } catch (error) {
            console.error('Error creating team:', error);
            
            if (isAjax) {
                return res.json({
                    success: false,
                    message: 'Failed to create team: ' + error.message
                });
            }
            
            req.session.messages = { error: 'Failed to create team: ' + error.message };
            return res.redirect('/manager/create-team');
        }
    } catch (err) {
        console.error('Error in create-team route:', err);
        
        const isAjax = req.headers['content-type'] === 'application/json' || 
                      req.headers['x-requested-with'] === 'XMLHttpRequest';
        
        if (isAjax) {
            return res.json({
                success: false,
                message: 'An error occurred while creating the team'
            });
        }
        
        req.session.messages = { error: 'An error occurred while creating the team' };
        res.redirect('/manager/create-team');
    }
});

// Update team (PUT)
router.put('/team/:id', async (req, res) => {
    try {
        const teamId = req.params.id;
        const { name, sport_type, description, max_members } = req.body;
        const managerId = req.session.user._id;
        
        // Get the team to check if current user is the manager
        const team = await Team.getTeamById(teamId);
        
        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }
        
        // Check if the current user is the team manager
        if (team.manager_id.toString() !== managerId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this team'
            });
        }
        
        // Validation
        if (!name || !sport_type) {
            return res.status(400).json({
                success: false,
                message: 'Team name and sport type are required'
            });
        }
        
        if (max_members && (isNaN(max_members) || parseInt(max_members) < 5 || parseInt(max_members) > 50)) {
            return res.status(400).json({
                success: false,
                message: 'Max members must be between 5 and 50'
            });
        }
        
        // Update team data
        const updatedData = {
            name: name.trim(),
            sport_type: sport_type.trim(),
            description: description ? description.trim() : '',
            max_members: max_members ? parseInt(max_members, 10) : team.max_members
        };
        
        // Update the team
        const updatedTeam = await Team.updateTeam(teamId, updatedData);
        
        return res.json({
            success: true,
            message: 'Team updated successfully',
            team: updatedTeam
        });
    } catch (err) {
        console.error('Error updating team:', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'Error updating team'
        });
    }
});

// Manage Team
router.get('/team/:id', async (req, res) => {
    try {
    const teamId = req.params.id;
        const team = await Team.getTeamById(teamId);
        
        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }
        
        // Make sure the manager owns this team (convert to string for comparison)
        if (team.manager_id.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to manage this team'
            });
        }
        
        res.json({
            success: true,
            team: team,
            messages: req.session.messages || {}
        });
        
        // Clear flash messages
        delete req.session.messages;
    } catch (err) {
        console.error('Error retrieving team details:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve team details',
            error: err.message
        });
    }
});

// Team Members Management
router.get('/team/:id/members', (req, res) => {
    const teamId = req.params.id;
    
    Team.getTeamById(teamId, (err, team) => {
        if (err) {
            console.error('Error fetching team:', err);
            return res.status(500).send('An error occurred while fetching team details');
        }
        
        if (!team) {
            return res.status(404).send('Team not found');
        }
        
        // Check if current user is the manager
        if (team.manager_id !== req.session.user._id) {
            return res.status(403).send('You do not have permission to manage this team');
        }
        
        // Get all players for adding to team
        User.getUsersByRole('player', (err, players) => {
            if (err) {
                console.error('Error fetching players:', err);
                return res.status(500).send('An error occurred while fetching players');
            }
            
            res.render('manager/team-members', { 
                user: req.session.user,
                team: team,
                players: players,
                layout: 'layouts/dashboard',
                path: '/manager/my-teams'
            });
        });
    });
});

// Add Player to Team
router.post('/team/:id/add-player', (req, res) => {
    const teamId = parseInt(req.params.id);
    const playerId = parseInt(req.body.player_id);
    
    if (!playerId) {
        return res.status(400).send('Player ID is required');
    }
    
    Team.addPlayerToTeam(teamId, playerId, (err, success) => {
        if (err) {
            console.error('Error adding player to team:', err);
            return res.status(500).send('An error occurred: ' + err.message);
        }
        
        res.redirect(`/manager/team/${teamId}/members`);
    });
});

// Remove Player from Team
router.post('/team/:id/remove-player/:playerId', (req, res) => {
    const teamId = parseInt(req.params.id);
    const playerId = parseInt(req.params.playerId);
    
    Team.removePlayerFromTeam(teamId, playerId, (err, success) => {
        if (err) {
            console.error('Error removing player from team:', err);
            return res.status(500).send('An error occurred: ' + err.message);
        }
        
        res.redirect(`/manager/team/${teamId}/members`);
    });
});

// Update Team Form
router.get('/team/:id/edit', (req, res) => {
    const teamId = req.params.id;
    console.log('Editing team:', teamId);
    
    // Sample team data
    const team = {
        id: teamId,
        name: 'Blazing Hawks',
        sport: 'Basketball',
        status: 'Active',
        player_count: 11,
        members: 12
    };
        
        res.render('manager/edit-team', { 
        title: 'Edit Team',
            user: req.session.user,
            team: team,
            layout: 'layouts/dashboard',
        path: '/manager/my-team'
    });
});

// Update Team Handler
router.post('/team/:id/edit', (req, res) => {
    const teamId = parseInt(req.params.id);
    
    const teamData = {
        name: req.body.name,
        sport: req.body.sport,
        members: parseInt(req.body.members),
        status: req.body.status
    };
    
    Team.updateTeam(teamId, teamData, (err, success) => {
        if (err) {
            console.error('Error updating team:', err);
            return res.status(500).send('An error occurred while updating the team');
        }
        
        res.redirect('/manager/my-teams');
    });
});

// Join Requests
router.get('/join-requests', async (req, res) => {
    try {
        const requests = await Team.getManagerJoinRequests(req.session.user._id);
        console.log('Join requests:', requests);
        
        res.json({
            success: true,
            requests: requests || [],
            messages: req.session.messages || {}
        });
        
        // Clear flash messages
        delete req.session.messages;
    } catch (err) {
        console.error('Error retrieving join requests:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve join requests',
            error: err.message
        });
    }
});

// Process Join Request
router.post('/process-request', async (req, res) => {
    try {
        const { requestId, action } = req.body;
        
        if (!requestId || !action) {
            req.session.messages = { error: 'Request ID and action are required' };
            return res.redirect('/manager/join-requests');
        }
        
        console.log(`Processing join request ${requestId} with action ${action}`);
        
        // Set status based on action
        const status = action === 'approve' ? 'approved' : 'rejected';
        
        // Process the request
        const result = await Team.processJoinRequest(requestId, status);
        
        if (result) {
            req.session.messages = { 
                success: `Request ${status === 'approved' ? 'approved' : 'rejected'} successfully!` 
            };
        } else {
            req.session.messages = { error: 'Failed to process request' };
        }
        
        res.redirect('/manager/join-requests');
    } catch (err) {
        console.error('Error processing join request:', err);
        req.session.messages = { error: err.message || 'Failed to process request' };
        res.redirect('/manager/join-requests');
    }
});

// Approve Join Request (API for React)
router.post('/team/:teamId/approve-request', async (req, res) => {
    console.log('=== APPROVE REQUEST ROUTE HIT ===');
    console.log('Params:', req.params);
    console.log('Body:', req.body);
    console.log('User:', req.session?.user);
    
    try {
        const { teamId } = req.params;
        const { requestId, playerId } = req.body;
        
        if (!requestId || !playerId) {
            console.log('Missing requestId or playerId');
            return res.status(400).json({
                success: false,
                message: 'Request ID and Player ID are required'
            });
        }
        
        console.log(`Approving join request ${requestId} for team ${teamId}, player ${playerId}`);
        
        // Process the request as approved
        const result = await Team.processJoinRequest(requestId, 'approved');
        
        if (result) {
            res.json({
                success: true,
                message: 'Join request approved successfully!'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to approve request'
            });
        }
    } catch (err) {
        console.error('Error approving join request:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Failed to approve request'
        });
    }
});

// Reject Join Request (API for React)
router.post('/team/:teamId/reject-request', async (req, res) => {
    try {
        const { teamId } = req.params;
        const { requestId } = req.body;
        
        if (!requestId) {
            return res.status(400).json({
                success: false,
                message: 'Request ID is required'
            });
        }
        
        console.log(`Rejecting join request ${requestId} for team ${teamId}`);
        
        // Process the request as rejected
        const result = await Team.processJoinRequest(requestId, 'rejected');
        
        if (result) {
            res.json({
                success: true,
                message: 'Join request rejected'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to reject request'
            });
        }
    } catch (err) {
        console.error('Error rejecting join request:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Failed to reject request'
        });
    }
});

// Add route for profile updates
router.post('/update-profile', isManager, async (req, res) => {
    try {
        const userId = req.session.user._id;
        
        // Log the received data for debugging
        console.log('Received profile update data:', req.body);
        
        // Create the updated profile object with all fields
        const updatedProfile = {
            name: req.body.name || '',
            first_name: req.body.first_name || '',
            last_name: req.body.last_name || '',
            email: req.body.email || req.session.user.email, // Keep existing email if not provided
            phone: req.body.phone || '',
            age: req.body.age ? parseInt(req.body.age, 10) : undefined,
            address: req.body.address || '',
            bio: req.body.bio || '',
            organization: req.body.organization || req.body.organization_name || '',
            organization_name: req.body.organization || req.body.organization_name || ''
        };
        
        console.log('Updating profile with data:', updatedProfile);
        
        // Update the user in the database
        const updatedUser = await User.updateUser(userId, updatedProfile);
        
        if (!updatedUser) {
            throw new Error('Failed to update user in database');
        }
        
        // Fetch fresh user data from database to ensure we have all fields
        const freshUserData = await User.getUserById(userId);
        
        if (!freshUserData) {
            throw new Error('Failed to retrieve updated user data');
        }
        
        // Create complete user object for session
        const sessionUser = freshUserData.toObject ? freshUserData.toObject() : freshUserData;
        
        // Add UI-friendly name format
        sessionUser.name = sessionUser.first_name + (sessionUser.last_name ? ' ' + sessionUser.last_name : '');
        
        console.log('Updating session with complete user data:', {
            name: sessionUser.name,
            email: sessionUser.email,
            profile_image: sessionUser.profile_image,
            age: sessionUser.age,
            address: sessionUser.address, 
            bio: sessionUser.bio
        });
        
        // Update the session with complete user data
        req.session.user = sessionUser;
        
        // Save session to ensure persistence
        req.session.save(err => {
            if (err) {
                console.error('Error saving session after profile update:', err);
            }
            
            req.session.flashMessage = {
                type: 'success',
                text: 'Profile updated successfully!'
            };
            
            return res.redirect('/manager/profile');
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        req.session.flashMessage = {
            type: 'error',
            text: `Error updating profile: ${err.message}`
        };
        return res.redirect('/manager/profile');
    }
});

// Add route for changing password
router.post('/change-password', isManager, async (req, res) => {
    try {
        const userId = req.session.user._id;
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        console.log('Password change request received');
        
        // Validate password match
        if (newPassword !== confirmPassword) {
            req.session.flashMessage = {
                type: 'error',
                text: 'New passwords do not match.'
            };
            return res.redirect('/manager/profile');
        }
        
        // Get user from database
        const user = await User.getUserById(userId);
        
        if (!user) {
            throw new Error('User not found');
        }
        
        // Verify current password using bcrypt
        const bcrypt = require('bcrypt');
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!isMatch) {
            req.session.flashMessage = {
                type: 'error',
                text: 'Current password is incorrect.'
            };
            return res.redirect('/manager/profile');
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update password directly in the database
        user.password = hashedPassword;
        await user.save();
        
        console.log('Password updated successfully');
        
        req.session.flashMessage = {
            type: 'success',
            text: 'Password changed successfully!'
        };
        res.redirect('/manager/profile');
    } catch (err) {
        console.error('Error changing password:', err);
        req.session.flashMessage = {
            type: 'error',
            text: `Error changing password: ${err.message}`
        };
        res.redirect('/manager/profile');
    }
});

// Update profile photo handler
router.post('/update-photo', isManager, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            req.session.message = {
                type: 'danger',
                text: 'No file was uploaded. Please select an image file.'
            };
            return res.redirect('/manager/profile');
        }

        const userId = req.session.user._id;
        
        // Set the path to the uploaded file - ensure it starts with a slash for consistency
        const profileImagePath = `/uploads/profile/${req.file.filename}`;
        
        // Update user in database using the updateUser method from our model
        const updatedUser = await User.updateUser(userId, {
            profile_image: profileImagePath
        });
        
        if (!updatedUser) {
            throw new Error('Failed to update user record');
        }
        
        // Fetch the latest user data from database to ensure we have all fields
        const latestUserData = await User.getUserById(userId);
        
        if (!latestUserData) {
            throw new Error('Failed to retrieve updated user data');
        }
        
        // Create complete user object for session
        const sessionUser = latestUserData.toObject ? latestUserData.toObject() : latestUserData;
        
        // Add UI-friendly name format
        sessionUser.name = sessionUser.first_name + (sessionUser.last_name ? ' ' + sessionUser.last_name : '');
        
        console.log('Profile picture updated successfully:', profileImagePath);
        
        // Update the complete session with the latest user data
        req.session.user = sessionUser;
        
        // Save the session to ensure changes are persisted
        req.session.save((err) => {
            if (err) {
                console.error('Error saving session after profile update:', err);
            }
            
            req.session.message = {
                type: 'success',
                text: 'Profile picture updated successfully!'
            };
            
            res.redirect('/manager/profile');
        });
    } catch (err) {
        console.error('Error updating profile picture:', err);
        req.session.message = {
            type: 'danger',
            text: `Failed to update profile picture: ${err.message}`
        };
        res.redirect('/manager/profile');
    }
});

// Browse Events route
router.get('/browse-events', async (req, res) => {
    try {
        console.log('Accessing browse-events route');
        
        const Event = require('../models/event');
        const Team = require('../models/team');

        // Check if session user exists
        if (!req.session.user?._id) {
            console.error('No user ID found in session');
            return res.status(401).render('error', {
                title: '401 - Unauthorized',
                message: 'You must be logged in to browse events.',
                layout: 'layouts/main'
            });
        }

        const managerId = req.session.user._id;
        console.log('Checking session user ID:', managerId);

        try {
            // Get manager's teams
            const teams = await Team.getTeamsByManager(managerId);
            console.log(`Retrieved ${teams.length} teams`);
            
            // Get team IDs for lookup
            const teamIds = teams.map(team => team._id.toString());
            
            // Get manager's registered events
            const registeredEvents = await Event.getManagerEvents(managerId);
            console.log(`Retrieved ${registeredEvents ? registeredEvents.length : 0} registered events`);
            
            // Create a set of event IDs that the manager is already registered for
            const registeredEventIds = new Set();
            if (registeredEvents && registeredEvents.length > 0) {
                registeredEvents.forEach(event => {
                    registeredEventIds.add(event.event_id.toString());
                });
            }
            
            // Get all events directly from the Event model
            const events = await Event.getAllEvents();
            console.log(`Retrieved ${events.length} available events`);
            
            // Format events for display
            const formattedEvents = events.map(event => {
                // Check if this event is already registered by any team of this manager
                const isRegistered = registeredEventIds.has(event._id.toString());
                
                // Find registration status if registered
                let registrationStatus = null;
                if (isRegistered && event.team_registrations) {
                    const managerRegistration = event.team_registrations.find(reg => 
                        teamIds.includes(reg.team_id.toString())
                    );
                    if (managerRegistration) {
                        registrationStatus = managerRegistration.status;
                    }
                }
                
                // Ensure all required fields exist with fallbacks
                return {
                    id: event._id,
                    name: event.title || 'Unnamed Event',
                    description: event.description || '',
                    date: event.event_date || new Date().toISOString().split('T')[0],
                    location: event.location || 'TBD',
                    sport: event.sport_type || 'General',
                    status: 'Open',
                    registration_deadline: event.registration_deadline || new Date().toISOString().split('T')[0],
                    max_participants: event.max_teams ? event.max_teams * 10 : 100,
                    current_participants: 0,
                    isRegistered: isRegistered,
                    registrationStatus: registrationStatus,
                    // Format organizer information
                    organizer: event.organizer_first_name && event.organizer_last_name ? 
                        `${event.organizer_first_name} ${event.organizer_last_name}` : 
                        (event.organization_name || 'Unknown')
                };
            });
            
            // Check for messages
            let message = null;
            if (req.session.message) {
                message = req.session.message;
                delete req.session.message;
            }
            
            res.json({
                success: true,
                events: formattedEvents,
                pastEvents: registeredEvents || [],
                teams: teams,
                message: message
            });
        } catch (err) {
            console.error('Error fetching event data:', err);
            return res.status(500).json({
                success: false,
                message: 'An error occurred while fetching event data: ' + err.message
            });
        }
    } catch (error) {
        console.error('Error loading browse events page:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'An error occurred while loading the browse events page.'
        });
    }
});

// Route for registering for an event
router.post('/event/:id/register', async (req, res) => {
    try {
        const eventId = req.params.id;
        const teamId = req.body.team_id;
        const notes = req.body.notes || '';
    
        console.log(`Attempting to register a team for event ${eventId}`);
        console.log('Request body:', req.body);
    
        if (!eventId) {
            req.session.message = {
                type: 'danger',
                text: 'Event ID is missing from the request'
            };
            return res.redirect('/manager/browse-events');
        }
        
        if (!teamId) {
            req.session.message = {
                type: 'danger',
                text: 'Team ID is required for registration. Please select a valid team.'
            };
            return res.redirect(`/manager/event/${eventId}/details`);
        }
        
        // Verify that the event exists
        const Event = require('../models/event');
        const event = await Event.getEventById(eventId);
        
        if (!event) {
            req.session.message = {
                type: 'danger',
                text: 'Event not found'
            };
            return res.redirect('/manager/browse-events');
        }
        
        // Verify that the team belongs to the current manager
        const Team = require('../models/team');
        const team = await Team.getTeamById(teamId);
        
        if (!team) {
            req.session.message = {
                type: 'danger',
                text: 'Team not found'
            };
            return res.redirect(`/manager/event/${eventId}/details`);
        }
        
        const managerId = req.session.user._id;
        if (team.manager_id.toString() !== managerId.toString()) {
            req.session.message = {
                type: 'danger',
                text: 'You do not have permission to register this team'
            };
            return res.redirect(`/manager/event/${eventId}/details`);
        }
        
        console.log(`Verified team ${teamId} belongs to manager ${managerId}`);
        
        // Check if THIS SPECIFIC TEAM is already registered (allow multiple teams per manager)
        if (event.team_registrations && event.team_registrations.length > 0) {
            const alreadyRegistered = event.team_registrations.some(reg => 
                reg.team_id.toString() === teamId.toString()
            );
            
            if (alreadyRegistered) {
                return res.status(400).json({
                    success: false,
                    message: `This team is already registered for this event.`
                });
            }
        }
        
        // Register the team for the event
        const registerData = {
            team_id: teamId,
            manager_id: managerId,
            notes: notes,
            status: 'pending', // Requires organizer approval
            registration_date: new Date()
        };
        
        console.log('Calling registerTeamForEvent with data:', registerData);
        await Event.registerTeamForEvent(eventId, registerData);
        
        return res.json({
            success: true,
            message: 'Registration submitted successfully! Waiting for organizer approval.'
        });
    } catch (error) {
        console.error('Error registering for event:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'An unexpected error occurred while registering for the event'
        });
    }
});

// My Team route - simplified for reliability
router.get('/my-team', (req, res) => {
    try {
        console.log('DEBUGGING: Accessing my-team route, path from request:', req.path);
        
        // Sample team data that will definitely work
        const sampleTeams = [{
            id: 1,
            name: 'Blazing Hawks',
            sport: 'Basketball',
            status: 'Active',
            player_count: 11,
            members: 12,
            players: [
                {
                    id: 1,
                    name: 'John Smith',
                    position: 'Point Guard'
                },
                {
                    id: 2,
                    name: 'Michael Johnson',
                    position: 'Center'
                },
                {
                    id: 3,
                    name: 'David Miller',
                    position: 'Shooting Guard'
                }
            ]
        }];
        
        // Simplified version - don't rely on database calls that might fail
        res.render('manager/my-team', {
            title: 'My Team',
            user: req.session.user,
            teams: sampleTeams,
            pendingRequestCount: 0,
            layout: 'layouts/dashboard',
            path: '/manager/my-team'
        });
    } catch (err) {
        console.error('Error loading my team page:', err);
        res.status(500).render('error', {
            message: 'Failed to load team data',
            error: err
        });
    }
});

// Add my-events route
router.get('/my-events', async (req, res) => {
    try {
        console.log('Accessing my-events route with user ID:', req.session.user._id);
        const managerId = req.session.user._id;
        
        // Get manager's teams
        const Team = require('../models/team');
        const teams = await Team.getTeamsByManager(managerId);
        console.log(`Found ${teams.length} teams for manager`);
        
        // Create an array of team IDs for lookup
        const teamIds = teams.map(team => team._id.toString());
        
        // Get all events
        const Event = require('../models/event');
        const allEvents = await Event.getAllEvents();
        console.log(`Retrieved ${allEvents.length} events total`);
        
        // Filter events that have registrations for this manager's teams
        const registeredEvents = [];
        
        console.log('Manager team IDs:', teamIds);
        
        for (const event of allEvents) {
            if (!event.team_registrations) continue;
            
            // Debug logging
            if (event.team_registrations.length > 0) {
                console.log(`Event "${event.title}" has ${event.team_registrations.length} registrations:`);
                event.team_registrations.forEach(reg => {
                    console.log(`  - Team ID: ${reg.team_id}, Status: ${reg.status}`);
                });
            }
            
            const teamRegistrations = event.team_registrations.filter(reg => 
                teamIds.includes(reg.team_id.toString())
            );
            
            console.log(`Found ${teamRegistrations.length} matching registrations for manager's teams`);
            
            if (teamRegistrations.length > 0) {
                // For each team registered to this event, add it to our list
                for (const reg of teamRegistrations) {
                    const team = teams.find(t => t._id.toString() === reg.team_id.toString());
                    if (!team) continue;
                    
                    registeredEvents.push({
                        event_id: event._id,
                        event_name: event.title,
                        event_date: new Date(event.event_date).toLocaleDateString(),
                        start_date: event.event_date,
                        event_location: event.location,
                        location: event.location,
                        sport_type: event.sport_type,
                        sport: event.sport_type,
                        event_status: event.status,
                        team_id: reg.team_id,
                        team_name: team.name,
                        registration_status: reg.status,
                        registration_date: new Date(reg.registration_date).toLocaleDateString()
                    });
                }
            }
        }
        
        console.log(`Found ${registeredEvents.length} registered events for manager's teams`);
        
        // Split into upcoming and past events based on event date
        const upcomingEvents = registeredEvents.filter(e => 
            e.event_status === 'upcoming' || e.event_status === 'draft'
        );
        
        const pastEvents = registeredEvents.filter(e => 
            e.event_status === 'completed' || e.event_status === 'cancelled'
        );
        
        console.log(`Found ${upcomingEvents.length} upcoming events and ${pastEvents.length} past events`);
        
        res.json({
            success: true,
            events: registeredEvents, // Combined list for compatibility
            upcomingEvents,
            pastEvents,
            message: req.session.message || null
        });
        
        // Clear flash message
        delete req.session.message;
    } catch (err) {
        console.error('Error in my-events route:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to load your registered events. Please try again later.',
            error: err.message
        });
    }
});

// Add event details route
router.get('/event/:id/details', async (req, res) => {
    try {
        const eventId = req.params.id;
        console.log('=== EVENT DETAILS REQUEST ===');
        console.log('Event ID:', eventId);
        console.log('User:', req.session.user);
        
        if (!req.session.user || !req.session.user._id) {
            console.error('No user ID found in session');
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Get event from database
        const event = await Event.getEventById(eventId);
        console.log('Retrieved event:', event ? 'Found' : 'Not found');
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        
        console.log('Event details:', JSON.stringify(event, null, 2));
        
        // Format the event data for the template
        const formattedEvent = {
            id: event._id,
            name: event.title,
            date: event.event_date,
            time: event.event_time,
            location: event.location,
            sport: event.sport_type,
            status: event.status,
            description: event.description,
            registration_deadline: event.registration_deadline,
            max_teams: event.max_teams,
            entry_fee: event.entry_fee,
            organizer: event.organizer_first_name && event.organizer_last_name ? 
                `${event.organizer_first_name} ${event.organizer_last_name}` : 
                (event.organization_name || 'Unknown Organizer')
        };
        
        // Get teams managed by this manager for registration
        const teams = await Team.getTeamsByManager(req.session.user._id);
        
        // Add team registration details (per-team status, not global)
        formattedEvent.teamRegistrations = event.team_registrations || [];
    
        res.json({
            success: true,
            event: formattedEvent,
            teams: teams || [],
            message: req.session.message
        });
        
        // Clear flash message
        delete req.session.message;
    } catch (err) {
        console.error('Error fetching event details:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve event details: ' + err.message
        });
    }
});

// Add Player page
router.get('/team/:id/members/add', (req, res) => {
    const teamId = req.params.id;
    console.log('Adding player to team:', teamId);
    
    // Sample team data
    const team = {
        id: teamId,
        name: 'Blazing Hawks',
        sport: 'Basketball'
    };
    
    // Sample available players
    const availablePlayers = [
        { id: 4, name: 'James Wilson', position: 'Forward' },
        { id: 5, name: 'Robert Brown', position: 'Center' },
        { id: 6, name: 'Thomas Davis', position: 'Guard' }
    ];
    
    res.render('manager/add-player', {
        title: 'Add Player to Team',
        user: req.session.user,
        team: team,
        availablePlayers: availablePlayers,
        layout: 'layouts/dashboard',
        path: '/manager/my-team'
    });
});

// Remove Player form submission
router.post('/team/:teamId/remove-player/:playerId', (req, res) => {
    const teamId = req.params.teamId;
    const playerId = req.params.playerId;
    console.log(`Removing player ${playerId} from team ${teamId}`);
    
    // In a real app, you'd remove the player from the database
    // For demo, just redirect back to team page
    res.redirect('/manager/my-team');
});

// View Player page
router.get('/player/:id', (req, res) => {
    const playerId = req.params.id;
    console.log('Viewing player:', playerId);
    
    // Sample player data
    const player = {
        id: playerId,
        name: playerId == 1 ? 'John Smith' : playerId == 2 ? 'Michael Johnson' : 'David Miller',
        position: playerId == 1 ? 'Point Guard' : playerId == 2 ? 'Center' : 'Shooting Guard',
        stats: {
            points: 154,
            assists: 52,
            rebounds: 38
        },
        bio: 'Experienced player with 5 years of competitive basketball.',
        team: 'Blazing Hawks'
    };
    
    res.render('manager/player-details', {
        title: 'Player Details',
        user: req.session.user,
        player: player,
        layout: 'layouts/dashboard',
        path: '/manager/my-team'
    });
});

// Edit Player page
router.get('/player/:id/edit', (req, res) => {
    const playerId = req.params.id;
    console.log('Editing player:', playerId);
    
    // Sample player data
    const player = {
        id: playerId,
        name: playerId == 1 ? 'John Smith' : playerId == 2 ? 'Michael Johnson' : 'David Miller',
        position: playerId == 1 ? 'Point Guard' : playerId == 2 ? 'Center' : 'Shooting Guard',
        email: 'player@example.com',
        phone: '123-456-7890',
        team: 'Blazing Hawks'
    };
    
    res.render('manager/edit-player', {
        title: 'Edit Player',
        user: req.session.user,
        player: player,
        layout: 'layouts/dashboard',
        path: '/manager/my-team'
    });
});

// Withdraw from event form submission
router.post('/event/:id/withdraw', async (req, res) => {
    try {
        const eventId = req.params.id;
        const teamId = req.body.teamId; // Get the teamId from the form
        
        console.log(`WITHDRAW REQUEST: Event ${eventId}, Team ${teamId}`);
        
        // Get the manager's ID from session
        const managerId = req.session.user._id;
        
        // Load the event and team models
        const Event = require('../models/event');
        const Team = require('../models/team');
        
        // Get the event details first
        console.log(`Looking up event details for ID: ${eventId}`);
        const event = await Event.getEventById(eventId);
        
        if (!event) {
            console.log('Event not found for withdrawal');
            req.session.message = {
                type: 'danger',
                text: 'Event not found'
            };
            return res.redirect('/manager/my-events');
        }
        
        console.log(`Found event "${event.title}" with ${event.team_registrations ? event.team_registrations.length : 0} registrations`);
        
        // Get the team if teamId is provided directly
        let teamName = '';
        let registeredTeamId = teamId;
        
        // If teamId wasn't provided, try to find it from the manager's teams
        if (!registeredTeamId) {
            // Get the manager's teams
            const teams = await Team.getTeamsByManager(managerId);
            
            if (!teams || teams.length === 0) {
                console.log('Manager has no teams to withdraw');
                req.session.message = {
                    type: 'warning',
                    text: 'You don\'t have any teams'
                };
                return res.redirect('/manager/my-events');
            }
            
            console.log(`Manager has ${teams.length} teams that could be registered`);
            
            // Get the list of team IDs for this manager
            const teamIds = teams.map(team => team._id.toString());
            
            // Find which team is registered for this event
            if (event.team_registrations && event.team_registrations.length > 0) {
                for (const reg of event.team_registrations) {
                    const regTeamId = reg.team_id.toString();
                    console.log(`Checking registration for team ${regTeamId}`);
                    
                    if (teamIds.includes(regTeamId)) {
                        registeredTeamId = regTeamId;
                        const team = teams.find(t => t._id.toString() === regTeamId);
                        if (team) teamName = team.name;
                        console.log(`Found registered team: ${teamName} (${registeredTeamId})`);
                        break;
                    }
                }
            }
        } else {
            // Verify the team belongs to this manager
            const team = await Team.getTeamById(registeredTeamId);
            if (team && team.manager_id.toString() === managerId.toString()) {
                teamName = team.name;
                console.log(`Using provided team: ${teamName} (${registeredTeamId})`);
            } else {
                console.log('Team not found or not owned by this manager');
                req.session.message = {
                    type: 'danger',
                    text: 'Invalid team or not authorized'
                };
                return res.redirect('/manager/my-events');
            }
        }
        
        if (!registeredTeamId) {
            console.log('No registrations found for this manager\'s teams');
            req.session.message = {
                type: 'warning',
                text: 'You don\'t have any teams registered for this event'
            };
            return res.redirect('/manager/my-events');
        }
        
        // Now perform the withdrawal
        console.log(`Now withdrawing team ${registeredTeamId} (${teamName}) from event ${eventId}`);
        
        await Event.withdrawTeamFromEvent(eventId, registeredTeamId);
        
        console.log('Withdrawal completed successfully');
        
        return res.json({
            success: true,
            message: `Successfully withdrew ${teamName} from the event.`
        });
    } catch (error) {
        console.error('ERROR during withdrawal process:', error);
        
        return res.status(500).json({
            success: false,
            message: `An error occurred during withdrawal: ${error.message}`
        });
    }
});

// Create placeholder EJS files for missing pages
router.get('/create-team', (req, res) => {
    res.render('manager/create-team', {
        title: 'Create Team',
        user: req.session.user,
        layout: 'layouts/dashboard',
        path: '/manager/my-team'
    });
});

router.get('/join-requests', (req, res) => {
    const pendingRequests = [
        { id: 1, name: 'Alex Johnson', position: 'Forward', experience: '3 years' },
        { id: 2, name: 'Sarah Miller', position: 'Guard', experience: '5 years' },
        { id: 3, name: 'Chris Davis', position: 'Center', experience: '2 years' }
    ];
    
    res.render('manager/join-requests', {
        title: 'Join Requests',
        user: req.session.user,
        pendingRequests: pendingRequests,
        layout: 'layouts/dashboard',
        path: '/manager/my-team'
    });
});

// Teams management routes
router.get('/teams', async (req, res) => {
    try {
        const teams = await Team.getTeamsByManager(req.session.user._id);
        
        res.render('manager/teams', {
            title: 'My Teams',
            user: req.session.user,
            teams: teams,
            messages: req.session.flashMessage || {},
            layout: 'layouts/dashboard',
            path: '/manager/teams'
        });
        
        // Clear flash messages
        delete req.session.flashMessage;
    } catch (err) {
        console.error('Error loading teams page:', err);
        res.status(500).render('error', {
            message: 'Failed to load teams',
            error: err
        });
    }
});

// Create new team form
router.get('/teams/new', (req, res) => {
    res.render('manager/team-create', {
        title: 'Create Team',
        user: req.session.user,
        messages: req.session.flashMessage || {},
        layout: 'layouts/dashboard',
        path: '/manager/teams'
    });
    
    // Clear flash messages
    delete req.session.flashMessage;
});

// Create new team
router.post('/teams/new', teamController.createTeam);

// View single team
router.get('/teams/:id', async (req, res) => {
    try {
        const team = await Team.getTeamById(req.params.id);
        
        if (!team) {
            req.session.flashMessage = {
                type: 'error',
                text: 'Team not found'
            };
            return res.redirect('/manager/teams');
        }
        
        // Verify ownership
        if (team.manager_id.toString() !== req.session.user._id.toString()) {
            req.session.flashMessage = {
                type: 'error',
                text: 'You do not have permission to view this team'
            };
            return res.redirect('/manager/teams');
        }
        
        res.render('manager/team-details', {
            title: team.name,
            user: req.session.user,
            team: team,
            messages: req.session.flashMessage || {},
            layout: 'layouts/dashboard',
            path: '/manager/teams'
        });
        
        // Clear flash messages
        delete req.session.flashMessage;
    } catch (err) {
        console.error('Error loading team details:', err);
        req.session.flashMessage = {
            type: 'error',
            text: 'Error loading team details'
        };
        res.redirect('/manager/teams');
    }
});

// Edit team form
router.get('/teams/:id/edit', async (req, res) => {
    try {
        const team = await Team.getTeamById(req.params.id);
        
        if (!team) {
            req.session.flashMessage = {
                type: 'error',
                text: 'Team not found'
            };
            return res.redirect('/manager/teams');
        }
        
        // Verify ownership
        if (team.manager_id.toString() !== req.session.user._id.toString()) {
            req.session.flashMessage = {
                type: 'error',
                text: 'You do not have permission to edit this team'
            };
            return res.redirect('/manager/teams');
        }
        
        res.render('manager/team-edit', {
            title: `Edit ${team.name}`,
            user: req.session.user,
            team: team,
            messages: req.session.flashMessage || {},
            layout: 'layouts/dashboard',
            path: '/manager/teams'
        });
        
        // Clear flash messages
        delete req.session.flashMessage;
    } catch (err) {
        console.error('Error loading team edit form:', err);
        req.session.flashMessage = {
            type: 'error',
            text: 'Error loading team edit form'
        };
        res.redirect('/manager/teams');
    }
});

// Update team
router.post('/teams/:id/edit', teamController.updateTeam);

// Delete team
router.post('/teams/:id/delete', teamController.deleteTeam);

// View team join requests
router.get('/teams/:id/requests', async (req, res) => {
    try {
        const team = await Team.getTeamById(req.params.id);
        
        if (!team) {
            req.session.flashMessage = {
                type: 'error',
                text: 'Team not found'
            };
            return res.redirect('/manager/teams');
        }
        
        // Verify ownership
        if (team.manager_id.toString() !== req.session.user._id.toString()) {
            req.session.flashMessage = {
                type: 'error',
                text: 'You do not have permission to manage this team'
            };
            return res.redirect('/manager/teams');
        }
        
        // Get join requests with user details
        const pendingRequests = team.join_requests.filter(req => req.status === 'pending');
        
        // Get player details for each request
        const requestsWithPlayerDetails = [];
        for (const request of pendingRequests) {
            try {
                const player = await User.getUserById(request.player_id);
                if (player) {
                    requestsWithPlayerDetails.push({
                        ...request.toObject(),
                        player_name: `${player.first_name} ${player.last_name}`,
                        player_email: player.email
                    });
                }
            } catch (err) {
                console.error('Error fetching player details:', err);
            }
        }
        
        res.render('manager/team-requests', {
            title: `${team.name} - Join Requests`,
            user: req.session.user,
            team: team,
            requests: requestsWithPlayerDetails,
            messages: req.session.flashMessage || {},
            layout: 'layouts/dashboard',
            path: '/manager/teams'
        });
        
        // Clear flash messages
        delete req.session.flashMessage;
    } catch (err) {
        console.error('Error loading team join requests:', err);
        req.session.flashMessage = {
            type: 'error',
            text: 'Error loading team join requests'
        };
        res.redirect('/manager/teams');
    }
});

// Process join request
router.post('/teams/:id/requests/:playerId', async (req, res) => {
    try {
        const teamId = req.params.id;
        const playerId = req.params.playerId;
        const status = req.body.status;
        
        if (!status || (status !== 'approved' && status !== 'rejected')) {
            req.session.flashMessage = {
                type: 'error',
                text: 'Invalid status provided'
            };
            return res.redirect(`/manager/teams/${teamId}/requests`);
        }
        
        await Team.updateJoinRequest(teamId, playerId, status);
        
        req.session.flashMessage = {
            type: 'success',
            text: `Request ${status} successfully`
        };
        
        res.redirect(`/manager/teams/${teamId}/requests`);
    } catch (err) {
        console.error('Error processing join request:', err);
        req.session.flashMessage = {
            type: 'error',
            text: 'Error processing join request'
        };
        res.redirect(`/manager/teams/${req.params.id}/requests`);
    }
});

// Add player to team
router.post('/teams/:id/add-player', async (req, res) => {
    try {
        const teamId = req.params.id;
        const email = req.body.email;
        
        if (!email) {
            req.session.flashMessage = {
                type: 'error',
                text: 'Email is required'
            };
            return res.redirect(`/manager/teams/${teamId}`);
        }
        
        // Find user by email
        const player = await User.getUserByEmail(email);
        
        if (!player) {
            req.session.flashMessage = {
                type: 'error',
                text: 'User not found with that email'
            };
            return res.redirect(`/manager/teams/${teamId}`);
        }
        
        // Check if user is a player
        if (player.role !== 'player') {
            req.session.flashMessage = {
                type: 'error',
                text: 'The user is not registered as a player'
            };
            return res.redirect(`/manager/teams/${teamId}`);
        }
        
        // Add player to team
        await Team.addPlayerToTeam(teamId, player._id);
        
        req.session.flashMessage = {
            type: 'success',
            text: `${player.first_name} ${player.last_name} has been added to the team`
        };
        
        res.redirect(`/manager/teams/${teamId}`);
    } catch (err) {
        console.error('Error adding player to team:', err);
        req.session.flashMessage = {
            type: 'error',
            text: 'Error adding player to team'
        };
        res.redirect(`/manager/teams/${req.params.id}`);
    }
});

// Remove player from team
router.post('/teams/:id/remove-player/:playerId', async (req, res) => {
    try {
        const teamId = req.params.id;
        const playerId = req.params.playerId;
        
        await Team.removePlayerFromTeam(teamId, playerId);
        
        req.session.flashMessage = {
            type: 'success',
            text: 'Player removed from team'
        };
        
        res.redirect(`/manager/teams/${teamId}`);
    } catch (err) {
        console.error('Error removing player from team:', err);
        req.session.flashMessage = {
            type: 'error',
            text: 'Error removing player from team'
        };
        res.redirect(`/manager/teams/${req.params.id}`);
    }
});

// Team management - View team details, members, join requests
router.get('/team/:id/manage', async (req, res) => {
    try {
        const teamId = req.params.id;
        const managerId = req.session.user._id;
        
        // Get team details
        const team = await Team.getTeamById(teamId);
        
        // Verify this manager owns the team
        if (!team || team.manager_id.toString() !== managerId.toString()) {
            req.session.flashMessage = {
                type: 'error',
                text: 'You do not have permission to manage this team'
            };
            return res.redirect('/manager/my-teams');
        }
        
        // Get team members with user details
        const members = await Team.getTeamMembers(teamId);
        
        // Get full player profiles for team members
        const memberProfiles = [];
        for (const member of members) {
            try {
                // Get additional profile information for each player
                const user = await User.findById(member.player_id)
                    .select('first_name last_name email phone age address bio preferred_sports photo_url')
                    .exec();
                
                if (user) {
                    memberProfiles.push({
                        ...member,
                        player_id: member.player_id,
                        first_name: user.first_name || member.first_name,
                        last_name: user.last_name || member.last_name,
                        email: user.email || member.email,
                        phone: user.phone || 'Not provided',
                        age: user.age || 'Not provided',
                        address: user.address || 'Not provided',
                        bio: user.bio || 'No bio available',
                        preferred_sports: user.preferred_sports || [],
                        photo_url: user.photo_url || '/images/default-avatar.png',
                        joined_date: member.joined_date,
                        status: member.status
                    });
                } else {
                    memberProfiles.push(member);
                }
            } catch (err) {
                console.error(`Error fetching profile for player ${member.player_id}:`, err);
                memberProfiles.push(member);
            }
        }
        
        // Get pending join requests
        const joinRequests = await Team.getTeamJoinRequests(teamId);
        const pendingRequests = joinRequests.filter(req => req.status === 'pending');
        
        // Render team management page
        res.render('manager/manage-team', {
            title: `Manage Team: ${team.name}`,
            user: req.session.user,
            team: team,
            members: memberProfiles,
            joinRequests: pendingRequests,
            messages: req.session.flashMessage || {},
            layout: 'layouts/sidebar-dashboard',
            path: '/manager/team-manage'
        });
        
        // Clear flash messages
        delete req.session.flashMessage;
    } catch (err) {
        console.error('Error loading team management page:', err);
        req.session.flashMessage = {
            type: 'error',
            text: 'Error loading team management page'
        };
        res.redirect('/manager/my-teams');
    }
});

// Handle join request (approve/reject)
router.post('/team/:id/handle-request', async (req, res) => {
    try {
        const teamId = req.params.id;
        const playerId = req.body.playerId;
        const action = req.body.action; // 'approve' or 'reject'
        const managerId = req.session.user._id;
        
        // Verify this is a valid action
        if (action !== 'approve' && action !== 'reject') {
            req.session.flashMessage = {
                type: 'error',
                text: 'Invalid action. Must be approve or reject.'
            };
            return res.redirect(`/manager/team/${teamId}/manage`);
        }
        
        // Get team to verify ownership
        const team = await Team.getTeamById(teamId);
        
        // Verify this manager owns the team
        if (!team || team.manager_id.toString() !== managerId.toString()) {
            req.session.flashMessage = {
                type: 'error',
                text: 'You do not have permission to manage this team'
            };
            return res.redirect('/manager/my-teams');
        }
        
        // Handle the request
        await Team.handleJoinRequest(teamId, playerId, action);
        
        req.session.flashMessage = {
            type: 'success',
            text: `Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`
        };
        
        res.redirect(`/manager/team/${teamId}/manage`);
    } catch (err) {
        console.error('Error handling join request:', err);
        req.session.flashMessage = {
            type: 'error',
            text: `Error handling request: ${err.message}`
        };
        res.redirect(`/manager/team/${req.params.id}/manage`);
    }
});

// Remove member from team
router.post('/team/:id/remove-member', async (req, res) => {
    try {
        const teamId = req.params.id;
        const playerId = req.body.playerId;
        const managerId = req.session.user._id;
        
        console.log(`Processing request to remove player ${playerId} from team ${teamId}`);
        
        if (!playerId) {
            req.session.messages = {
                error: 'Player ID is required'
            };
            return res.redirect(`/manager/team/${teamId}/manage`);
        }
        
        // Get team to verify ownership
        const team = await Team.getTeamById(teamId);
        
        // Verify this manager owns the team
        if (!team || team.manager_id.toString() !== managerId.toString()) {
            req.session.messages = {
                error: 'You do not have permission to manage this team'
            };
            return res.redirect('/manager/my-teams');
        }
        
        // Store team name before removing player for use in notification
        const teamName = team.name;
        
        // Get player info before removing them
        let playerName = "Player";
        try {
            const user = await User.getUserById(playerId);
            if (user) {
                playerName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                if (!playerName) playerName = user.email || "Player";
            }
        } catch (err) {
            console.error("Error getting player details:", err);
        }
        
        console.log(`Removing ${playerName} (${playerId}) from team ${teamName}`);
        
        // Remove player from team
        const result = await Team.removePlayerFromTeam(teamId, playerId);
        
        if (!result) {
            throw new Error("Failed to remove player from team");
        }
        
        // Try to find the player's session and add a notification
        try {
            const mongoose = require('mongoose');
            const sessionCollection = mongoose.connection.collection('sessions');
            const sessions = await sessionCollection.find({}).toArray();
            
            for (const session of sessions) {
                try {
                    // Parse session data
                    const sessionData = JSON.parse(session.session);
                    if (sessionData.user && sessionData.user._id === playerId) {
                        // Add notification to player's session
                        sessionData.flashMessage = {
                            type: 'info',
                            text: `You have been removed from the team: ${teamName}`
                        };
                        
                        // Update session in database
                        await sessionCollection.updateOne(
                            { _id: session._id },
                            { $set: { session: JSON.stringify(sessionData) } }
                        );
                        
                        console.log(`Updated session for player ${playerId} with removal notification`);
                        break;
                    }
                } catch (err) {
                    console.error("Error updating player session:", err);
                    // Continue with next session
                }
            }
        } catch (err) {
            console.error("Error notifying player:", err);
            // Continue even if notification fails
        }
        
        req.session.messages = {
            success: `${playerName} has been removed from ${teamName}`
        };
        
        return res.redirect(`/manager/team/${teamId}/manage`);
    } catch (err) {
        console.error('Error removing team member:', err);
        req.session.messages = {
            error: `Error removing team member: ${err.message}`
        };
        return res.redirect(`/manager/team/${req.params.id}/manage`);
    }
});

// ==================== MATCH MANAGEMENT ROUTES ====================

/**
 * Record a match result
 * POST /manager/team/:teamId/match/record
 */
router.post('/team/:teamId/match/record', async (req, res) => {
    try {
        const { teamId } = req.params;
        const managerId = req.session.user._id;
        const { team_a, team_b, team_a_name, team_b_name, score_a, score_b, match_date, match_type, event_id, venue, notes } = req.body;
        
        // Verify manager owns the team
        const team = await Team.getTeamById(teamId);
        if (team.manager_id.toString() !== managerId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to record matches for this team'
            });
        }
        
        // Build match data
        const Match = require('../models/match');
        const matchData = {
            team_a,
            team_b,
            team_a_name,
            team_b_name,
            score_a: parseInt(score_a),
            score_b: parseInt(score_b),
            match_date: new Date(match_date),
            match_type: match_type || 'friendly',
            event_id: event_id || null,
            venue: venue || '',
            notes: notes || '',
            recorded_by: managerId,
            status: 'pending'
        };
        
        // Auto-verify friendly matches
        if (match_type === 'friendly') {
            matchData.status = 'verified';
            matchData.verified_by = managerId;
            matchData.verified_at = new Date();
        }
        
        const match = await Match.createMatch(matchData);
        
        // If friendly match (auto-verified), update stats immediately
        if (matchData.status === 'verified') {
            await Match.updateTeamStats(match);
        }
        
        const message = match_type === 'friendly' 
            ? 'Match recorded successfully' 
            : 'Match submitted for organizer verification';
        
        res.json({
            success: true,
            message,
            match
        });
    } catch (err) {
        console.error('Error recording match:', err);
        res.status(500).json({
            success: false,
            message: 'Error recording match',
            error: err.message
        });
    }
});

/**
 * Get all matches for a team
 * GET /manager/team/:teamId/matches
 */
router.get('/team/:teamId/matches', async (req, res) => {
    try {
        const { teamId } = req.params;
        const managerId = req.session.user._id;
        
        // Verify manager owns the team
        const team = await Team.getTeamById(teamId);
        if (team.manager_id.toString() !== managerId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view matches for this team'
            });
        }
        
        const Match = require('../models/match');
        const matches = await Match.getMatchesByTeam(teamId);
        
        res.json({
            success: true,
            matches
        });
    } catch (err) {
        console.error('Error fetching team matches:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching team matches',
            error: err.message
        });
    }
});

/**
 * Update a match
 * PUT /manager/team/:teamId/match/:matchId
 */
router.put('/team/:teamId/match/:matchId', async (req, res) => {
    try {
        const { teamId, matchId } = req.params;
        const managerId = req.session.user._id;
        const { score_a, score_b } = req.body;
        
        // Verify manager owns the team
        const team = await Team.getTeamById(teamId);
        if (team.manager_id.toString() !== managerId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to update matches for this team'
            });
        }
        
        const Match = require('../models/match');
        const match = await Match.getMatchById(matchId);
        
        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }
        
        // Can only edit pending or disputed matches
        if (match.status !== 'pending' && match.status !== 'disputed') {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit verified matches'
            });
        }
        
        const updated = await Match.updateMatchResult(matchId, parseInt(score_a), parseInt(score_b));
        
        res.json({
            success: true,
            message: 'Match updated successfully',
            match: updated
        });
    } catch (err) {
        console.error('Error updating match:', err);
        res.status(500).json({
            success: false,
            message: 'Error updating match',
            error: err.message
        });
    }
});

/**
 * Delete a match
 * DELETE /manager/team/:teamId/match/:matchId
 */
router.delete('/team/:teamId/match/:matchId', async (req, res) => {
    try {
        const { teamId, matchId } = req.params;
        const managerId = req.session.user._id;
        
        // Verify manager owns the team
        const team = await Team.getTeamById(teamId);
        if (team.manager_id.toString() !== managerId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to delete matches for this team'
            });
        }
        
        const MatchModel = require('../models/schemas/matchSchema');
        const match = await MatchModel.findById(matchId);
        
        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }
        
        // Can only delete pending matches
        if (match.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete verified matches'
            });
        }
        
        await MatchModel.findByIdAndDelete(matchId);
        
        res.json({
            success: true,
            message: 'Match deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting match:', err);
        res.status(500).json({
            success: false,
            message: 'Error deleting match',
            error: err.message
        });
    }
});

/**
 * Get team analytics
 * GET /manager/team/:teamId/analytics
 */
router.get('/team/:teamId/analytics', async (req, res) => {
    try {
        const { teamId } = req.params;
        const managerId = req.session.user._id;
        
        // Verify manager owns the team
        const team = await Team.getTeamById(teamId);
        if (team.manager_id.toString() !== managerId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view analytics for this team'
            });
        }
        
        const Match = require('../models/match');
        const matches = await Match.getMatchesByTeam(teamId);
        
        const total_matches = matches.length;
        const wins = team.wins || 0;
        const losses = team.losses || 0;
        const draws = team.draws || 0;
        const win_rate = total_matches > 0 ? ((wins / total_matches) * 100).toFixed(1) : 0;
        
        // Calculate recent form (last 5 matches)
        const recent_form = [];
        const recentMatches = matches.slice(0, 5);
        
        recentMatches.forEach(match => {
            const isTeamA = match.team_a._id.toString() === teamId.toString();
            let result;
            
            if (isTeamA) {
                if (match.score_a > match.score_b) result = 'W';
                else if (match.score_a < match.score_b) result = 'L';
                else result = 'D';
            } else {
                if (match.score_b > match.score_a) result = 'W';
                else if (match.score_b < match.score_a) result = 'L';
                else result = 'D';
            }
            
            recent_form.push(result);
        });
        
        const analytics = {
            total_matches,
            wins,
            losses,
            draws,
            win_rate,
            recent_form
        };
        
        res.json({
            success: true,
            analytics,
            team: {
                id: team._id,
                name: team.name,
                sport_type: team.sport_type
            }
        });
    } catch (err) {
        console.error('Error fetching team analytics:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching team analytics',
            error: err.message
        });
    }
});

/**
 * Get scheduled matches for a team
 * GET /manager/team/:teamId/scheduled-matches
 */
router.get('/team/:teamId/scheduled-matches', async (req, res) => {
    try {
        const { teamId } = req.params;
        const managerId = req.session.user._id;
        
        // Verify manager owns the team
        const Team = require('../models/team');
        const team = await Team.getTeamById(teamId);
        
        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }
        
        if (team.manager_id.toString() !== managerId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to view matches for this team'
            });
        }
        
        const Match = require('../models/match');
        const mongoose = require('mongoose');
        
        // Find all scheduled matches for this team
        const matches = await Match.find({
            $or: [
                { team_a: mongoose.Types.ObjectId(teamId) },
                { team_b: mongoose.Types.ObjectId(teamId) }
            ],
            status: 'scheduled'
        })
        .populate('team_a', 'name')
        .populate('team_b', 'name')
        .populate('event_id', 'title')
        .sort({ match_date: 1 })
        .exec();
        
        res.json({
            success: true,
            matches
        });
    } catch (err) {
        console.error('Error fetching scheduled matches:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching scheduled matches',
            error: err.message
        });
    }
});

/**
 * Record match result
 * POST /manager/match/:matchId/record-result
 */
router.post('/match/:matchId/record-result', async (req, res) => {
    try {
        const { matchId } = req.params;
        const { score_a, score_b, notes } = req.body;
        const managerId = req.session.user._id;
        
        const Match = require('../models/match');
        const match = await Match.findById(matchId)
            .populate('team_a', 'manager_id')
            .populate('team_b', 'manager_id')
            .exec();
        
        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }
        
        // Verify manager owns one of the teams
        const isTeamAManager = match.team_a.manager_id.toString() === managerId.toString();
        const isTeamBManager = match.team_b.manager_id.toString() === managerId.toString();
        
        if (!isTeamAManager && !isTeamBManager) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to record results for this match'
            });
        }
        
        // Validate scores
        if (typeof score_a !== 'number' || typeof score_b !== 'number' ||
            score_a < 0 || score_b < 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid score values'
            });
        }
        
        // Update match
        match.score_a = score_a;
        match.score_b = score_b;
        match.status = 'pending'; // Pending organizer verification
        match.recorded_by = managerId;
        match.notes = notes || '';
        
        // Determine winner
        if (score_a > score_b) {
            match.winner = 'team_a';
        } else if (score_b > score_a) {
            match.winner = 'team_b';
        } else {
            match.winner = 'draw';
        }
        
        await match.save();
        
        res.json({
            success: true,
            message: 'Match result recorded successfully. Awaiting organizer verification.',
            match
        });
    } catch (err) {
        console.error('Error recording match result:', err);
        res.status(500).json({
            success: false,
            message: 'Error recording match result',
            error: err.message
        });
    }
});

/**
 * Get matches pending verification for manager's teams
 * GET /manager/pending-matches
 */
router.get('/pending-matches', async (req, res) => {
    try {
        const managerId = req.session.user._id;
        
        // Get manager's teams
        const Team = require('../models/team');
        const teams = await Team.getTeamsByManager(managerId);
        const teamIds = teams.map(team => team._id);
        
        const Match = require('../models/match');
        const mongoose = require('mongoose');
        
        // Find all pending/disputed matches for manager's teams
        const matches = await Match.find({
            $or: [
                { team_a: { $in: teamIds } },
                { team_b: { $in: teamIds } }
            ],
            status: { $in: ['pending', 'disputed'] }
        })
        .populate('team_a', 'name')
        .populate('team_b', 'name')
        .populate('event_id', 'title')
        .populate('verified_by', 'first_name last_name')
        .sort({ match_date: -1 })
        .exec();
        
        res.json({
            success: true,
            matches
        });
    } catch (err) {
        console.error('Error fetching pending matches:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching pending matches',
            error: err.message
        });
    }
});

// ============================================
// MANAGER MATCH ROUTES
// ============================================

// Get all matches for a specific team
router.get('/team/:teamId/matches', async (req, res) => {
    try {
        const { teamId } = req.params;
        const Match = require('../models/match');
        const MatchSchema = require('../models/schemas/matchSchema');
        
        // Verify manager owns this team
        const team = await Team.getTeamById(teamId);
        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }
        
        if (team.manager_id.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view this team\'s matches'
            });
        }
        
        // Get all matches
        const matches = await MatchSchema.find({
            $or: [
                { team_a: teamId },
                { team_b: teamId }
            ]
        })
        .populate('team_a', 'name')
        .populate('team_b', 'name')
        .populate('event_id', 'title location')
        .sort({ match_date: -1 })
        .lean();
        
        res.json({
            success: true,
            matches: matches,
            team: team
        });
        
    } catch (error) {
        console.error('Error fetching team matches:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching matches'
        });
    }
});

// Record a friendly match result
router.post('/team/:teamId/match/record', async (req, res) => {
    try {
        const { teamId } = req.params;
        const {
            opponent_team_id,
            your_score,
            opponent_score,
            match_date,
            match_type,
            venue,
            notes
        } = req.body;
        
        const Match = require('../models/match');
        
        // Verify manager owns team
        const team = await Team.getTeamById(teamId);
        if (!team || team.manager_id.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        // Get opponent team
        const opponentTeam = await Team.getTeamById(opponent_team_id);
        if (!opponentTeam) {
            return res.status(404).json({
                success: false,
                message: 'Opponent team not found'
            });
        }
        
        // Determine winner
        let winner = null;
        if (parseInt(your_score) > parseInt(opponent_score)) {
            winner = 'team_a';
        } else if (parseInt(opponent_score) > parseInt(your_score)) {
            winner = 'team_b';
        } else {
            winner = 'draw';
        }
        
        // Create match
        const matchData = {
            team_a: teamId,
            team_b: opponent_team_id,
            team_a_name: team.name,
            team_b_name: opponentTeam.name,
            score_a: parseInt(your_score),
            score_b: parseInt(opponent_score),
            match_date: new Date(match_date),
            match_type: match_type || 'friendly',
            status: 'pending', // Needs verification
            winner: winner,
            venue: venue,
            notes: notes,
            recorded_by: req.session.user._id,
            event_id: null // Friendly matches have no event
        };
        
        const match = await Match.createMatch(matchData);
        
        res.json({
            success: true,
            message: 'Match recorded successfully. Awaiting verification.',
            match: match
        });
        
    } catch (error) {
        console.error('Error recording match:', error);
        res.status(500).json({
            success: false,
            message: 'Error recording match: ' + error.message
        });
    }
});

// Edit match result (only if pending or disputed)
router.put('/team/:teamId/match/:matchId', async (req, res) => {
    try {
        const { teamId, matchId } = req.params;
        const { your_score, opponent_score, match_date, venue, notes } = req.body;
        
        const Match = require('../models/match');
        const MatchSchema = require('../models/schemas/matchSchema');
        
        // Verify ownership
        const team = await Team.getTeamById(teamId);
        if (!team || team.manager_id.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        // Get match
        const match = await MatchSchema.findById(matchId);
        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }
        
        // Check if editable
        if (!['pending', 'disputed'].includes(match.status)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot edit verified or completed matches'
            });
        }
        
        // Verify this team is in the match
        if (!match.team_a.equals(teamId) && !match.team_b.equals(teamId)) {
            return res.status(403).json({
                success: false,
                message: 'This team is not in this match'
            });
        }
        
        // Update scores (determine which team)
        const isTeamA = match.team_a.equals(teamId);
        match.score_a = isTeamA ? parseInt(your_score) : parseInt(opponent_score);
        match.score_b = isTeamA ? parseInt(opponent_score) : parseInt(your_score);
        match.match_date = match_date ? new Date(match_date) : match.match_date;
        match.venue = venue || match.venue;
        match.notes = notes || match.notes;
        
        // Recalculate winner
        if (match.score_a > match.score_b) {
            match.winner = 'team_a';
        } else if (match.score_b > match.score_a) {
            match.winner = 'team_b';
        } else {
            match.winner = 'draw';
        }
        
        match.updated_at = Date.now();
        await match.save();
        
        res.json({
            success: true,
            message: 'Match updated successfully',
            match: match
        });
        
    } catch (error) {
        console.error('Error updating match:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating match'
        });
    }
});

// Delete match (only if pending)
router.delete('/team/:teamId/match/:matchId', async (req, res) => {
    try {
        const { teamId, matchId } = req.params;
        const MatchSchema = require('../models/schemas/matchSchema');
        
        // Verify ownership
        const team = await Team.getTeamById(teamId);
        if (!team || team.manager_id.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        const match = await MatchSchema.findById(matchId);
        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }
        
        if (match.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Can only delete pending matches'
            });
        }
        
        await MatchSchema.findByIdAndDelete(matchId);
        
        res.json({
            success: true,
            message: 'Match deleted successfully'
        });
        
    } catch (error) {
        console.error('Error deleting match:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting match'
        });
    }
});

// Get team analytics
router.get('/team/:teamId/analytics', async (req, res) => {
    try {
        const { teamId } = req.params;
        const Match = require('../models/match');
        const MatchSchema = require('../models/schemas/matchSchema');
        
        // Verify ownership
        const team = await Team.getTeamById(teamId);
        if (!team || team.manager_id.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        // Get completed matches
        const matches = await MatchSchema.find({
            $or: [{ team_a: teamId }, { team_b: teamId }],
            status: { $in: ['completed', 'verified'] }
        }).lean();
        
        let stats = {
            total_matches: matches.length,
            wins: 0,
            losses: 0,
            draws: 0,
            goals_scored: 0,
            goals_conceded: 0,
            points: 0
        };
        
        matches.forEach(match => {
            const isTeamA = match.team_a.toString() === teamId;
            const yourScore = isTeamA ? match.score_a : match.score_b;
            const oppScore = isTeamA ? match.score_b : match.score_a;
            
            stats.goals_scored += yourScore;
            stats.goals_conceded += oppScore;
            
            if (match.winner === 'draw') {
                stats.draws++;
                stats.points += 1;
            } else if (
                (isTeamA && match.winner === 'team_a') ||
                (!isTeamA && match.winner === 'team_b')
            ) {
                stats.wins++;
                stats.points += 3;
            } else {
                stats.losses++;
            }
        });
        
        stats.goal_difference = stats.goals_scored - stats.goals_conceded;
        stats.win_rate = stats.total_matches > 0 
            ? ((stats.wins / stats.total_matches) * 100).toFixed(1)
            : 0;
        
        res.json({
            success: true,
            analytics: stats
        });
        
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching analytics'
        });
    }
});

module.exports = router; 