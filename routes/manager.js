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
        teams.forEach(team => {
            playerCount += team.members ? team.members.length : 0;
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
            const Event = require('./models/event');
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
        
        res.render('manager/dashboard', { 
            user: req.session.user,
            teams: teams,
            teamCount: teams.length,
            playerCount: playerCount,
            pendingRequestCount: pendingRequestCount,
            registeredEvents: registeredEvents || [],
            upcomingEvent: upcomingEvent,
            recentActivities: recentActivities,
            layout: 'layouts/dashboard',
            path: '/manager' 
        });
    } catch (err) {
        console.error('Error loading manager dashboard:', err);
        res.status(500).render('error', {
            message: 'Failed to load dashboard',
            error: err
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
            layout: 'layouts/dashboard',
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
        
        res.render('manager/my-teams', { 
            title: 'My Teams',
            user: req.session.user,
            teams: teams || [],
            messages: req.session.messages || {},
            layout: 'layouts/dashboard',
            path: '/manager/my-teams'
        });
        
        // Clear flash messages
        delete req.session.messages;
    } catch (err) {
        console.error('Error retrieving manager teams:', err);
        res.status(500).render('error', { 
            message: 'Failed to retrieve your teams', 
            error: err 
        });
    }
});

// Create Team Form
router.get('/create-team', (req, res) => {
    res.render('manager/create-team', { 
        title: 'Create Team',
        user: req.session.user,
        messages: req.session.messages || {},
        layout: 'layouts/dashboard',
        path: '/manager/my-teams'
    });
    
    // Clear flash messages
    delete req.session.messages;
});

// Create Team (Process Form)
router.post('/create-team', async (req, res) => {
    try {
        const { name, sport_type, description, max_members } = req.body;
        
        // Validate required fields
        if (!name || !sport_type) {
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
            req.session.messages = { success: 'Team created successfully!' };
            res.redirect('/manager/my-teams');
        } catch (error) {
            console.error('Error creating team:', error);
            req.session.messages = { error: 'Failed to create team: ' + error.message };
            return res.redirect('/manager/create-team');
        }
    } catch (err) {
        console.error('Error in create-team route:', err);
        req.session.messages = { error: 'An error occurred while creating the team' };
        res.redirect('/manager/create-team');
    }
});

// Manage Team
router.get('/team/:id', async (req, res) => {
    try {
    const teamId = req.params.id;
        const team = await Team.getTeamById(teamId);
        
        // Make sure the manager owns this team
        if (team.manager_id !== req.session.user._id) {
            req.session.messages = { error: 'You do not have permission to manage this team' };
            return res.redirect('/manager/my-teams');
        }
        
        res.render('manager/team-details', { 
            title: team.name,
            user: req.session.user,
            team,
            messages: req.session.messages || {},
            layout: 'layouts/dashboard',
            path: '/manager/my-teams'
        });
        
        // Clear flash messages
        delete req.session.messages;
    } catch (err) {
        console.error('Error retrieving team details:', err);
        req.session.messages = { error: 'Failed to retrieve team details' };
        res.redirect('/manager/my-teams');
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
        
        res.render('manager/join-requests', {
            title: 'Team Join Requests',
            user: req.session.user,
            requests: requests || [],
            messages: req.session.messages || {},
            layout: 'layouts/dashboard',
            path: '/manager/join-requests'
        });
        
        // Clear flash messages
        delete req.session.messages;
    } catch (err) {
        console.error('Error retrieving join requests:', err);
        req.session.messages = { error: 'Failed to retrieve join requests' };
        res.redirect('/manager');
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
            
            res.render('manager/browse-events', {
                title: 'Browse Events',
                user: req.session.user,
                events: formattedEvents,
                pastEvents: registeredEvents || [],
                teams: teams,
                layout: 'layouts/dashboard',
                path: '/manager/browse-events',
                message: message
            });
        } catch (err) {
            console.error('Error fetching event data:', err);
            return res.status(500).render('error', {
                title: '500 - Server Error',
                message: 'An error occurred while fetching event data: ' + err.message,
                layout: 'layouts/main'
            });
        }
    } catch (error) {
        console.error('Error loading browse events page:', error);
        res.status(500).render('error', {
            title: '500 - Server Error',
            message: error.message || 'An error occurred while loading the browse events page.',
            layout: 'layouts/main'
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
        
        // Register the team for the event
        const registerData = {
            team_id: teamId,
            notes: notes,
            status: 'confirmed' // Default to confirmed for manager registrations
        };
        
        console.log('Calling registerTeamForEvent with data:', registerData);
        await Event.registerTeamForEvent(eventId, registerData);
        
        // Set success message and redirect to my events page
        req.session.message = {
            type: 'success',
            text: 'Team successfully registered for the event!'
        };
        
        return res.redirect('/manager/my-events');
    } catch (error) {
        console.error('Error registering for event:', error);
        req.session.message = {
            type: 'danger',
            text: error.message || 'An unexpected error occurred while registering for the event'
        };
        return res.redirect(`/manager/event/${req.params.id}/details`);
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
        
        for (const event of allEvents) {
            if (!event.team_registrations) continue;
            
            const teamRegistrations = event.team_registrations.filter(reg => 
                teamIds.includes(reg.team_id.toString())
            );
            
            if (teamRegistrations.length > 0) {
                // For each team registered to this event, add it to our list
                for (const reg of teamRegistrations) {
                    const team = teams.find(t => t._id.toString() === reg.team_id.toString());
                    if (!team) continue;
                    
                    registeredEvents.push({
                        event_id: event._id,
                        event_name: event.title,
                        event_date: new Date(event.event_date).toLocaleDateString(),
                        event_location: event.location,
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
        
        res.render('manager/my-events', {
            title: 'My Events',
            user: req.session.user,
            upcomingEvents,
            pastEvents,
            message: req.session.message || null,
            layout: 'layouts/dashboard',
            path: '/manager/my-events'
        });
        
        // Clear flash message
        delete req.session.message;
    } catch (err) {
        console.error('Error in my-events route:', err);
        req.session.message = {
            type: 'danger',
            text: 'Failed to load your registered events. Please try again later.'
        };
        res.redirect('/manager');
    }
});

// Add event details route
router.get('/event/:id/details', async (req, res) => {
    try {
        const eventId = req.params.id;
        console.log('Viewing event details for event ID:', eventId);
        
        if (!req.session.user || !req.session.user._id) {
            console.error('No user ID found in session:', req.session);
            return res.status(401).render('error', {
                message: 'User not authenticated',
                error: { status: 401, stack: 'Missing user ID in session' }
            });
        }

        // Get event from database
        const event = await Event.getEventById(eventId);
        
        if (!event) {
            req.session.message = {
                type: 'danger',
                text: 'Event not found'
            };
            return res.redirect('/manager/browse-events');
        }
        
        console.log('Retrieved event details:', event);
        
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
        
        // Check if any teams are already registered for this event
        let isRegistered = false;
        
        if (teams.length > 0 && event.team_registrations && event.team_registrations.length > 0) {
            // Check if any of the manager's teams are in the event's team_registrations
            const teamIds = teams.map(team => team._id.toString());
            isRegistered = event.team_registrations.some(reg => 
                teamIds.includes(reg.team_id.toString())
            );
        }
        
        // Add registration status to the formatted event
        formattedEvent.isRegistered = isRegistered;
    
        res.render('manager/event-details', {
            title: 'Event Details',
            user: req.session.user,
            event: formattedEvent,
            teams: teams || [],
            layout: 'layouts/dashboard',
            path: '/manager/browse-events',
            message: req.session.message
        });
        
        // Clear flash message
        delete req.session.message;
    } catch (err) {
        console.error('Error fetching event details:', err);
        req.session.message = {
            type: 'danger',
            text: 'Failed to retrieve event details: ' + err.message
        };
        res.redirect('/manager/browse-events');
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
        
        // Set success message and redirect
        req.session.message = {
            type: 'success',
            text: `Successfully withdrew ${teamName} from the event.`
        };
        
        return res.redirect('/manager/my-events');
    } catch (error) {
        console.error('ERROR during withdrawal process:', error);
        
        req.session.message = {
            type: 'danger',
            text: `An error occurred during withdrawal: ${error.message}`
        };
        
        return res.redirect('/manager/my-events');
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
            layout: 'layouts/dashboard',
            path: '/manager/my-teams'
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

module.exports = router; 