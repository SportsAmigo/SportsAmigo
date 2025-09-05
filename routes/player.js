const express = require('express');
const router = express.Router();
const { Event, Team, User } = require('../models');
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
        req.session.errorMessage = 'You must be logged in as a player to access this page';
        res.redirect('/auth/login');
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
        
        res.render('player/dashboard', {
            title: 'Player Dashboard',
            user: req.session.user,
            events: playerEvents,
            teams: teams,
            layout: 'layouts/dashboard',
            path: '/player'
        });
    } catch (err) {
        console.error('Error rendering player dashboard:', err);
        res.status(500).render('error', { 
            message: 'Failed to load player dashboard', 
            error: err 
        });
    }
});

// My Events (Events a player is registered for)
router.get('/my-events', async (req, res) => {
    try {
        // Get player's team-based events
        const playerId = req.session.user._id;
        const playerEvents = await Event.getPlayerEventsViaTeams(playerId);
        
        res.render('player/my-events', {
            title: 'My Events',
            user: req.session.user,
            events: playerEvents,
            messages: req.session.flashMessage || {},
            layout: 'layouts/dashboard',
            path: '/player/my-events'
        });
        
        // Clear flash messages
        delete req.session.flashMessage;
    } catch (err) {
        console.error('Error in my-events route:', err);
        res.status(500).render('error', { 
            message: 'Failed to retrieve player events', 
            error: err 
        });
    }
});

// Browse Events (Events a player can join)
router.get('/browse-events', async (req, res) => {
    try {
        // Get all upcoming events
        const events = await Event.getAllEvents();
        
        // Filter events
        const upcomingEvents = events.filter(event => 
            event.status === 'upcoming' && 
            new Date(event.event_date) > new Date()
        );
        
        // Format events for display
        const formattedEvents = upcomingEvents.map(event => ({
            id: event._id,
            name: event.title,
            description: event.description,
            date: event.event_date,
            location: event.location,
            sport: event.sport_type,
            status: 'Open',
            registration_deadline: event.registration_deadline,
            max_participants: event.max_teams * 10, // Approximate
            current_participants: event.team_registrations ? event.team_registrations.length : 0,
            organizer: event.organizer_name || ''
        }));
        
        res.render('player/browse-events', {
            title: 'Browse Events',
            user: req.session.user,
            events: formattedEvents,
            messages: req.session.flashMessage || {},
            layout: 'layouts/dashboard',
            path: '/player/browse-events'
        });
        
        // Clear flash messages
        delete req.session.flashMessage;
    } catch (err) {
        console.error('Error in browse-events route:', err);
        res.status(500).render('error', { 
            message: 'Failed to retrieve events', 
            error: err 
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
            layout: 'layouts/dashboard',
            path: '/player/teams'
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
            layout: 'layouts/dashboard',
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
            manager_name: team.manager_name || 'Team Manager',
            manager_email: team.manager_email || '',
            current_members: team.members ? team.members.length : 0,
            max_members: team.max_members || 20,
            description: team.description || '',
            already_joined: membershipMap[team._id.toString()] === true
        }));
        
        // Get request statuses from session
        const requestStatusMap = req.session.teamRequestStatuses || {};
        
        res.render('player/browse-teams', {
            title: 'Browse Teams',
            user: req.session.user,
            availableTeams: formattedTeams,
            requestStatusMap: requestStatusMap,
            messages: req.session.flashMessage || {},
            layout: 'layouts/dashboard',
            path: '/player/browse-teams'
        });
        
        // Clear flash messages after sending
        delete req.session.flashMessage;
    } catch (err) {
        console.error('Error fetching teams:', err);
        res.status(500).render('error', { 
            title: 'Error',
            message: 'Failed to retrieve teams', 
            error: err,
            layout: 'layouts/main'
        });
    }
});

// View team details
router.get('/team/:id', async (req, res) => {
    try {
        const teamId = req.params.id;
        
        // Get team details
        const team = await Team.getTeamById(teamId);
        
        if (!team) {
            req.session.flashMessage = {
                type: 'error',
                text: 'Team not found'
            };
            return res.redirect('/player/browse-teams');
        }
        
        // Check if player is a member
        const playerId = req.session.user._id;
        const isMember = team.members && team.members.some(
            member => member.player_id.toString() === playerId.toString()
        );
        
        // Format team for display
        const formattedTeam = {
            id: team._id,
            name: team.name,
            sport: team.sport_type,
            manager: team.manager_name || 'Team Manager',
            manager_id: team.manager_id,
            members: team.members || [],
            description: team.description || 'No description available',
            achievements: team.achievements || [],
            is_member: isMember,
            upcoming_events: team.upcoming_events || []
        };
        
        res.render('player/team-details', {
            title: team.name,
            user: req.session.user,
            team: formattedTeam,
            messages: req.session.flashMessage || {},
            layout: 'layouts/dashboard',
            path: '/player/browse-teams'
        });
        
        // Clear flash messages
        delete req.session.flashMessage;
    } catch (err) {
        console.error('Error fetching team details:', err);
        req.session.flashMessage = {
            type: 'error',
            text: 'Error loading team details'
        };
        res.redirect('/player/browse-teams');
    }
});

// Request to join a team
router.post('/teams/:id/join', async (req, res) => {
    try {
        const teamId = req.params.id;
        const playerId = req.session.user._id;
        
        await Team.addJoinRequest(teamId, playerId);
        
        req.session.flashMessage = {
            type: 'success',
            text: 'Join request sent successfully!'
        };
        
        res.redirect(`/player/teams/${teamId}`);
    } catch (err) {
        console.error('Error sending join request:', err);
        req.session.flashMessage = {
            type: 'error',
            text: `Error sending join request: ${err.message}`
        };
        res.redirect(`/player/teams/${req.params.id}`);
    }
});

// Leave a team
router.post('/teams/:id/leave', async (req, res) => {
    try {
        const teamId = req.params.id;
        const playerId = req.session.user._id;
        
        await Team.removePlayerFromTeam(teamId, playerId);
        
        req.session.flashMessage = {
            type: 'success',
            text: 'You have left the team'
        };
        
        res.redirect('/player/teams');
    } catch (err) {
        console.error('Error leaving team:', err);
        req.session.flashMessage = {
            type: 'error',
            text: `Error leaving team: ${err.message}`
        };
        res.redirect(`/player/teams/${req.params.id}`);
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

// View event details
router.get('/event/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        
        // Get event details
        const event = await Event.getEventById(eventId);
        if (!event) {
            req.session.flashMessage = {
                type: 'error',
                text: 'Event not found'
            };
            return res.redirect('/player/browse-events');
        }
        
        // Get player's teams
        const playerId = req.session.user._id;
        const teams = await Team.getPlayerTeams(playerId);
        
        // Format event for display
        const formattedEvent = {
            _id: event._id,
            name: event.title,
            title: event.title,
            description: event.description,
            date: event.event_date,
            event_date: event.event_date,
            location: event.location,
            sport: event.sport_type,
            sport_type: event.sport_type,
            status: event.status,
            max_teams: event.max_teams,
            registration_deadline: event.registration_deadline,
            organizer: `${event.organizer_first_name} ${event.organizer_last_name}`,
            organizer_first_name: event.organizer_first_name,
            organizer_last_name: event.organizer_last_name,
            organizer_email: event.organizer_email,
            team_registrations: event.team_registrations || []
        };
        
        // Check if player's team is registered
        let isRegistered = false;
        let registeredTeam = null;
        
        if (teams.length > 0 && event.team_registrations && event.team_registrations.length > 0) {
            const teamIds = teams.map(team => team._id.toString());
            
            for (const reg of event.team_registrations) {
                if (teamIds.includes(reg.team_id.toString())) {
                    isRegistered = true;
                    registeredTeam = teams.find(team => team._id.toString() === reg.team_id.toString());
                    break;
                }
            }
        }
        
        formattedEvent.isRegistered = isRegistered;
        formattedEvent.registeredTeam = registeredTeam ? registeredTeam.name : null;
        
        res.render('player/event-details', {
            title: event.title,
            user: req.session.user,
            event: formattedEvent,
            teams: teams,
            messages: req.session.flashMessage || {},
            layout: 'layouts/dashboard',
            path: '/player/browse-events'
        });
        
        // Clear flash messages
        delete req.session.flashMessage;
    } catch (err) {
        console.error('Error loading event details:', err);
        req.session.flashMessage = {
            type: 'error',
            text: 'Error loading event details'
        };
        res.redirect('/player/browse-events');
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
router.post('/request-join-team', async (req, res) => {
    try {
        const teamId = req.body.teamId;
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

module.exports = router; 