const express = require('express');
const router = express.Router();
const { Event, Team, User } = require('../models');
const EventSchema = require('../models/schemas/eventSchema');
const TeamSchema = require('../models/schemas/teamSchema');
const PlayerProfile = require('../models/playerProfile');
const Profile = require('../models/profile');
const userController = require('../controllers/userController');
const eventController = require('../controllers/eventController');
const teamController = require('../controllers/teamController');
const playerProfileController = require('../controllers/playerProfileController');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Middleware to check if user is logged in as a player
const isPlayer = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'player') {
        next();
    } else {
        // Return JSON for API calls instead of redirecting
        return res.status(401).json({
            success: false,
            message: 'You must be logged in as a player to access this page'
        });
    }
};

// Apply the isPlayer middleware to all player routes
router.use(isPlayer);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/uploads/profile');
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Use user ID and timestamp to make the filename unique
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'profile-' + req.session.user._id + '-' + uniqueSuffix + extension);
    }
});

// File filter to only allow image files
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({ 
    storage: storage, 
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

// Root route for /player - redirect to dashboard
router.get('/', (req, res) => {
    res.redirect('/player/dashboard');
});

// Player Dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const playerId = req.session.user._id;

        // Get player's team events
        const playerEvents = await Event.getPlayerEventsViaTeams(playerId);
        
        // Get player's teams
        const teams = await Team.getPlayerTeams(playerId);
        
        console.log(`Player dashboard: ${teams.length} teams, ${playerEvents.length} events`);
        
        // Return JSON for API calls
        res.json({
            success: true,
            teamCount: teams.length,
            eventCount: playerEvents.length,
            teams: teams.map(team => ({
                id: team._id,
                name: team.name || 'Unnamed Team',
                sport: team.sport_type || 'General',
                manager_name: team.manager_name || 'Team Manager',
                current_members: team.members ? team.members.length : 0,
                max_members: team.max_members || 20
            })),
            events: playerEvents.map(event => ({
                id: event._id || event.event_id,
                name: event.title || event.name || 'Unnamed Event',
                date: event.event_date || event.date,
                location: event.location || 'TBD',
                sport: event.sport_type || event.sport || 'General'
            }))
        });
    } catch (err) {
        console.error('Error rendering player dashboard:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to load player dashboard',
            error: err.message
        });
    }
});

// My Events (Events a player is registered for)
router.get('/my-events', async (req, res) => {
    try {
        // Get player's team-based events
        const playerId = req.session.user._id;
        const playerEvents = await Event.getPlayerEventsViaTeams(playerId);
        
        console.log(`Player my-events: Found ${playerEvents.length} events`);
        
        // Format events consistently
        const formattedEvents = playerEvents.map(event => ({
            id: event._id || event.event_id,
            name: event.title || event.name || 'Unnamed Event',
            title: event.title || event.name || 'Unnamed Event',
            description: event.description || '',
            date: event.event_date || event.date,
            event_date: event.event_date || event.date,
            location: event.location || 'TBD',
            sport: event.sport_type || event.sport || 'General',
            sport_type: event.sport_type || event.sport || 'General',
            status: event.status || 'upcoming',
            team_name: event.team_name || '',
            team_id: event.team_id || '',
            registration_date: event.registration_date || event.joined_date
        }));
        
        // Return JSON for API calls
        res.json({
            success: true,
            events: formattedEvents
        });
    } catch (err) {
        console.error('Error in my-events route:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve player events',
            error: err.message
        });
    }
});

// Browse Events (Events a player can join)
router.get('/browse-events', async (req, res) => {
    try {
        // Get all upcoming events
        const events = await Event.getAllEvents();
        
        console.log(`Player browse-events: Found ${events.length} total events`);
        
        // Format events for display (don't filter by status on backend, let frontend handle it)
        const formattedEvents = events.map(event => ({
            id: event._id,
            name: event.title || 'Unnamed Event',
            title: event.title || 'Unnamed Event',
            description: event.description || '',
            date: event.event_date,
            event_date: event.event_date,
            location: event.location || 'TBD',
            sport: event.sport_type || 'General',
            sport_type: event.sport_type || 'General',
            status: event.status || 'upcoming',
            registration_deadline: event.registration_deadline,
            max_teams: event.max_teams || 10,
            max_participants: event.max_teams ? event.max_teams * 10 : 100,
            current_participants: event.team_registrations ? event.team_registrations.length : 0,
            organizer: event.organizer_name || `${event.organizer_first_name || ''} ${event.organizer_last_name || ''}`.trim() || 'Unknown',
            team_registrations: event.team_registrations || []
        }));
        
        console.log(`Formatted ${formattedEvents.length} events for player`);
        
        // Return JSON for API calls
        res.json({
            success: true,
            events: formattedEvents
        });
    } catch (err) {
        console.error('Error in browse-events route:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve events',
            error: err.message
        });
    }
});

// Teams routes
router.get('/teams', async (req, res) => {
    try {
        const playerId = req.session.user._id;
        const teams = await Team.getPlayerTeams(playerId);
        
        // Format teams for display
        const formattedTeams = teams.map(team => ({
            id: team._id,
            name: team.name,
            sport: team.sport_type,
            manager_name: team.manager_name || 'Team Manager',
            manager_email: team.manager_email || '',
            current_members: team.members ? team.members.length : 0,
            members: team.max_members || 20,
            status: 'Active',
            role: 'Player',
            team_members: team.members || []
        }));
        
        res.render('player/my-teams', {
            title: 'My Teams',
            user: req.session.user,
            teams: formattedTeams,
            messages: req.session.flashMessage || {},
            layout: 'layouts/sidebar-dashboard',
            path: '/player/my-teams'
        });
        
        // Clear flash messages
        delete req.session.flashMessage;
    } catch (err) {
        console.error('Error fetching player teams:', err);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Failed to retrieve your teams', 
            error: err,
            layout: 'layouts/main'
        });
    }
});

// Add a route for my-teams to fix 404 error
router.get('/my-teams', async (req, res) => {
    try {
        const playerId = req.session.user._id;
        const teams = await Team.getPlayerTeams(playerId);
        
        console.log(`Player my-teams: Found ${teams.length} teams for player ${playerId}`);
        
        // Format teams for display - don't override team_members!
        const formattedTeams = teams.map(team => ({
            id: team._id,
            name: team.name || 'Unnamed Team',
            sport: team.sport_type || 'General',
            sport_type: team.sport_type || 'General',
            manager_name: team.manager_name || 'Team Manager',
            manager_email: team.manager_email || '',
            current_members: team.members ? team.members.length : 0,
            members: team.max_members || 20,
            max_members: team.max_members || 20,
            status: 'Active',
            role: 'Player',
            team_members: team.team_members || [] // Use the populated team_members from the model
        }));
        
        // Return JSON for API calls
        res.json({
            success: true,
            teams: formattedTeams
        });
    } catch (err) {
        console.error('Error fetching player teams:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve your teams',
            error: err.message
        });
    }
});

// Browse all teams
router.get('/browse-teams', async (req, res) => {
    try {
        // Get all active teams
        const teams = await Team.getAllTeams();
        
        const playerId = req.session.user._id;
        
        // Get array of team IDs for membership check
        const teamIds = teams.map(team => team._id.toString());
        
        // Check which teams the player is a member of
        const membershipMap = await Team.isPlayerInTeams(playerId, teamIds);
        
        // Format teams for display, checking actual membership status from database
        const formattedTeams = teams.map(team => ({
            id: team._id,
            name: team.name || 'Unnamed Team',
            sport_type: team.sport_type || 'General',
            sport: team.sport_type || 'General',
            manager_name: team.manager_name || 'Team Manager',
            manager_email: team.manager_email || '',
            current_members: team.members ? team.members.length : 0,
            max_members: team.max_members || 20,
            members: team.max_members || 20,
            description: team.description || '',
            already_joined: membershipMap[team._id.toString()] === true
        }));
        
        console.log(`Player browse-teams: Found ${formattedTeams.length} teams`);
        
        // Return JSON for API calls
        res.json({
            success: true,
            teams: formattedTeams
        });
    } catch (err) {
        console.error('Error fetching teams:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve teams',
            error: err.message
        });
    }
});

// View team details
router.get('/team/:id', async (req, res) => {
    try {
        const teamId = req.params.id;
        const playerId = req.session.user._id;
        
        // Get team details
        const team = await Team.getTeamById(teamId);
        
        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }
        
        // Check if player is already a member
        const isMember = team.members && team.members.some(
            member => member.player_id.toString() === playerId.toString()
        );

        // Check if player has a pending join request
        const hasPendingRequest = team.join_requests && team.join_requests.some(
            request => request.player_id.toString() === playerId.toString() && request.status === 'pending'
        );
        
        // Format team for display
        const formattedTeam = {
            id: team._id,
            name: team.name,
            sport_type: team.sport_type,
            manager_name: team.manager_name || 'Unknown',
            manager_email: team.manager_email || '',
            manager_id: team.manager_id,
            current_members: team.members ? team.members.length : 0,
            max_members: team.max_members || 20,
            wins: team.wins || 0,
            description: team.description || '',
            created_at: team.created_at,
            members: team.members ? team.members.map(member => ({
                player_id: member.player_id,
                first_name: member.first_name || 'Player',
                last_name: member.last_name || '',
                email: member.email || '',
                photo_url: member.photo_url || '',
                joined_date: member.joined_date
            })) : [],
            already_joined: isMember,
            request_status: hasPendingRequest ? 'pending' : null
        };
        
        res.json({
            success: true,
            team: formattedTeam
        });
    } catch (err) {
        console.error('Error fetching team details:', err);
        res.status(500).json({
            success: false,
            message: 'Error loading team details',
            error: err.message
        });
    }
});

// Request to join a team
router.post('/teams/:id/join', async (req, res) => {
    try {
        const teamId = req.params.id;
        const playerId = req.session.user._id;
        
        console.log(`Player ${playerId} requesting to join team ${teamId}`);
        
        await Team.addJoinRequest(teamId, playerId);
        
        res.json({
            success: true,
            message: 'Join request sent successfully!'
        });
    } catch (err) {
        console.error('Error sending join request:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Error sending join request'
        });
    }
});

// Leave a team
router.post('/teams/leave/:id', async (req, res) => {
    try {
        const teamId = req.params.id;
        const playerId = req.session.user._id;
        
        console.log(`Player ${playerId} leaving team ${teamId}`);
        
        await Team.removePlayerFromTeam(teamId, playerId);
        
        res.json({
            success: true,
            message: 'You have left the team successfully'
        });
    } catch (err) {
        console.error('Error leaving team:', err);
        res.status(500).json({
            success: false,
            message: err.message || 'Error leaving team'
        });
    }
});

// Add a GET route for leaving a team to match the href in the template
router.get('/teams/leave/:id', async (req, res) => {
    try {
        const teamId = req.params.id;
        const playerId = req.session.user._id;
        
        // Get team info for the success message
        const team = await Team.getTeamById(teamId);
        const teamName = team ? team.name : 'the team';
        
        // Fully remove the player from the team using removePlayerFromTeam
        await Team.removePlayerFromTeam(teamId, playerId);
        
        // Clear any pending request status for this team in session
        if (req.session.teamRequestStatuses && req.session.teamRequestStatuses[teamId]) {
            delete req.session.teamRequestStatuses[teamId];
        }
        
        // Add flash message to this player's session
        req.session.flashMessage = {
            type: 'success',
            text: `You have successfully left ${teamName}`
        };
        
        // Also notify the team manager about this action
        try {
            const managerId = team.manager_id;
            const mongoose = require('mongoose');
            const sessionCollection = mongoose.connection.collection('sessions');
            
            // Look for manager's session
            const sessions = await sessionCollection.find({}).toArray();
            
            for (const sessionDoc of sessions) {
                try {
                    // Parse the session data
                    let sessionData = JSON.parse(sessionDoc.session);
                    
                    // Check if this session belongs to the manager
                    if (sessionData.user && sessionData.user._id === managerId.toString()) {
                        // Add notification to manager's session
                        sessionData.flashMessage = {
                            type: 'info',
                            text: `${req.session.user.first_name} ${req.session.user.last_name} has left your team: ${teamName}`
                        };
                        
                        // Update the session in the database
                        await sessionCollection.updateOne(
                            { _id: sessionDoc._id },
                            { $set: { session: JSON.stringify(sessionData) } }
                        );
                        
                        console.log(`Updated session for manager ${managerId} with player leaving notification`);
                        break;
                    }
                } catch (parseErr) {
                    console.error('Error parsing session data:', parseErr);
                    // Continue to next session
                }
            }
        } catch (sessionErr) {
            console.error('Unable to notify team manager:', sessionErr);
            // Continue even if manager notification fails
        }
        
        res.redirect('/player/my-teams');
    } catch (err) {
        console.error('Error leaving team:', err);
        req.session.flashMessage = {
            type: 'error',
            text: `Error leaving team: ${err.message}`
        };
        res.redirect('/player/my-teams');
    }
});

// Performance Stats
router.get('/performance', playerProfileController.getPlayerPerformance);

// Profile
router.get('/profile', playerProfileController.renderPlayerProfile);
router.get('/profile/edit', playerProfileController.renderPlayerProfileEdit);
router.post('/profile/update', upload.single('profile_image'), playerProfileController.updatePlayerProfile);

// Update profile (API endpoint for React)
router.put('/profile', upload.single('profile_image'), async (req, res) => {
    try {
        // Check if user session exists
        if (!req.session.user || !req.session.user._id) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        
        const userId = req.session.user._id;
        
        console.log('Player Profile Update - Session User:', req.session.user);
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
        
        console.log('Profile updated successfully:', sessionUser);
        
        // Return success with updated user data
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: sessionUser
        });
    } catch (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({
            success: false,
            message: 'Error updating profile: ' + err.message
        });
    }
});

// View event details
router.get('/event/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        const playerId = req.session.user._id;
        
        // Get event details
        const event = await Event.getEventById(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }
        
        // Get player's teams
        const teams = await Team.getPlayerTeams(playerId);
        
        // Check if player's team is registered
        let isRegistered = false;
        let registeredTeamName = null;
        let registeredDate = null;
        
        if (teams.length > 0 && event.team_registrations && event.team_registrations.length > 0) {
            const teamIds = teams.map(team => team._id.toString());
            
            for (const reg of event.team_registrations) {
                if (teamIds.includes(reg.team_id.toString())) {
                    isRegistered = true;
                    const team = teams.find(team => team._id.toString() === reg.team_id.toString());
                    registeredTeamName = team ? team.name : null;
                    registeredDate = reg.registration_date;
                    break;
                }
            }
        }
        
        // Format event for response
        const formattedEvent = {
            id: event._id,
            name: event.title,
            description: event.description || '',
            date: event.event_date,
            event_date: event.event_date,
            time: event.time || null,
            location: event.location,
            sport: event.sport_type,
            sport_type: event.sport_type,
            status: event.status,
            max_participants: event.max_teams || event.max_participants,
            current_participants: event.team_registrations ? event.team_registrations.length : 0,
            registration_deadline: event.registration_deadline || null,
            organizer: event.organizer_first_name && event.organizer_last_name 
                ? `${event.organizer_first_name} ${event.organizer_last_name}`.trim()
                : event.organizer_email || 'Unknown',
            rules: event.rules || null,
            prize_details: event.prize_details || null,
            is_registered: isRegistered,
            team_name: registeredTeamName,
            registered_date: registeredDate
        };
        
        res.json({
            success: true,
            event: formattedEvent
        });
    } catch (err) {
        console.error('Error loading event details:', err);
        res.status(500).json({
            success: false,
            message: 'Error loading event details',
            error: err.message
        });
    }
});

// Register for an event
router.post('/event/:id/register', async (req, res) => {
    try {
        const eventId = req.params.id;
        const teamId = req.body.team_id;
        const notes = req.body.notes || '';
        
        if (!teamId) {
            req.session.flashMessage = {
                type: 'error',
                text: 'Please select a team to register'
            };
            return res.redirect(`/player/event/${eventId}`);
        }

        console.log(`Registering team ${teamId} for event ${eventId}`);
        
        // Get team and event details for better messages
        const team = await Team.getTeamById(teamId);
        const event = await Event.getEventById(eventId);
        
        const teamName = team ? team.name : 'your team';
        const eventName = event ? event.title : 'the event';
        
        // Register the team for the event
        const registrationData = {
            team_id: teamId,
            status: 'confirmed',
            notes: notes
        };
        
        await Event.registerTeamForEvent(eventId, registrationData);
        
        req.session.flashMessage = {
            type: 'success',
            text: `You've successfully registered ${teamName} for ${eventName}!`
        };
        
        res.redirect(`/player/event/${eventId}`);
    } catch (err) {
        console.error('Error registering for event:', err);
        req.session.flashMessage = {
            type: 'error',
            text: `Error registering for event: ${err.message}`
        };
        res.redirect(`/player/event/${eventId}`);
    }
});

// Get all teams
router.get('/teams/browse', isPlayer, (req, res) => {
    Team.getAllTeams((err, teams) => {
        if (err) {
            console.error('Error fetching teams:', err);
            return res.render('player/browse-teams', { 
                profile: req.session.user, 
                teams: [],
                error: 'Failed to load teams. Please try again later.' 
            });
        }
        res.render('player/browse-teams', { profile: req.session.user, teams: teams });
    });
});

// Get team details
router.get('/teams/details/:id', isPlayer, async (req, res) => {
    try {
        const teamId = req.params.id;
        const userId = req.session.user.id;
        
        // Get team details
        const team = await Team.getTeamById(teamId);
        
        if (!team) {
            req.session.error = 'Team not found or error loading team details.';
            return res.redirect('/player/browse-teams');
        }
        
        // Get team members
        const members = await Team.getTeamMembers(teamId);
        team.members_list = members || [];
        
        // Check if user is a member of this team
        const isTeamMember = members.some(member => member.id === userId);
        
        // Get player's join requests to show status
        const joinRequests = await Team.getPlayerJoinRequests(userId);
        
        // Find if there's a request for this team
        const teamRequest = joinRequests.find(req => req.team_id === parseInt(teamId));
        const requestStatus = teamRequest ? teamRequest.status : undefined;
        
        res.render('player/team-details', { 
            profile: req.session.user, 
            team: team,
            isTeamMember: isTeamMember,
            requestStatus: requestStatus,
            layout: 'layouts/dashboard',
            path: '/player/browse-teams'
        });
    } catch (err) {
        console.error('Error fetching team details:', err);
        req.session.error = 'Error loading team details.';
        res.redirect('/player/browse-teams');
    }
});

// Profile update route
router.post('/update-profile', isPlayer, async (req, res) => {
    try {
        // Get user ID from session
        const userId = req.session.user._id;
        
        console.log('Profile update request received:', req.body);
        
        // Extract all possible profile fields directly
        const updatedProfile = {
            // Handle both single name field and first/last name fields
            name: req.body.name || '',
            first_name: req.body.first_name || '',
            last_name: req.body.last_name || '',
            email: req.body.email || req.session.user.email, // Keep existing email if not provided
            phone: req.body.phone || '',
            age: req.body.age ? parseInt(req.body.age, 10) : null,
            address: req.body.address || '',
            bio: req.body.bio || '',
            organization: req.body.organization || '',
            preferred_sports: req.body.sports || req.body.preferred_sports || []
        };
        
        console.log('Sending profile update to database:', updatedProfile);
        
        // Update the user profile in the database
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
            
            res.redirect('/player/profile');
        });
    } catch (err) {
        console.error('Error updating profile in database:', err);
        req.session.flashMessage = {
            type: 'error',
            text: 'Error updating profile. Please try again.'
        };
        res.redirect('/player/profile');
    }
});

// Add route for changing password
router.post('/change-password', isPlayer, async (req, res) => {
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
            return res.redirect('/player/profile');
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
            return res.redirect('/player/profile');
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
        res.redirect('/player/profile');
    } catch (err) {
        console.error('Error changing password:', err);
        req.session.flashMessage = {
            type: 'error',
            text: `Error changing password: ${err.message}`
        };
        res.redirect('/player/profile');
    }
});

// Add route for updating notification settings
router.post('/update-notifications', isPlayer, (req, res) => {
    const userId = req.session.user.id;
    const { emailNotif, smsNotif, eventReminder, teamUpdates, marketingEmails } = req.body;
    
    const notificationSettings = {
        emailNotif: emailNotif === 'on',
        smsNotif: smsNotif === 'on',
        eventReminder: eventReminder === 'on',
        teamUpdates: teamUpdates === 'on',
        marketingEmails: marketingEmails === 'on'
    };
    
    // In a real app, you would save these settings to the database
    // For demo purposes, we'll just update the session
    req.session.user.notificationSettings = notificationSettings;
    req.session.success = 'Notification settings updated!';
    res.redirect('/player/profile');
});

// Add route for updating sports preferences
router.post('/update-sports', isPlayer, (req, res) => {
    const userId = req.session.user.id;
    
    // Handle both array and single value 
    let sports = req.body.sports;
    if (!Array.isArray(sports)) {
        sports = sports ? [sports] : [];
    }
    
    console.log('Updating sports preferences:', sports);
    
    // Save sports preferences to the database
    const updatedProfile = {
        preferred_sports: sports.join(',') // Store as comma-separated string
    };
    
    User.updateUser(userId, updatedProfile, (err, updatedUser) => {
        if (err) {
            console.error('Error updating sports preferences:', err);
            req.session.error = 'Error updating sports preferences. Please try again.';
            return res.redirect('/player/profile');
        }
        
        // Update session with updated sports data
        if (updatedUser) {
            req.session.user = updatedUser;
            req.session.user.preferredSports = sports; // For UI compatibility
        } else {
            req.session.user.preferred_sports = sports.join(',');
            req.session.user.preferredSports = sports; // For UI compatibility
        }
        
        req.session.success = 'Sports preferences updated successfully!';
        res.redirect('/player/profile');
    });
});

// Update profile photo handler
router.post('/update-photo', isPlayer, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            req.session.message = {
                type: 'danger',
                text: 'No file was uploaded. Please select an image file.'
            };
            return res.redirect('/player/profile');
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
            
            res.redirect('/player/profile');
        });
    } catch (err) {
        console.error('Error updating profile picture:', err);
        req.session.message = {
            type: 'danger',
            text: `Failed to update profile picture: ${err.message}`
        };
        res.redirect('/player/profile');
    }
});

// Route to request to join a team
router.post('/request-join-team/:teamId', async (req, res) => {
    try {
        const teamId = req.params.teamId; // Get team ID from URL parameter
        const playerId = req.session.user._id;
        
        if (!teamId || !playerId) {
            req.session.flashMessage = {
                type: 'error',
                text: 'Team ID and player ID are required'
            };
            return res.redirect('/player/browse-teams');
        }
        
        console.log(`Player ${playerId} is requesting to join team ${teamId}`);
        
        // Call Team model method to add join request
        const result = await Team.addJoinRequest(teamId, playerId);
        
        // Get team details for the success message
        const team = await Team.getTeamById(teamId);
        const teamName = team ? team.name : 'the team';
        
        req.session.flashMessage = {
            type: 'success',
            text: `Your request to join ${teamName} has been sent to the team manager. You will be notified when it's approved.`
        };
        
        // Store the request status in session to update UI
        if (!req.session.teamRequestStatuses) {
            req.session.teamRequestStatuses = {};
        }
        req.session.teamRequestStatuses[teamId] = 'pending';
        
        res.redirect('/player/browse-teams');
    } catch (err) {
        console.error('Error requesting to join team:', err);
        req.session.flashMessage = {
            type: 'error',
            text: `Error requesting to join team: ${err.message}`
        };
        res.redirect('/player/browse-teams');
    }
});

// API Routes for AJAX functionality

// API route to get all events for browse page
router.get('/api/events/browse', async (req, res) => {
    try {
        const events = await EventSchema.find({ 
            status: 'upcoming',
            registrationDeadline: { $gte: new Date() }
        }).sort({ eventDate: 1 });
        
        res.json({ 
            success: true, 
            events: events 
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.json({ 
            success: false, 
            message: 'Failed to load events' 
        });
    }
});

// API route for event search with filters
router.get('/api/events/search', async (req, res) => {
    try {
        const { search, category } = req.query;
        let query = { 
            status: 'upcoming',
            registrationDeadline: { $gte: new Date() }
        };
        
        // Add search term filter
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Add category filter
        if (category) {
            query.category = { $regex: category, $options: 'i' };
        }
        
        const events = await EventSchema.find(query).sort({ eventDate: 1 });
        
        res.json({ 
            success: true, 
            events: events,
            count: events.length
        });
    } catch (error) {
        console.error('Error searching events:', error);
        res.json({ 
            success: false, 
            message: 'Search failed. Please try again.' 
        });
    }
});

// API route to get player's joined events for calendar
router.get('/api/player/events', async (req, res) => {
    try {
        const userId = req.session.user._id;
        const events = await EventSchema.find({ 
            participants: userId 
        }).sort({ eventDate: 1 });
        
        res.json({ 
            success: true, 
            events: events 
        });
    } catch (error) {
        console.error('Error fetching player events:', error);
        res.json({ 
            success: false, 
            message: 'Failed to load your events' 
        });
    }
});

// API route to join an event via AJAX
router.post('/api/events/:eventId/join', async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const userId = req.session.user._id;
        
        const event = await EventSchema.findById(eventId);
        if (!event) {
            return res.json({ 
                success: false, 
                message: 'Event not found' 
            });
        }
        
        // Check if already joined
        if (event.participants.includes(userId)) {
            return res.json({ 
                success: false, 
                message: 'You are already registered for this event' 
            });
        }
        
        // Check if event is full
        if (event.participants.length >= event.maxParticipants) {
            return res.json({ 
                success: false, 
                message: 'Event is full' 
            });
        }
        
        // Check if registration deadline has passed
        if (new Date() > event.registrationDeadline) {
            return res.json({ 
                success: false, 
                message: 'Registration deadline has passed' 
            });
        }
        
        // Add participant
        event.participants.push(userId);
        await event.save();
        
        res.json({ 
            success: true, 
            message: 'Successfully joined the event!',
            participantCount: event.participants.length
        });
        
    } catch (error) {
        console.error('Error joining event:', error);
        res.json({ 
            success: false, 
            message: 'Failed to join event. Please try again.' 
        });
    }
});

// API route for team search with filters
router.get('/api/teams/search', async (req, res) => {
    try {
        console.log('Team search API called with query:', req.query);
        const { search, sport } = req.query;
        let query = {};
        
        // Add search term filter
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { location: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Add sport filter
        if (sport) {
            query.sport_type = { $regex: sport, $options: 'i' };
        }
        
        console.log('Team search query:', query);
        
        const teams = await TeamSchema.find(query)
            .populate('manager_id', 'first_name last_name email')
            .populate('members', 'first_name last_name')
            .sort({ name: 1 });
        
        console.log('Found teams:', teams.length);
        
        res.json({ 
            success: true, 
            teams: teams,
            count: teams.length
        });
    } catch (error) {
        console.error('Error searching teams:', error);
        res.json({ 
            success: false, 
            message: 'Search failed. Please try again.' 
        });
    }
});

// API route to join a team via AJAX
router.post('/api/teams/:teamId/join', async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const playerId = req.session.user._id;
        
        console.log('Team join API called:', { teamId, playerId });
        
        if (!teamId || !playerId) {
            return res.json({ 
                success: false, 
                message: 'Team ID and player ID are required' 
            });
        }
        
        console.log(`Player ${playerId} is requesting to join team ${teamId} via AJAX`);
        
        // Call Team model method to add join request
        const result = await Team.addJoinRequest(teamId, playerId);
        
        // Get team details for the success message
        const team = await Team.getTeamById(teamId);
        const teamName = team ? team.name : 'the team';
        
        console.log('Team join successful:', { teamId, teamName });
        
        res.json({ 
            success: true, 
            message: `Your request to join ${teamName} has been sent to the team manager. You will be notified when it's approved.`
        });
        
    } catch (error) {
        console.error('Error requesting to join team via AJAX:', error);
        res.json({ 
            success: false, 
            message: `Error requesting to join team: ${error.message}` 
        });
    }
});

// ==================== MATCH STATISTICS ROUTES ====================

/**
 * Get all matches for player's teams
 * GET /player/my-matches
 */
router.get('/my-matches', async (req, res) => {
    try {
        const playerId = req.session.user._id;
        
        // Get player's teams
        const teams = await Team.getPlayerTeams(playerId);
        const teamIds = teams.map(t => t._id);
        
        // Get matches for those teams
        const MatchModel = require('../models/schemas/matchSchema');
        const matches = await MatchModel.find({
            $or: [
                { team_a: { $in: teamIds } },
                { team_b: { $in: teamIds } }
            ],
            status: 'verified'
        })
        .populate('team_a', 'name')
        .populate('team_b', 'name')
        .populate('event_id', 'title')
        .sort({ match_date: -1 })
        .limit(20)
        .exec();
        
        // Transform matches to add player context
        const transformedMatches = matches.map(match => {
            const isTeamA = teamIds.some(id => id.toString() === match.team_a._id.toString());
            
            let result, playerTeam, opponentTeam;
            
            if (isTeamA) {
                playerTeam = match.team_a;
                opponentTeam = match.team_b;
                result = match.score_a > match.score_b ? 'won' 
                    : match.score_a < match.score_b ? 'lost' 
                    : 'draw';
            } else {
                playerTeam = match.team_b;
                opponentTeam = match.team_a;
                result = match.score_b > match.score_a ? 'won' 
                    : match.score_b < match.score_a ? 'lost' 
                    : 'draw';
            }
            
            return {
                ...match.toObject(),
                player_result: result,
                player_team: playerTeam,
                opponent_team: opponentTeam
            };
        });
        
        res.json({
            success: true,
            matches: transformedMatches
        });
    } catch (err) {
        console.error('Error fetching player matches:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching player matches',
            error: err.message
        });
    }
});

/**
 * Get aggregated player statistics
 * GET /player/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const playerId = req.session.user._id;
        
        // Get player's teams
        const teams = await Team.getPlayerTeams(playerId);
        
        // Aggregate stats across all teams
        let total_matches_played = 0;
        let total_wins = 0;
        let total_losses = 0;
        let total_draws = 0;
        
        teams.forEach(team => {
            const member = team.members.find(m => m.player_id.toString() === playerId.toString());
            if (member && member.stats) {
                total_matches_played += member.stats.matches_played || 0;
                total_wins += member.stats.matches_won || 0;
                total_losses += member.stats.matches_lost || 0;
                total_draws += member.stats.matches_drawn || 0;
            }
        });
        
        const win_rate = total_matches_played > 0 
            ? ((total_wins / total_matches_played) * 100).toFixed(1) 
            : 0;
        
        // Get recent form (last 5 matches)
        const teamIds = teams.map(t => t._id);
        const MatchModel = require('../models/schemas/matchSchema');
        const recentMatches = await MatchModel.find({
            $or: [
                { team_a: { $in: teamIds } },
                { team_b: { $in: teamIds } }
            ],
            status: 'verified'
        })
        .sort({ match_date: -1 })
        .limit(5)
        .exec();
        
        const recent_form = recentMatches.map(match => {
            const isTeamA = teamIds.some(id => id.toString() === match.team_a.toString());
            
            if (isTeamA) {
                return match.score_a > match.score_b ? 'W' 
                    : match.score_a < match.score_b ? 'L' 
                    : 'D';
            } else {
                return match.score_b > match.score_a ? 'W' 
                    : match.score_b < match.score_a ? 'L' 
                    : 'D';
            }
        });
        
        const stats = {
            total_matches_played,
            total_wins,
            total_losses,
            total_draws,
            win_rate,
            teams_count: teams.length,
            recent_form
        };
        
        res.json({
            success: true,
            stats
        });
    } catch (err) {
        console.error('Error fetching player stats:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching player stats',
            error: err.message
        });
    }
});

/**
 * Get player's performance for specific team
 * GET /player/teams/:teamId/performance
 */
router.get('/teams/:teamId/performance', async (req, res) => {
    try {
        const { teamId } = req.params;
        const playerId = req.session.user._id;
        
        // Get team
        const team = await Team.getTeamById(teamId);
        const member = team.members.find(m => m.player_id.toString() === playerId.toString());
        
        if (!member) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this team'
            });
        }
        
        const stats = member.stats || {
            matches_played: 0,
            matches_won: 0,
            matches_lost: 0,
            matches_drawn: 0
        };
        
        const win_rate = stats.matches_played > 0 
            ? ((stats.matches_won / stats.matches_played) * 100).toFixed(1) 
            : 0;
        
        const Match = require('../models/match');
        const matches = await Match.getMatchesByTeam(teamId);
        
        res.json({
            success: true,
            team: {
                id: team._id,
                name: team.name,
                sport_type: team.sport_type
            },
            player_stats: {
                ...stats,
                win_rate
            },
            team_record: {
                wins: team.wins || 0,
                losses: team.losses || 0,
                draws: team.draws || 0
            }
        });
    } catch (err) {
        console.error('Error fetching team performance:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching team performance',
            error: err.message
        });
    }
});

// ============================================
// PLAYER MATCH ROUTES
// ============================================

// Get player's match history (via teams they're in)
router.get('/my-matches', async (req, res) => {
    try {
        const playerId = req.session.user._id;
        const Match = require('../models/match');
        
        // Get all teams player belongs to
        const teams = await Team.getPlayerTeams(playerId);
        const teamIds = teams.map(t => t._id);
        
        if (teamIds.length === 0) {
            return res.json({
                success: true,
                matches: [],
                stats: { total: 0, won: 0, lost: 0, drawn: 0, winRate: 0 }
            });
        }
        
        // Get all matches involving these teams
        const MatchSchema = require('../models/schemas/matchSchema');
        const matches = await MatchSchema.find({
            $or: [
                { team_a: { $in: teamIds } },
                { team_b: { $in: teamIds } }
            ],
            status: { $in: ['completed', 'verified'] }
        })
        .populate('team_a', 'name')
        .populate('team_b', 'name')
        .populate('event_id', 'title')
        .sort({ match_date: -1 })
        .limit(50)
        .lean();
        
        // Calculate player statistics
        let won = 0, lost = 0, drawn = 0;
        
        matches.forEach(match => {
            const isTeamA = teamIds.some(id => id.toString() === match.team_a._id.toString());
            
            if (match.winner === 'draw') {
                drawn++;
            } else if (
                (isTeamA && match.winner === 'team_a') ||
                (!isTeamA && match.winner === 'team_b')
            ) {
                won++;
            } else {
                lost++;
            }
        });
        
        res.json({
            success: true,
            matches: matches,
            stats: {
                total: matches.length,
                won: won,
                lost: lost,
                drawn: drawn,
                winRate: matches.length > 0 ? ((won / matches.length) * 100).toFixed(1) : 0
            }
        });
        
    } catch (error) {
        console.error('Error fetching player matches:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching match history'
        });
    }
});

// Get player statistics
router.get('/stats', async (req, res) => {
    try {
        const playerId = req.session.user._id;
        const Match = require('../models/match');
        const MatchSchema = require('../models/schemas/matchSchema');
        
        // Get teams
        const teams = await Team.getPlayerTeams(playerId);
        const teamIds = teams.map(t => t._id);
        
        // Aggregate statistics
        const totalMatches = await MatchSchema.countDocuments({
            $or: [
                { team_a: { $in: teamIds } },
                { team_b: { $in: teamIds } }
            ],
            status: { $in: ['completed', 'verified'] }
        });
        
        // Get recent matches for form
        const recentMatches = await MatchSchema.find({
            $or: [
                { team_a: { $in: teamIds } },
                { team_b: { $in: teamIds } }
            ],
            status: { $in: ['completed', 'verified'] }
        })
        .sort({ match_date: -1 })
        .limit(5)
        .populate('team_a team_b')
        .lean();
        
        // Calculate form (W/L/D for last 5 matches)
        const form = recentMatches.map(match => {
            const isTeamA = teamIds.some(id => id.toString() === match.team_a._id.toString());
            
            if (match.winner === 'draw') return 'D';
            if ((isTeamA && match.winner === 'team_a') || 
                (!isTeamA && match.winner === 'team_b')) return 'W';
            return 'L';
        });
        
        res.json({
            success: true,
            stats: {
                totalMatches,
                teamsCount: teams.length,
                recentForm: form
            },
            teams: teams
        });
        
    } catch (error) {
        console.error('Error fetching player stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

module.exports = router; 