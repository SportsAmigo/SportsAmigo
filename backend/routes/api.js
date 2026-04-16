const express = require('express');
const router = express.Router();
const { processEventRegistrationPayment, getRegistrationCommissionBreakdown } = require('../controllers/eventPaymentController');

// Event payment routes
/**
 * @swagger
 * /api/events/{eventId}/register-and-pay:
 *   post:
 *     summary: Register and pay for an event
 *     description: Starts event registration payment flow for the authenticated user.
 *     tags: [General]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Payment flow processed successfully
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error while processing payment
 */
router.post('/events/:eventId/register-and-pay', processEventRegistrationPayment);

/**
 * @swagger
 * /api/events/{eventId}/commission-breakdown:
 *   get:
 *     summary: Get commission breakdown for event registration
 *     tags: [General]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Commission breakdown fetched successfully
 *       404:
 *         description: Event not found
 *       500:
 *         description: Server error while fetching commission breakdown
 */
router.get('/events/:eventId/commission-breakdown', getRegistrationCommissionBreakdown);
const User = require('../models/user');
const Event = require('../models/event');
const Team = require('../models/team');
const TeamSchema = require('../models/schemas/teamSchema');
const EventSchema = require('../models/schemas/eventSchema');
const Registration = require('../models/registration');
const cacheMiddleware = require('../middleware/cacheMiddleware');
const { invalidateCacheByPrefixes } = require('../utils/cacheInvalidation');

/**
 * API Routes for AJAX functionality in dashboard pages
 */

// GET /api/dashboard-stats - Live dashboard statistics
/**
 * @swagger
 * /api/dashboard-stats:
 *   get:
 *     summary: Get live dashboard statistics
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalEvents:
 *                   type: integer
 *                 activeTeams:
 *                   type: integer
 *                 totalPlayers:
 *                   type: integer
 *                 totalTeams:
 *                   type: integer
 *       500:
 *         description: Failed to fetch dashboard stats
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/dashboard-stats', cacheMiddleware(30), async (req, res) => {
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
/**
 * @swagger
 * /api/teams/{teamId}/join:
 *   post:
 *     summary: Request to join a team
 *     tags: [General]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Join request sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: User is not logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Team not found
 *       500:
 *         description: Failed to request team join
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
        
        // Use Team model method to add join request
        const result = await Team.addJoinRequest(teamId, userId);
        
        // Get team details for success message
        const team = await Team.getTeamById(teamId);
        const teamName = team ? team.name : 'the team';
        
        console.log('Team join request successful:', { teamId, teamName });

        await invalidateCacheByPrefixes([
            '/api/dashboard-stats',
            '/player/browse-events'
        ]);
        
        res.json({ 
            success: true, 
            message: `Your request to join ${teamName} has been sent to the team manager. You will be notified when it's approved.`
        });
        
    } catch (error) {
        console.error('Error joining team via API:', error);
        res.status(500).json({ 
            success: false, 
            message: `Error requesting to join team: ${error.message}` 
        });
    }
});

// POST /api/teams/:teamId/leave - Leave a team
/**
 * @swagger
 * /api/teams/{teamId}/leave:
 *   post:
 *     summary: Leave a team
 *     tags: [General]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *         description: Team ID
 *     responses:
 *       200:
 *         description: Team left successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         description: User is not logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Team not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to leave team
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

        await invalidateCacheByPrefixes([
            '/api/dashboard-stats',
            '/player/browse-events'
        ]);
        
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
/**
 * @swagger
 * /api/events/{eventId}/register:
 *   post:
 *     summary: Register authenticated user for an event
 *     tags: [General]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: User already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Registration failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
        const event = await EventSchema.findById(eventId);
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

        await invalidateCacheByPrefixes([
            '/api/dashboard-stats',
            '/player/browse-events'
        ]);
        
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
/**
 * @swagger
 * /api/events/{eventId}/unregister:
 *   post:
 *     summary: Unregister authenticated user from an event
 *     tags: [General]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Unregistration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: User is not registered for this event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Unregistration failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
        
        const event = await EventSchema.findById(eventId);

        await invalidateCacheByPrefixes([
            '/api/dashboard-stats',
            '/player/browse-events'
        ]);

        res.json({ 
            success: true, 
            message: `Successfully unregistered from ${event?.title || 'event'}` 
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
/**
 * @swagger
 * /api/check-email:
 *   post:
 *     summary: Check email availability
 *     tags: [General]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email availability result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 available:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         description: Email was not provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to check email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
/**
 * @swagger
 * /api/search-events:
 *   post:
 *     summary: Search events by text and sport category
 *     tags: [General]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: Text query applied on name, description, and location
 *               category:
 *                 type: string
 *                 description: Sport type filter
 *     responses:
 *       200:
 *         description: Matching events list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 events:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       date:
 *                         type: string
 *                       location:
 *                         type: string
 *                       sport:
 *                         type: string
 *                       organizer:
 *                         type: string
 *       500:
 *         description: Search failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/search-events', async (req, res) => {
    try {
        const { query, category } = req.body;
        
        console.log(`API: Searching events for "${query}" in category "${category}"`);
        
        const events = await Event.searchEvents({
            query,
            category,
            statuses: ['upcoming', 'ongoing', 'completed', 'open'],
            limit: 20
        });

        const organizerIds = [...new Set(events.map(event => event.organizer_id).filter(Boolean).map(String))];
        const organizers = organizerIds.length > 0
            ? await User.find({ _id: { $in: organizerIds } }).select('_id first_name last_name').lean()
            : [];

        const organizerMap = organizers.reduce((map, organizer) => {
            map[String(organizer._id)] = organizer;
            return map;
        }, {});
        
        // Format events for response
        const formattedEvents = events.map(event => ({
            id: event._id,
            title: event.title || event.name,
            description: event.description || '',
            date: event.event_date ? new Date(event.event_date).toLocaleDateString() : '',
            location: event.location || '',
            sport: event.sport_type || event.category,
            organizer: organizerMap[String(event.organizer_id)]
                ? `${organizerMap[String(event.organizer_id)].first_name} ${organizerMap[String(event.organizer_id)].last_name}`
                : 'Unknown'
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
/**
 * @swagger
 * /api/events/{eventId}:
 *   get:
 *     summary: Get event details
 *     tags: [General]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 event:
 *                   type: object
 *       404:
 *         description: Event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Failed to fetch event details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/events/:eventId', async (req, res) => {
    try {
        const eventId = req.params.eventId;
        
        console.log(`API: Fetching event details for ${eventId}`);
        
        const event = await EventSchema.findById(eventId)
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