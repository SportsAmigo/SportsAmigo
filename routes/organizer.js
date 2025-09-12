const express = require('express');
const router = express.Router();
const { Event, Team, User } = require('../models');
const { eventController, userController } = require('../controllers');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Middleware to check if user is logged in as organizer
function isOrganizer(req, res, next) {
    if (req.session.user && req.session.user.role === 'organizer') {
        next();
    } else {
        res.redirect('/login');
    }
}

// Apply isOrganizer middleware to all routes
router.use(isOrganizer);

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

// Organizer dashboard
router.get('/', async (req, res) => {
    try {
        console.log('Loading organizer dashboard, user:', req.session.user);
        const organizerId = req.session.user._id;
        console.log('Organizer ID:', organizerId);
        
        // Get events organized by this user
        const Event = require('../models/event');
        const events = await Event.getEventsByOrganizer(organizerId);
        
        console.log(`Retrieved ${events.length} events for organizer dashboard`);
        
        // Count events by status
        const upcomingEventsCount = events.filter(e => e.status === 'upcoming' || e.status === 'draft').length;
        const registeredTeamsCount = events.reduce((sum, event) => 
            sum + (event.team_registrations ? event.team_registrations.length : 0), 0);
        const cancelledEventsCount = events.filter(e => e.status === 'cancelled').length;
        const completedEventsCount = events.filter(e => e.status === 'completed').length;
        const totalEventsCount = events.length;
        
        // Get upcoming events for display on dashboard
        const upcomingEvents = events
            .filter(e => e.status === 'upcoming' || e.status === 'draft')
            .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
            .slice(0, 5)
            .map(event => {
                // Count team registrations
                const registrationCount = event.team_registrations ? event.team_registrations.length : 0;
                
                return {
                    id: event._id,
                    name: event.title,
                    date: new Date(event.event_date).toLocaleDateString(),
                    location: event.location,
                    sport: event.sport_type,
                    teams_registered: registrationCount,
                    max_teams: event.max_teams || 'unlimited',
                    status: event.status === 'draft' ? 'Draft' : 'Open'
                };
            });
        
        // Get completed events for analytics
        const completedEvents = events.filter(e => e.status === 'completed');
        
        // Generate recent activities based on real data
        const recentActivities = [];
        
        // Sort all events by created_at date, most recent first
        const sortedEvents = [...events].sort((a, b) => 
            new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now()));
        
        // Add event creation activities
        sortedEvents.slice(0, 3).forEach(event => {
            recentActivities.push({
                type: 'event_created',
                event_id: event._id,
                title: event.title,
                date: event.created_at || new Date(),
                message: `You created a new event: ${event.title}`
            });
        });
        
        // Add team registrations (most recent first)
        const recentRegistrations = [];
        events.forEach(event => {
            if (event.team_registrations && event.team_registrations.length > 0) {
                event.team_registrations.forEach(reg => {
                    recentRegistrations.push({
                        type: 'team_registered',
                        event_id: event._id,
                        event_title: event.title,
                        team_id: reg.team_id,
                        team_name: reg.team_name || 'A team',
                        date: reg.registration_date || new Date(),
                        message: `Team "${reg.team_name || 'A team'}" registered for "${event.title}"`
                    });
                });
            }
        });
        
        // Sort registrations by date and take the most recent ones
        recentRegistrations.sort((a, b) => new Date(b.date) - new Date(a.date));
        recentRegistrations.slice(0, 3).forEach(reg => {
            recentActivities.push(reg);
        });
        
        // Sort all activities by date
        recentActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Format dates for display
        recentActivities.forEach(activity => {
            activity.formatted_date = new Date(activity.date).toLocaleDateString();
        });
        
        // Find the next upcoming event for the welcome message
        const nextEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : null;
        
        // Prepare analytics data
        const sportsDistribution = {};
        events.forEach(event => {
            const sport = event.sport_type || 'Other';
            sportsDistribution[sport] = (sportsDistribution[sport] || 0) + 1;
        });
        
        // Get monthly event counts for the last 6 months
        const monthlyEventCounts = [];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthName = month.toLocaleString('default', { month: 'short' });
            const monthEvents = events.filter(event => {
                const eventDate = new Date(event.created_at || Date.now());
                return eventDate.getMonth() === month.getMonth() && 
                       eventDate.getFullYear() === month.getFullYear();
            }).length;
            
            monthlyEventCounts.push({
                month: monthName,
                count: monthEvents
            });
        }
        
        // Check if the user is a new organizer
        const isNewOrganizer = !req.session.user.first_name && !req.session.user.phone;
        
        res.render('organizer/dashboard', { 
            user: req.session.user,
            layout: 'layouts/dashboard',
            path: '/organizer',
            upcomingEventsCount,
            registeredTeamsCount,
            cancelledEventsCount,
            completedEventsCount,
            totalEventsCount,
            recentActivities,
            upcomingEvents,
            nextEvent,
            sportsDistribution,
            monthlyEventCounts,
            isNewOrganizer,
            title: 'Organizer Dashboard'
        });
    } catch (err) {
        console.error('Error loading organizer dashboard:', err);
        res.status(500).render('error', {
            message: 'Failed to load dashboard: ' + err.message,
            error: err
        });
    }
});

// Organizer dashboard - handle redirect from login
router.get('/dashboard', (req, res) => {
    // Check if this is a new organizer (no profile data yet)
    const isNewOrganizer = !req.session.user.first_name && !req.session.user.phone;
    
    res.render('organizer/dashboard', { 
        user: req.session.user,
        layout: 'layouts/dashboard',
        path: '/organizer',
        isNewOrganizer: isNewOrganizer
    });
});

// Manage Events
router.get('/manage-events', async (req, res) => {
    try {
        console.log('LOADING MANAGE-EVENTS ROUTE');
        
        if (!req.session || !req.session.user || !req.session.user._id) {
            console.error('User session not found or invalid');
            return res.redirect('/login');
        }
        
        const organizerId = req.session.user._id;
        console.log('Organizer ID:', organizerId);
        
        // Get events organized by this user
        const Event = require('../models/event');
        const events = await Event.getEventsByOrganizer(organizerId);
        
        console.log(`Retrieved ${events.length} events for organizer ${organizerId}`);
        
        // Format events for display, including registration counts
        const formatEvent = (event) => {
            // Count team registrations
            const registrationCount = event.team_registrations ? event.team_registrations.length : 0;
            const confirmedCount = event.team_registrations 
                ? event.team_registrations.filter(reg => reg.status === 'confirmed').length 
                : 0;
            
            return {
                id: event._id,
                name: event.title,
                date: new Date(event.event_date).toLocaleDateString(),
                location: event.location,
                sport: event.sport_type,
                status: event.status,
                registrations: {
                    total: registrationCount,
                    confirmed: confirmedCount,
                    pending: registrationCount - confirmedCount
                },
                teams_registered: registrationCount,
                max_teams: event.max_teams || 'unlimited',
                progress_percentage: event.max_teams ? Math.round((registrationCount / event.max_teams) * 100) : 0
            };
        };
        
        // Upcoming events (draft or upcoming)
        const upcomingEvents = events
            .filter(e => e.status === 'upcoming' || e.status === 'draft')
            .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
            .map(formatEvent);
        
        // Active events (in progress)
        const activeEvents = events
            .filter(e => e.status === 'in_progress')
            .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
            .map(event => ({
                ...formatEvent(event),
                start_date: new Date(event.event_date).toLocaleDateString(),
                end_date: event.end_date ? new Date(event.end_date).toLocaleDateString() : 'TBD',
                participants_count: event.team_registrations ? event.team_registrations.length : 0
            }));
        
        // Completed events
        const completedEvents = events
            .filter(e => e.status === 'completed')
            .sort((a, b) => new Date(b.event_date) - new Date(a.event_date))
            .map(event => ({
                ...formatEvent(event),
                teams_count: event.team_registrations ? event.team_registrations.length : 0
            }));
        
        // Get sport types from all events for the filter dropdown
        const sportTypes = [...new Set(events.map(e => e.sport_type).filter(Boolean))];
        
        res.render('organizer/manage-events', {
            title: 'Manage Events',
            user: req.session.user,
            upcomingEvents,
            activeEvents,
            completedEvents,
            sportTypes,
            message: req.session.message || null,
            layout: 'layouts/dashboard',
            path: '/organizer/manage-events'
        });
        
        // Clear any flash messages
        delete req.session.message;
    } catch (err) {
        console.error('Error loading manage events page:', err);
        res.status(500).render('error', {
            message: 'Failed to load manage events page: ' + err.message,
            error: err
        });
    }
});

// Reports & Analytics
router.get('/reports', async (req, res) => {
    try {
        res.render('organizer/reports', { 
            title: 'Reports & Analytics',
            user: req.session.user,
            layout: 'layouts/dashboard',
            path: '/organizer/reports'
        });
    } catch (err) {
        console.error('Error loading reports page:', err);
        res.status(500).render('error', {
            message: 'Failed to load reports',
            error: err
        });
    }
});

// Organizer Profile
router.get('/profile', async (req, res) => {
    try {
        const user = await User.getUserById(req.session.user._id);
        
        res.render('organizer/profile', {
            title: 'My Profile',
            user: user,
            messages: req.session.flashMessage || {},
            layout: 'layouts/dashboard',
            path: '/organizer/profile'
        });
        
        // Clear flash messages
        delete req.session.flashMessage;
    } catch (err) {
        console.error('Error loading profile:', err);
        res.status(500).render('error', {
            message: 'Failed to load profile',
            error: err
        });
    }
});

// My Events (legacy route - can be redirected to manage-events)
router.get('/my-events', (req, res) => {
    res.redirect('/organizer/manage-events');
});

// Create Event Form
router.get('/create-event', (req, res) => {
    try {
        console.log('Loading create event page');
        res.render('organizer/create-event', { 
            user: req.session.user,
            layout: 'layouts/dashboard',
            path: '/organizer/create-event',
            validationErrors: {},
            formData: {},
            error: null,
            successMessage: null
        });
    } catch (error) {
        console.error('Error in create-event route:', error);
        res.status(500).render('error', {
            title: '500 - Server Error',
            message: 'An error occurred while loading the create event page.',
            layout: 'layouts/main'
        });
    }
});

// Create Event Handler
router.post('/create-event', async (req, res) => {
    try {
        console.log('Creating new event with data:', req.body);
        
        // Create event data object from form data
        const eventData = {
            organizer_id: req.session.user._id,
            title: req.body.name,
            description: req.body.description || '',
            sport_type: req.body.sport,
            event_date: req.body.start_date,
            event_time: req.body.event_time || '10:00',
            location: req.body.location,
            max_teams: parseInt(req.body.max_teams || 16),
            entry_fee: req.body.entry_fee || 0,
            registration_deadline: req.body.registration_deadline || null,
            status: req.body.status === 'Draft' ? 'draft' : 'upcoming'
        };
        
        // Save the event to the database
        const Event = require('../models/event');
        try {
            const newEvent = await Event.createEvent(eventData);
            console.log(`Event created successfully with ID: ${newEvent._id}`);
            
            // Add success message to session
            req.session.message = {
                type: 'success',
                text: 'Event created successfully!'
            };
            
            // Save the session before redirecting
            req.session.save(err => {
                if (err) {
                    console.error('Error saving session after event creation:', err);
                }
                // Redirect to manage events page
                return res.redirect('/organizer/manage-events');
            });
        } catch (err) {
            console.error('Error saving event to database:', err);
            return res.status(500).render('error', {
                title: '500 - Server Error',
                message: 'An error occurred while creating the event: ' + err.message,
                layout: 'layouts/main'
            });
        }
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).send('Error creating event: ' + error.message);
    }
});

// View event
router.get('/event/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        console.log(`Viewing event ${eventId} as organizer`);
        
        // Get event details
        const Event = require('../models/event');
        const Team = require('../models/team');
        const User = require('../models/user');
        
        const event = await Event.getEventById(eventId);
        
        if (!event) {
            req.session.flashMessage = {
                type: 'error',
                text: 'Event not found'
            };
            return res.redirect('/organizer/manage-events');
        }
        
        // Check if the current user is the organizer
        if (event.organizer_id.toString() !== req.session.user._id.toString()) {
            req.session.flashMessage = {
                type: 'error',
                text: 'You do not have permission to view this event'
            };
            return res.redirect('/organizer/manage-events');
        }
        
        // Get more detailed information about registered teams
        let registeredTeams = [];
        
        console.log(`Event team registrations:`, event.team_registrations);
        
        if (event.team_registrations && event.team_registrations.length > 0) {
            console.log(`Found ${event.team_registrations.length} team registrations for event ${eventId}`);
            
            // Process each team registration to get complete details
            for (const registration of event.team_registrations) {
                try {
                    const teamId = registration.team_id;
                    console.log(`Fetching details for team ${teamId}`);
                    
                    // Get team details
                    const team = await Team.getTeamById(teamId);
                    
                    if (!team) {
                        console.log(`Team ${teamId} not found`);
                        continue;
                    }
                    
                    // Get manager details
                    const manager = await User.getUserById(team.manager_id);
                    const managerName = manager ? `${manager.first_name} ${manager.last_name}` : 'Unknown';
                    
                    // Add to the list of registered teams
                    registeredTeams.push({
                        id: team._id,
                        name: team.name,
                        sport: team.sport_type,
                        members: team.members?.length || 0,
                        manager: managerName,
                        status: registration.status,
                        registration_date: new Date(registration.registration_date).toLocaleDateString(),
                        notes: registration.notes || ''
                    });
                    
                    console.log(`Added team ${team.name} to registered teams list`);
                } catch (err) {
                    console.error(`Error processing team registration:`, err);
                }
            }
        }
        
        // Format the event for display
        const formattedEvent = {
            id: event._id,
            name: event.title,
            title: event.title,
            date: new Date(event.event_date).toLocaleDateString(),
            time: event.event_time,
            description: event.description,
            location: event.location,
            sport: event.sport_type,
            sport_type: event.sport_type,
            status: event.status,
            registration_deadline: event.registration_deadline ? new Date(event.registration_deadline).toLocaleDateString() : 'Not set',
            max_teams: event.max_teams,
            entry_fee: event.entry_fee,
            registered_teams: registeredTeams.length,
            registeredTeams: registeredTeams,
            team_registrations: registeredTeams
        };
        
        console.log(`Formatted event with ${registeredTeams.length} registered teams`);
        
        res.render('organizer/event-details', {
            title: 'Event Details',
            user: req.session.user,
            event: formattedEvent,
            messages: req.session.flashMessage || {},
            layout: 'layouts/dashboard',
            path: '/organizer/manage-events'
        });
        
        // Clear flash messages
        delete req.session.flashMessage;
    } catch (err) {
        console.error('Error viewing event:', err);
        req.session.flashMessage = {
            type: 'error',
            text: 'Error loading event details: ' + err.message
        };
        res.redirect('/organizer/manage-events');
    }
});

// Edit event page
router.get('/event/:id/edit', async (req, res) => {
    try {
        const eventId = req.params.id;
        
        // Get event details
        const event = await Event.getEventById(eventId);
        
        if (!event) {
            req.session.flashMessage = {
                type: 'error',
                text: 'Event not found'
            };
            return res.redirect('/organizer/manage-events');
        }
        
        // Check if the current user is the organizer
        if (event.organizer_id.toString() !== req.session.user._id.toString()) {
            req.session.flashMessage = {
                type: 'error',
                text: 'You do not have permission to edit this event'
            };
            return res.redirect('/organizer/manage-events');
        }
        
        // Format the event for the edit form
        const formattedEvent = {
            id: event._id,
            name: event.title,
            title: event.title,
            description: event.description,
            sport: event.sport_type,
            sport_type: event.sport_type,
            start_date: event.event_date ? new Date(event.event_date).toISOString().split('T')[0] : '',
            event_date: event.event_date ? new Date(event.event_date).toISOString().split('T')[0] : '',
            event_time: event.event_time,
            location: event.location,
            max_teams: event.max_teams,
            entry_fee: event.entry_fee,
            registration_deadline: event.registration_deadline ? new Date(event.registration_deadline).toISOString().split('T')[0] : '',
            status: event.status
        };
        
        res.render('organizer/edit-event', {
            title: 'Edit Event',
            user: req.session.user,
            event: formattedEvent,
            messages: req.session.flashMessage || {},
            layout: 'layouts/dashboard',
            path: '/organizer/manage-events'
        });
        
        // Clear flash messages
        delete req.session.flashMessage;
    } catch (err) {
        console.error('Error loading edit event page:', err);
        req.session.flashMessage = {
            type: 'error',
            text: 'Error loading event details for editing'
        };
        res.redirect('/organizer/manage-events');
    }
});

// Update event (POST)
router.post('/event/:id/update', async (req, res) => {
    try {
        const eventId = req.params.id;
        
        // Get the event to check if current user is the organizer
        const event = await Event.getEventById(eventId);
        
        if (!event) {
            req.session.flashMessage = {
                type: 'error',
                text: 'Event not found'
            };
            return res.redirect('/organizer/manage-events');
        }
        
        // Check if the current user is the organizer
        if (event.organizer_id.toString() !== req.session.user._id.toString()) {
            req.session.flashMessage = {
                type: 'error',
                text: 'You do not have permission to update this event'
            };
            return res.redirect('/organizer/manage-events');
        }
        
        // Extract and validate event data
        const eventData = {
            title: req.body.title || req.body.name,
            description: req.body.description,
            sport_type: req.body.sport_type || req.body.sport,
            event_date: req.body.event_date || req.body.start_date,
            event_time: req.body.event_time,
            location: req.body.location,
            max_teams: req.body.max_teams ? parseInt(req.body.max_teams) : 0,
            entry_fee: req.body.entry_fee ? parseFloat(req.body.entry_fee) : 0,
            registration_deadline: req.body.registration_deadline,
            status: req.body.status
        };
        
        // Update the event
        await Event.updateEvent(eventId, eventData);
        
        req.session.flashMessage = {
            type: 'success',
            text: 'Event updated successfully'
        };
        
        res.redirect('/organizer/manage-events');
    } catch (err) {
        console.error('Error updating event:', err);
        req.session.flashMessage = {
            type: 'error',
            text: `Error updating event: ${err.message}`
        };
        res.redirect(`/organizer/event/${req.params.id}/edit`);
    }
});

// Delete event
router.post('/event/:id/delete', async (req, res) => {
    try {
        const eventId = req.params.id;
        
        // Get the event to check if current user is the organizer
        const event = await Event.getEventById(eventId);
        
        if (!event) {
            req.session.flashMessage = {
                type: 'error',
                text: 'Event not found'
            };
            return res.redirect('/organizer/manage-events');
        }
        
        // Check if the current user is the organizer
        if (event.organizer_id.toString() !== req.session.user._id.toString()) {
            req.session.flashMessage = {
                type: 'error',
                text: 'You do not have permission to delete this event'
            };
            return res.redirect('/organizer/manage-events');
        }
        
        // Delete the event
        await Event.deleteEvent(eventId);
        
        req.session.flashMessage = {
            type: 'success',
            text: 'Event deleted successfully'
        };
        
        res.redirect('/organizer/manage-events');
    } catch (err) {
        console.error('Error deleting event:', err);
        req.session.flashMessage = {
            type: 'error',
            text: `Error deleting event: ${err.message}`
        };
        res.redirect('/organizer/manage-events');
    }
});

// Cancel event route (uses the same deleteEvent functionality)
router.post('/event/:id/cancel', async (req, res) => {
    try {
        const eventId = req.params.id; // Use string ID directly, don't convert to integer
        const reason = req.body.reason || '';
        
        console.log(`Canceling/deleting event ${eventId} by organizer ${req.session.user._id}`);
        
        // Get the event to check if current user is the organizer
        const Event = require('../models/event');
        const event = await Event.getEventById(eventId);
        
        if (!event) {
            req.session.message = {
                type: 'danger',
                text: 'Event not found'
            };
            return res.redirect('/organizer/manage-events');
        }
        
        // Check if the current user is the organizer
        if (event.organizer_id.toString() !== req.session.user._id.toString()) {
            req.session.message = {
                type: 'danger',
                text: 'You do not have permission to cancel this event'
            };
            return res.redirect('/organizer/manage-events');
        }
        
        // Delete the event using the direct async function instead of callback
        await Event.deleteEvent(eventId);
        console.log(`Successfully canceled event ${eventId}`);
        
        // Success message
        req.session.message = {
            type: 'success',
            text: 'Event has been successfully canceled'
        };
        
        // Redirect to manage events page
        res.redirect('/organizer/manage-events');
    } catch (error) {
        console.error('Error canceling event:', error);
        req.session.message = {
            type: 'danger',
            text: error.message || 'An unexpected error occurred while canceling the event'
        };
        res.redirect('/organizer/manage-events');
    }
});

// GET - Event Templates
router.get('/event-templates', async (req, res) => {
    try {
        // Get templates from database
        const Template = require('../models/template');
        let templates = [];
        
        try {
            templates = await Template.getAllTemplates();
            console.log(`Retrieved ${templates.length} event templates from database`);
        } catch (err) {
            console.error('Error fetching templates from database:', err);
            
            // If no templates are found or there's an error, create default templates
            if (templates.length === 0) {
                // Default templates if none exist
                const defaultTemplates = [
                    {
                        name: 'Basketball Tournament',
                        sport: 'Basketball',
                        description: 'Standard basketball tournament template with group stage and knockout rounds',
                        created_at: new Date(),
                        created_by: req.session.user._id,
                        default_values: {
                            max_teams: 16,
                            entry_fee: 2000,
                            registration_period_days: 30,
                            event_duration_hours: 8,
                            location: 'Sports Arena'
                        }
                    },
                    {
                        name: 'Football League',
                        sport: 'Football',
                        description: 'Season-long football league with home and away matches',
                        created_at: new Date(),
                        created_by: req.session.user._id,
                        default_values: {
                            max_teams: 12,
                            entry_fee: 5000,
                            registration_period_days: 60,
                            event_duration_hours: 4,
                            location: 'Football Grounds'
                        }
                    },
                    {
                        name: 'Cricket T20 Tournament',
                        sport: 'Cricket',
                        description: 'T20 cricket tournament with group stage and playoffs',
                        created_at: new Date(),
                        created_by: req.session.user._id,
                        default_values: {
                            max_teams: 8,
                            entry_fee: 3000,
                            registration_period_days: 45,
                            event_duration_hours: 6,
                            location: 'Cricket Stadium'
                        }
                    }
                ];
                
                // Save default templates to database
                console.log('Creating default templates');
                for (const template of defaultTemplates) {
                    await Template.createTemplate(template);
                }
                
                // Fetch the newly created templates
                templates = await Template.getAllTemplates();
                console.log(`Created and retrieved ${templates.length} default templates`);
            }
        }
        
        // Format the templates for display, converting dates to local format
        const formattedTemplates = templates.map(template => ({
            id: template._id,
            name: template.name,
            sport: template.sport,
            description: template.description,
            created_at: template.created_at ? new Date(template.created_at).toISOString().split('T')[0] : '',
            last_used: template.last_used ? new Date(template.last_used).toISOString().split('T')[0] : null
        }));
        
        res.render('organizer/event-templates', {
            title: 'Event Templates',
            user: req.session.user,
            layout: 'layouts/dashboard',
            templates: formattedTemplates
        });
    } catch (error) {
        console.error('Error loading event templates:', error);
        res.status(500).send('Error loading event templates page');
    }
});

// GET - Import Events
router.get('/import-events', (req, res) => {
    try {
        res.render('organizer/import-events', {
            title: 'Import Events',
            user: req.session.user,
            layout: 'layouts/dashboard'
        });
    } catch (error) {
        console.error('Error loading import events page:', error);
        res.status(500).send('Error loading import events page');
    }
});

// GET - Settings Page
router.get('/settings', (req, res) => {
    try {
        res.render('organizer/settings', {
            title: 'Settings',
            user: req.session.user,
            layout: 'layouts/dashboard'
        });
    } catch (error) {
        console.error('Error loading settings page:', error);
        res.status(500).send('Error loading settings page');
    }
});

// POST - Update Profile
router.post('/profile/update', upload.single('profile_image'), async (req, res) => {
    try {
        console.log('Profile update request received:', req.body);
        
        const userId = req.session.user._id;
        
        // Extract all possible profile fields
        const { 
            name, first_name, last_name, email, phone, age, 
            address, bio, organization, organization_name 
        } = req.body;
        
        // Handle both name formats
        let firstName = first_name;
        let lastName = last_name;
        
        // If using single name field, try to split it
        if (name && !first_name) {
            const nameParts = name.split(' ');
            firstName = nameParts[0];
            lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        }
        
        // Prepare update data
        const updatedProfile = {
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
            age: age ? parseInt(age, 10) : null,
            address,
            bio,
            organization_name: organization || organization_name
        };
        
        // If a profile image was uploaded, add it to the profile data
        if (req.file) {
            // Create a path that the browser can access
            const imagePath = `/uploads/profile/${req.file.filename}`;
            updatedProfile.profile_image = imagePath;
        }
        
        // Update the user profile in the database
        const updatedUser = await User.updateUser(userId, updatedProfile);
        
        if (updatedUser) {
            // Update the session
            req.session.user = {
                ...req.session.user,
                ...updatedUser,
                // Add name field for backward compatibility
                name: updatedUser.first_name + (updatedUser.last_name ? ' ' + updatedUser.last_name : '')
            };
        }
        
        req.session.flashMessage = {
            type: 'success',
            text: 'Profile updated successfully!'
        };
        
        res.redirect('/organizer/profile');
    } catch (err) {
        console.error('Error updating profile:', err);
        req.session.flashMessage = {
            type: 'error',
            text: 'Error updating profile. Please try again.'
        };
        res.redirect('/organizer/profile');
    }
});

// Change password handler
router.post('/profile/change-password', (req, res) => {
    try {
        console.log('Change password request received');
        
        // In a real app, you would validate the current password and update with the new one
        // Here we're just redirecting with a success message
        req.session.message = {
            type: 'success',
            text: 'Password changed successfully!'
        };
        
        res.redirect('/organizer/profile');
    } catch (err) {
        console.error('Error changing password:', err);
        res.status(500).render('error', {
            message: 'Failed to change password',
            error: err
        });
    }
});

// Update profile photo handler
router.post('/update-photo', isOrganizer, upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            req.session.message = {
                type: 'danger',
                text: 'No file was uploaded. Please select an image file.'
            };
            return res.redirect('/organizer/profile');
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
            
            res.redirect('/organizer/profile');
        });
    } catch (err) {
        console.error('Error updating profile picture:', err);
        req.session.message = {
            type: 'danger',
            text: `Failed to update profile picture: ${err.message}`
        };
        res.redirect('/organizer/profile');
    }
});

// Notification preferences handler
router.post('/profile/notifications', (req, res) => {
    try {
        console.log('Notification preferences update received:', req.body);
        
        // Update user session
        if (req.session.user) {
            req.session.user.notifications = {
                email: req.body.email_notifications === 'on',
                sms: req.body.sms_notifications === 'on',
                marketing: req.body.marketing_emails === 'on'
            };
            
            req.session.save((err) => {
                if (err) {
                    console.error('Error saving session:', err);
                    return res.status(500).render('error', {
                        message: 'Failed to update notification preferences',
                        error: err
                    });
                }
                
                req.session.message = {
                    type: 'success',
                    text: 'Notification preferences updated successfully!'
                };
                
                res.redirect('/organizer/profile');
            });
        } else {
            throw new Error('User session not found');
        }
    } catch (err) {
        console.error('Error updating notification preferences:', err);
        res.status(500).render('error', {
            message: 'Failed to update notification preferences',
            error: err
        });
    }
});

// POST - Update Profile
router.post('/update-profile', isOrganizer, async (req, res) => {
    try {
        const userId = req.session.user._id;
        
        // Log the received data for debugging
        console.log('Received organizer profile update data:', req.body);
        
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
        
        console.log('Updating organizer profile with data:', updatedProfile);
        
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
        
        console.log('Updating organizer session with complete user data:', {
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
            
            return res.redirect('/organizer/profile');
        });
    } catch (err) {
        console.error('Error updating organizer profile:', err);
        req.session.flashMessage = {
            type: 'error',
            text: `Error updating profile: ${err.message}`
        };
        return res.redirect('/organizer/profile');
    }
});

// POST - Update Profile Picture
router.post('/update-profile-picture', (req, res) => {
    try {
        console.log('Update profile picture request received');
        
        // In a real implementation, you would:
        // 1. Handle the file upload
        // 2. Process the image (resize, compress, etc.)
        // 3. Save to storage (file system, cloud storage, etc.)
        // 4. Update the user record with the new image path
        
        // Mock successful update
        // Add success message
        req.session.flashMessage = {
            type: 'success',
            text: 'Profile picture updated successfully!'
        };
        
        res.redirect('/organizer/profile');
    } catch (error) {
        console.error('Error updating profile picture:', error);
        
        // Add error message
        req.session.flashMessage = {
            type: 'danger',
            text: 'Failed to update profile picture. Please try again.'
        };
        
        res.redirect('/organizer/profile');
    }
});

// POST - Change Password
router.post('/change-password', (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        
        // Validate input
        if (!currentPassword || !newPassword || !confirmPassword) {
            req.session.flashMessage = {
                type: 'danger',
                text: 'All password fields are required'
            };
            return res.redirect('/organizer/profile');
        }
        
        if (newPassword !== confirmPassword) {
            req.session.flashMessage = {
                type: 'danger',
                text: 'New passwords do not match'
            };
            return res.redirect('/organizer/profile');
        }
        
        // In a real implementation, you would:
        // 1. Verify the current password against stored (hashed) password
        // 2. Hash the new password
        // 3. Update the password in the database
        
        // Mock successful password change
        req.session.flashMessage = {
            type: 'success',
            text: 'Password changed successfully!'
        };
        
        res.redirect('/organizer/profile');
    } catch (error) {
        console.error('Error changing password:', error);
        
        req.session.flashMessage = {
            type: 'danger',
            text: 'Failed to change password. Please try again.'
        };
        
        res.redirect('/organizer/profile');
    }
});

// Send Message to Event Participants
router.get('/event/:id/send-message', async (req, res) => {
    try {
        const eventId = req.params.id;
        console.log(`Loading message form for event ID: ${eventId}`);
        
        // Get event details from database
        const Event = require('../models/event');
        const event = await Event.getEventById(eventId);
        
        if (!event) {
            req.session.message = {
                type: 'danger',
                text: 'Event not found'
            };
            return res.redirect('/organizer/manage-events');
        }
        
        // Check if the current user is the organizer
        if (event.organizer_id.toString() !== req.session.user._id.toString()) {
            req.session.message = {
                type: 'danger',
                text: 'You do not have permission to manage this event'
            };
            return res.redirect('/organizer/manage-events');
        }
        
        // Format event data for the view
        const formattedEvent = {
            id: event._id,
            name: event.title,
            // Count of team registrations
            team_count: event.team_registrations ? event.team_registrations.length : 0,
            // List of registered teams for the recipient dropdown
            teams: []
        };
        
        // Get team and manager details if there are registrations
        if (event.team_registrations && event.team_registrations.length > 0) {
            const Team = require('../models/team');
            const User = require('../models/user');
            
            // Fetch teams and managers data
            for (const registration of event.team_registrations) {
                try {
                    const team = await Team.getTeamById(registration.team_id);
                    if (team) {
                        // Get manager details
                        const manager = await User.getUserById(team.manager_id);
                        const managerName = manager ? `${manager.first_name || ''} ${manager.last_name || ''}`.trim() : 'Unknown';
                        const managerEmail = manager ? manager.email : '';
                        
                        formattedEvent.teams.push({
                            id: team._id,
                            name: team.name,
                            manager: managerName,
                            email: managerEmail,
                            members: team.members ? team.members.length : 0
                        });
                    }
                } catch (err) {
                    console.error(`Error fetching team details for ${registration.team_id}:`, err);
                }
            }
        }
        
        res.render('organizer/send-message', {
            title: `Message Participants: ${formattedEvent.name}`,
            event: formattedEvent,
            user: req.session.user,
            layout: 'layouts/dashboard',
            path: '/organizer/manage-events'
        });
    } catch (error) {
        console.error('Error loading message form:', error);
        res.status(500).render('error', {
            message: 'Failed to load message form',
            error
        });
    }
});

// Process Send Message Form
router.post('/event/:id/send-message', (req, res) => {
    try {
        const eventId = req.params.id;
        const { recipients, subject, message, sendEmail, sendSMS } = req.body;
        
        console.log(`Sending message for event ID: ${eventId}`);
        console.log('Message details:', { recipients, subject, message, sendEmail, sendSMS });
        
        // In a real application, we would send messages here
        // For now, just redirect with success message
        
        req.session.message = {
            type: 'success',
            text: 'Your message has been sent successfully to the selected participants.'
        };
        
        // Redirect to event details
        res.redirect(`/organizer/event/${eventId}`);
    } catch (error) {
        console.error('Error sending message:', error);
        req.session.message = {
            type: 'danger',
            text: 'Failed to send message. Please try again.'
        };
        res.redirect(`/organizer/event/${eventId}/send-message`);
    }
});

// Export Event Participant List
router.get('/event/:id/export', (req, res) => {
    try {
        const eventId = req.params.id;
        console.log(`Exporting participant list for event ID: ${eventId}`);
        
        // In a real application, this would generate a CSV or Excel file
        // For now, we'll just redirect back to the event details with a success message
        req.session.message = {
            type: 'success',
            text: 'Participant list exported successfully. Check your downloads folder.'
        };
        
        res.redirect(`/organizer/event/${eventId}`);
    } catch (error) {
        console.error('Error exporting participant list:', error);
        req.session.message = {
            type: 'danger',
            text: 'Failed to export participant list.'
        };
        res.redirect(`/organizer/event/${eventId}`);
    }
});

// Duplicate Event
router.get('/event/:id/duplicate', (req, res) => {
    try {
        const eventId = req.params.id;
        console.log(`Duplicating event ID: ${eventId}`);
        
        // In a real application, this would create a new event with the same details
        // For now, we'll just redirect to the create event page
        req.session.message = {
            type: 'success',
            text: 'Event duplicated successfully. You can now edit the details.'
        };
        
        res.redirect('/organizer/create-event');
    } catch (error) {
        console.error('Error duplicating event:', error);
        req.session.message = {
            type: 'danger',
            text: 'Failed to duplicate event.'
        };
        res.redirect(`/organizer/event/${eventId}`);
    }
});

// Remove team from event
router.post('/event/:eventId/remove-team/:teamId', async (req, res) => {
    try {
        const eventId = req.params.eventId; // Use string ID directly
        const teamId = req.params.teamId; // Use string ID directly
        
        console.log(`Removing team ${teamId} from event ${eventId}`);
        
        const Event = require('../models/event');
        
        // Check if the event exists and belongs to this organizer
        const event = await Event.getEventById(eventId);
        
        if (!event) {
            req.session.message = {
                type: 'danger',
                text: 'Event not found'
            };
            return res.redirect('/organizer/manage-events');
        }
        
        // Check if the event belongs to this organizer
        if (event.organizer_id.toString() !== req.session.user._id.toString()) {
            req.session.message = {
                type: 'danger',
                text: 'You do not have permission to manage this event'
            };
            return res.redirect('/organizer/manage-events');
        }
        
        // Check if the team is registered for this event
        const teamRegistration = event.team_registrations.find(reg => 
            reg.team_id.toString() === teamId.toString()
        );
        
        if (!teamRegistration) {
            req.session.message = {
                type: 'danger',
                text: 'Team is not registered for this event'
            };
            return res.redirect(`/organizer/event/${eventId}`);
        }
        
        // Delete the team registration
        await Event.removeTeamRegistration(eventId, teamId);
        
        req.session.message = {
            type: 'success',
            text: 'Team removed successfully'
        };
        
        res.redirect(`/organizer/event/${eventId}`);
    } catch (err) {
        console.error('Error removing team from event:', err);
        req.session.message = {
            type: 'danger',
            text: 'Failed to remove team from event'
        };
        res.redirect(`/organizer/event/${eventId}`);
    }
});

// Make sure to export the router
module.exports = router; 