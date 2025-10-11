const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Event = require('../models/event');
const Team = require('../models/team');
const Registration = require('../models/registration');

/**
 * API Routes for AJAX functionality in dashboard pages
 */

// GET /api/dashboard-stats - Live dashboard statistics
router.get('/dashboard-stats', async (req, res) => {
    try {
        console.log('API: Fetching dashboard stats');
        
        // Count totals from database
        const [totalEvents, totalTeams, totalPlayers] = await Promise.all([
            Event.countDocuments(),
            Team.countDocuments(),
            User.countDocuments({ role: 'player' })
        ]);
        
        // Count active teams (teams with members)
        const activeTeams = await Team.countDocuments({ 
            $expr: { $gt: [{ $size: "$members" }, 0] } 
        });
        
        const stats = {
            totalEvents,
            activeTeams,
            totalPlayers,
            totalTeams
        };
        
        console.log('Dashboard stats:', stats);
        res.json(stats);
        
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching dashboard statistics' 
        });
    }
});

// POST /api/teams/:teamId/join - Join a team
router.post('/teams/:teamId/join', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Please log in to join a team' 
            });
        }
        
        const teamId = req.params.teamId;
        const userId = req.session.user._id;
        
        console.log(`API: User ${userId} joining team ${teamId}`);
        
        // Find the team
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ 
                success: false, 
                message: 'Team not found' 
            });
        }
        
        // Check if user is already a member
        const isMember = team.members.some(member => member.user_id.toString() === userId);
        if (isMember) {
            return res.status(400).json({ 
                success: false, 
                message: 'You are already a member of this team' 
            });
        }
        
        // Check if team is full
        if (team.members.length >= team.max_members) {
            return res.status(400).json({ 
                success: false, 
                message: 'Team is full' 
            });
        }
        
        // Add user to team members
        team.members.push({
            user_id: userId,
            role: 'player',
            joined_at: new Date()
        });
        
        await team.save();
        
        res.json({ 
            success: true, 
            message: `Successfully joined ${team.name}` 
        });
        
    } catch (error) {
        console.error('Error joining team:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error joining team' 
        });
    }
});

// POST /api/teams/:teamId/leave - Leave a team
router.post('/teams/:teamId/leave', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Please log in to leave a team' 
            });
        }
        
        const teamId = req.params.teamId;
        const userId = req.session.user._id;
        
        console.log(`API: User ${userId} leaving team ${teamId}`);
        
        // Find the team
        const team = await Team.findById(teamId);
        if (!team) {
            return res.status(404).json({ 
                success: false, 
                message: 'Team not found' 
            });
        }
        
        // Remove user from team members
        team.members = team.members.filter(member => 
            member.user_id.toString() !== userId
        );
        
        await team.save();
        
        res.json({ 
            success: true, 
            message: `Successfully left ${team.name}` 
        });
        
    } catch (error) {
        console.error('Error leaving team:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error leaving team' 
        });
    }
});

// POST /api/events/:eventId/register - Register for an event
router.post('/events/:eventId/register', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Please log in to register for events' 
            });
        }
        
        const eventId = req.params.eventId;
        const userId = req.session.user._id;
        
        console.log(`API: User ${userId} registering for event ${eventId}`);
        
        // Check if event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found' 
            });
        }
        
        // Check if already registered
        const existingRegistration = await Registration.findOne({
            event_id: eventId,
            user_id: userId
        });
        
        if (existingRegistration) {
            return res.status(400).json({ 
                success: false, 
                message: 'You are already registered for this event' 
            });
        }
        
        // Create registration
        const registration = new Registration({
            event_id: eventId,
            user_id: userId,
            registration_date: new Date(),
            status: 'confirmed'
        });
        
        await registration.save();
        
        res.json({ 
            success: true, 
            message: `Successfully registered for ${event.name}` 
        });
        
    } catch (error) {
        console.error('Error registering for event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error registering for event' 
        });
    }
});

// POST /api/events/:eventId/unregister - Unregister from an event
router.post('/events/:eventId/unregister', async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Please log in to unregister from events' 
            });
        }
        
        const eventId = req.params.eventId;
        const userId = req.session.user._id;
        
        console.log(`API: User ${userId} unregistering from event ${eventId}`);
        
        // Remove registration
        const result = await Registration.deleteOne({
            event_id: eventId,
            user_id: userId
        });
        
        if (result.deletedCount === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'You are not registered for this event' 
            });
        }
        
        const event = await Event.findById(eventId);
        res.json({ 
            success: true, 
            message: `Successfully unregistered from ${event?.name || 'event'}` 
        });
        
    } catch (error) {
        console.error('Error unregistering from event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error unregistering from event' 
        });
    }
});

// POST /api/check-email - Check email availability
router.post('/check-email', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email is required' 
            });
        }
        
        console.log(`API: Checking email availability for ${email}`);
        
        // Check if email exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        
        res.json({ 
            available: !existingUser,
            message: existingUser ? 'Email already registered' : 'Email available'
        });
        
    } catch (error) {
        console.error('Error checking email:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error checking email availability' 
        });
    }
});

// POST /api/search-events - Search events
router.post('/search-events', async (req, res) => {
    try {
        const { query, category } = req.body;
        
        console.log(`API: Searching events for "${query}" in category "${category}"`);
        
        // Build search criteria
        let searchCriteria = {};
        
        if (query) {
            searchCriteria.$or = [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } },
                { location: { $regex: query, $options: 'i' } }
            ];
        }
        
        if (category) {
            searchCriteria.sport_type = { $regex: category, $options: 'i' };
        }
        
        // Search events
        const events = await Event.find(searchCriteria)
            .limit(10)
            .sort({ date: 1 })
            .populate('organizer_id', 'first_name last_name');
        
        // Format events for frontend
        const formattedEvents = events.map(event => ({
            id: event._id,
            name: event.name,
            description: event.description,
            date: event.date.toLocaleDateString(),
            location: event.location,
            sport: event.sport_type,
            organizer: event.organizer_id ? 
                `${event.organizer_id.first_name} ${event.organizer_id.last_name}` : 
                'Unknown'
        }));
        
        res.json({ 
            success: true, 
            events: formattedEvents 
        });
        
    } catch (error) {
        console.error('Error searching events:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error searching events' 
        });
    }
});

// GET /api/events/:eventId - Get event details
router.get('/events/:eventId', async (req, res) => {
    try {
        const eventId = req.params.eventId;
        
        console.log(`API: Fetching event details for ${eventId}`);
        
        const event = await Event.findById(eventId)
            .populate('organizer_id', 'first_name last_name');
        
        if (!event) {
            return res.status(404).json({ 
                success: false, 
                message: 'Event not found' 
            });
        }
        
        const formattedEvent = {
            id: event._id,
            name: event.name,
            description: event.description,
            date: event.date,
            location: event.location,
            sport_type: event.sport_type,
            max_participants: event.max_participants,
            organizer: event.organizer_id ? 
                `${event.organizer_id.first_name} ${event.organizer_id.last_name}` : 
                'Unknown'
        };
        
        res.json({ 
            success: true, 
            event: formattedEvent 
        });
        
    } catch (error) {
        console.error('Error fetching event details:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error fetching event details' 
        });
    }
});

module.exports = router;