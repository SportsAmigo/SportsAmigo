const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { uploadProfileImage } = require('../middleware/uploadCloudinary');

// Middleware to check if user is logged in as organizer
function isOrganizerAPI(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'organizer') {
        next();
    } else {
        res.status(401).json({
            success: false,
            message: 'Unauthorized. Please login as organizer.'
        });
    }
}

// Apply middleware to all routes
router.use(isOrganizerAPI);

/**
 * @swagger
 * /api/organizer/stats:
 *   get:
 *     summary: Get organizer dashboard statistics
 *     tags: [Organizer]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Statistics returned
 *       500:
 *         description: Failed to fetch statistics
 *
 * /api/organizer/events:
 *   get:
 *     summary: Get organizer events list
 *     tags: [Organizer]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Organizer events returned
 *
 * /api/organizer/create-event:
 *   post:
 *     summary: Create new organizer event
 *     tags: [Organizer]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       201:
 *         description: Event created
 *       400:
 *         description: Validation error
 *
 * /api/organizer/event/{id}:
 *   get:
 *     summary: Get single organizer event details
 *     tags: [Organizer]
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
 *         description: Event details returned
 *       404:
 *         description: Event not found
 *   put:
 *     summary: Update organizer event
 *     tags: [Organizer]
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
 *         description: Event updated
 *       400:
 *         description: Invalid input
 *   delete:
 *     summary: Delete organizer event
 *     tags: [Organizer]
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
 *       404:
 *         description: Event not found
 *
 * /api/organizer/event/{id}/cancel:
 *   put:
 *     summary: Cancel organizer event
 *     tags: [Organizer]
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
 *         description: Event cancelled
 *
 * /api/organizer/profile:
 *   get:
 *     summary: Get organizer profile
 *     tags: [Organizer]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Profile returned
 *   put:
 *     summary: Update organizer profile
 *     tags: [Organizer]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profile_image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated
 *
 * /api/organizer/change-password:
 *   put:
 *     summary: Change organizer password
 *     tags: [Organizer]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *
 * /api/organizer/event/{eventId}/approve-team/{teamId}:
 *   put:
 *     summary: Approve team registration for event
 *     tags: [Organizer]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team approved
 *
 * /api/organizer/event/{eventId}/reject-team/{teamId}:
 *   put:
 *     summary: Reject team registration for event
 *     tags: [Organizer]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team rejected
 *
 * /api/organizer/event/{eventId}/schedule-matches:
 *   post:
 *     summary: Generate event match schedule
 *     tags: [Organizer]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Match schedule generated
 *
 * /api/organizer/event/{eventId}/finalize-schedule:
 *   post:
 *     summary: Finalize generated match schedule
 *     tags: [Organizer]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Schedule finalized
 *
 * /api/organizer/events/{eventId}/export-participants-csv:
 *   get:
 *     summary: Export event participants as CSV
 *     tags: [Organizer]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CSV stream returned
 *
 * /api/organizer/events/{eventId}/export-matches-csv:
 *   get:
 *     summary: Export event matches as CSV
 *     tags: [Organizer]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CSV stream returned
 */

function resolveUploadedImagePath(file) {
    if (!file) return null;
    if (file.secure_url) return file.secure_url;
    if (file.path && /^https?:\/\//i.test(String(file.path))) return file.path;
    if (file.filename) return `/uploads/profile/${file.filename}`;
    return null;
}

// GET /api/organizer/stats - Dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        const Event = require('../models/event');
        const organizerId = req.session.user._id;
        
        const events = await Event.getEventsByOrganizer(organizerId);
        
        const now = new Date();
        const upcomingEvents = events.filter(e => 
            new Date(e.start_date || e.event_date) > now && 
            e.status !== 'cancelled' &&
            e.status !== 'completed'
        ).length;
        
        const completedEvents = events.filter(e => 
            e.status === 'completed' || 
            new Date(e.end_date || e.event_date) < now
        ).length;
        
        const totalParticipants = events.reduce((sum, event) => 
            sum + (event.registered_teams || event.team_registrations?.length || 0), 0
        );
        
        res.json({
            success: true,
            stats: {
                totalEvents: events.length,
                upcomingEvents: upcomingEvents,
                completedEvents: completedEvents,
                totalParticipants: totalParticipants
            }
        });
    } catch (error) {
        console.error('Error fetching organizer stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch statistics',
            error: error.message 
        });
    }
});

// GET /api/organizer/events - Get all organizer events
router.get('/events', async (req, res) => {
    try {
        const Event = require('../models/event');
        const organizerId = req.session.user._id;
        
        const events = await Event.getEventsByOrganizer(organizerId);
        
        // Filter for approved events only (for VAS purchases, etc.)
        const approvedEvents = events.filter(event => 
            event.status === 'approved' || 
            event.status === 'upcoming' || 
            event.status === 'ongoing' || 
            event.status === 'completed'
        );
        
        const formattedEvents = approvedEvents.map(event => {
            const now = new Date();
            const startDate = new Date(event.start_date || event.event_date);
            const endDate = new Date(event.end_date || event.event_date);
            
            let status = event.status || 'scheduled';
            if (endDate < now) status = 'completed';
            else if (startDate <= now && endDate >= now) status = 'ongoing';
            else if (startDate > now) status = 'upcoming';
            
            return {
                _id: event._id,
                name: event.title || event.name,
                sport: event.sport_type || event.sport,
                location: event.location,
                start_date: event.start_date || event.event_date,
                end_date: event.end_date || event.event_date,
                registration_deadline: event.registration_deadline,
                max_teams: event.max_teams || 0,
                entry_fee: event.entry_fee || 0,
                status: status,
                registered_teams: event.team_registrations?.length || 0,
                created_at: event.created_at || new Date()
            };
        });
        
        res.json({ success: true, events: formattedEvents });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch events',
            error: error.message 
        });
    }
});

// POST /api/organizer/create-event - Create new event
router.post('/create-event', async (req, res) => {
    try {
        const Event = require('../models/event');
        const User = require('../models/user');
        
        // Check if organizer is verified
        const organizer = await User.getUserById(req.session.user._id);
        if (!organizer) {
            return res.status(404).json({ 
                success: false, 
                message: 'Organizer account not found' 
            });
        }
        
        if (organizer.verificationStatus !== 'verified') {
            return res.status(403).json({ 
                success: false, 
                message: 'Your account must be verified by a coordinator before you can create events. Please wait for approval.',
                verificationStatus: organizer.verificationStatus
            });
        }
        
        // Validation
        if (!req.body.name) {
            return res.status(400).json({ success: false, message: 'Event name is required' });
        }
        if (!req.body.sport) {
            return res.status(400).json({ success: false, message: 'Sport type is required' });
        }
        if (!req.body.start_date) {
            return res.status(400).json({ success: false, message: 'Start date is required' });
        }
        if (!req.body.location) {
            return res.status(400).json({ success: false, message: 'Location is required' });
        }
        
        // Check if start date is in the future
        if (new Date(req.body.start_date) <= new Date()) {
            return res.status(400).json({ 
                success: false, 
                message: 'Event start date must be in the future' 
            });
        }
        
        // Check if end date is after start date
        if (req.body.end_date && new Date(req.body.end_date) < new Date(req.body.start_date)) {
            return res.status(400).json({ 
                success: false, 
                message: 'End date must be after start date' 
            });
        }
        
        // Check if registration deadline is before start date
        if (req.body.registration_deadline) {
            if (new Date(req.body.registration_deadline) >= new Date(req.body.start_date)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Registration deadline must be before event start date' 
                });
            }
        }
        
        const eventData = {
            organizer_id: req.session.user._id,
            title: req.body.name,
            description: req.body.description || '',
            sport_type: req.body.sport,
            event_date: req.body.start_date,
            start_date: req.body.start_date,
            end_date: req.body.end_date || req.body.start_date,
            event_time: req.body.event_time || '10:00',
            location: req.body.location,
            max_teams: parseInt(req.body.max_teams) || 16,
            entry_fee: parseFloat(req.body.entry_fee) || 0,
            registration_deadline: req.body.registration_deadline || null,
            status: 'pending_approval',
            team_registrations: []
        };
        
        const newEvent = await Event.createEvent(eventData);
        
        res.status(201).json({
            success: true,
            message: 'Event created successfully! It will be visible to players once approved by a coordinator.',
            event: {
                _id: newEvent._id,
                name: newEvent.title,
                sport: newEvent.sport_type,
                location: newEvent.location,
                start_date: newEvent.start_date || newEvent.event_date,
                status: newEvent.status
            }
        });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create event',
            error: error.message 
        });
    }
});

// GET /api/organizer/event/:id - Get single event details
router.get('/event/:id', async (req, res) => {
    try {
        const Event = require('../models/event');
        const TeamSchema = require('../models/schemas/teamSchema');
        
        const event = await Event.getEventById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        
        // Check if current user is the organizer
        if (event.organizer_id.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to view this event' 
            });
        }

        // Populate team_id in team_registrations
        let teamRegistrations = [];
        if (event.team_registrations && event.team_registrations.length > 0) {
            const UserSchema = require('../models/schemas/userSchema');
            teamRegistrations = await Promise.all(
                event.team_registrations.map(async (reg) => {
                    try {
                        const team = await TeamSchema.findById(reg.team_id);
                        if (!team) {
                            return {
                                team_id: reg.team_id,
                                team_name: 'Unknown Team',
                                manager_name: 'Unknown Manager',
                                status: reg.status,
                                registration_date: reg.registered_at,
                                players: []
                            };
                        }

                        // Get manager details
                        const manager = await UserSchema.findById(team.manager_id)
                            .select('first_name last_name')
                            .exec();
                        
                        // Get player details from members
                        let players = [];
                        if (team.members && team.members.length > 0) {
                            const playerIds = team.members.map(m => m.player_id);
                            const playerUsers = await UserSchema.find({ _id: { $in: playerIds } })
                                .select('first_name last_name')
                                .exec();
                            players = playerUsers.map(p => ({
                                name: `${p.first_name} ${p.last_name}`
                            }));
                        }

                        return {
                            team_id: team._id,
                            team_name: team.name || 'Unknown Team',
                            manager_name: manager ? `${manager.first_name} ${manager.last_name}` : 'Unknown Manager',
                            status: reg.status,
                            registration_date: reg.registered_at,
                            players: players
                        };
                    } catch (err) {
                        console.error('Error populating team:', err);
                        return {
                            team_id: reg.team_id,
                            team_name: 'Unknown Team',
                            manager_name: 'Unknown Manager',
                            status: reg.status,
                            registration_date: reg.registered_at,
                            players: []
                        };
                    }
                })
            );
        }
        
        const formattedEvent = {
            _id: event._id,
            name: event.title,
            description: event.description,
            sport: event.sport_type,
            location: event.location,
            start_date: event.start_date || event.event_date,  // Use start_date first, fallback to event_date
            end_date: event.end_date || event.start_date || event.event_date,  // Use end_date, fallback to start_date
            event_time: event.event_time,
            max_teams: event.max_teams,
            entry_fee: event.entry_fee || 0,
            registration_deadline: event.registration_deadline,
            status: event.status,
            registered_teams: teamRegistrations.length,
            team_registrations: teamRegistrations
        };
        
        res.json({ success: true, event: formattedEvent });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch event details',
            error: error.message 
        });
    }
});

// PUT /api/organizer/event/:id - Update event
router.put('/event/:id', async (req, res) => {
    try {
        const Event = require('../models/event');
        const event = await Event.getEventById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        
        // Check permission
        if (event.organizer_id.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to update this event' 
            });
        }
        
        // Backend validation for event name and location
        const validationErrors = {};
        
        if (req.body.name) {
            if (/^\d+$/.test(req.body.name.trim())) {
                validationErrors.name = 'Event name cannot contain only numbers. Please include at least one letter.';
            } else if (!/[a-zA-Z]/.test(req.body.name.trim())) {
                validationErrors.name = 'Event name must contain at least one letter.';
            }
        }
        
        if (req.body.location) {
            if (/^\d+$/.test(req.body.location.trim())) {
                validationErrors.location = 'Location cannot contain only numbers. Please include at least one letter.';
            } else if (!/[a-zA-Z]/.test(req.body.location.trim())) {
                validationErrors.location = 'Location must contain at least one letter.';
            }
        }
        
        if (Object.keys(validationErrors).length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation failed',
                errors: validationErrors
            });
        }
        
        const updateData = {
            title: req.body.name || req.body.title || event.title,
            description: req.body.description !== undefined ? req.body.description : event.description,
            sport_type: req.body.sport || req.body.sport_type || event.sport_type,
            event_date: req.body.start_date || event.start_date || event.event_date,  // Legacy field
            start_date: req.body.start_date || event.start_date || event.event_date,  // Proper start date
            end_date: req.body.end_date || event.end_date || event.start_date || event.event_date,  // End date
            event_time: req.body.event_time || event.event_time,
            location: req.body.location || event.location,
            max_teams: req.body.max_teams ? parseInt(req.body.max_teams) : event.max_teams,
            entry_fee: (req.body.entry_fee !== undefined && req.body.entry_fee !== '' && req.body.entry_fee !== null) ? parseFloat(req.body.entry_fee) || 0 : (event.entry_fee || 0),
            registration_deadline: req.body.registration_deadline || event.registration_deadline,
            status: req.body.status || event.status
        };
        
        await Event.updateEvent(req.params.id, updateData);
        
        // Fetch updated event to return fresh data
        const updatedEvent = await Event.getEventById(req.params.id);
        
        res.json({
            success: true,
            message: 'Event updated successfully',
            event: {
                _id: updatedEvent._id,
                name: updatedEvent.title,
                sport: updatedEvent.sport_type,
                location: updatedEvent.location,
                start_date: updatedEvent.start_date || updatedEvent.event_date,
                end_date: updatedEvent.end_date || updatedEvent.start_date || updatedEvent.event_date,
                registration_deadline: updatedEvent.registration_deadline
            }
        });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update event',
            error: error.message 
        });
    }
});

// DELETE /api/organizer/event/:id - Delete event
router.delete('/event/:id', async (req, res) => {
    try {
        const Event = require('../models/event');
        const event = await Event.getEventById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        
        // Check permission
        if (event.organizer_id.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to delete this event' 
            });
        }
        
        await Event.deleteEvent(req.params.id);
        
        res.json({
            success: true,
            message: 'Event deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete event',
            error: error.message 
        });
    }
});

// PUT /api/organizer/event/:id/cancel - Cancel event (marks as cancelled)
router.put('/event/:id/cancel', async (req, res) => {
    try {
        const Event = require('../models/event');
        const event = await Event.getEventById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }
        
        // Check permission
        if (event.organizer_id.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'You do not have permission to cancel this event' 
            });
        }
        
        await Event.cancelEvent(req.params.id);
        
        res.json({
            success: true,
            message: 'Event cancelled successfully'
        });
    } catch (error) {
        console.error('Error cancelling event:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to cancel event',
            error: error.message 
        });
    }
});

// GET /api/organizer/profile - Get organizer profile
router.get('/profile', async (req, res) => {
    try {
        const User = require('../models/user');
        const Event = require('../models/event');
        
        const user = await User.getUserById(req.session.user._id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Get event statistics
        const events = await Event.getEventsByOrganizer(req.session.user._id);
        const upcomingEvents = events.filter(e => 
            new Date(e.start_date || e.event_date) > new Date()
        ).length;
        
        const memberSince = user.created_at 
            ? new Date(user.created_at).toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric'
            })
            : 'November 2025';
        
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.first_name + (user.last_name ? ' ' + user.last_name : ''),
                email: user.email,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                phone: user.phone || '',
                age: user.profile?.age || '',
                address: user.profile?.address || '',
                bio: user.bio || '',
                organization: user.profile?.organization_name || '',
                profile_image: user.profile_image || '/images/default-avatar.png',
                role: user.role,
                status: 'Active',
                member_since: memberSince,
                total_events: events.length,
                upcoming_events: upcomingEvents
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch profile',
            error: error.message 
        });
    }
});

// PUT /api/organizer/profile - Update organizer profile (with image upload)
router.put('/profile', uploadProfileImage, async (req, res) => {
    try {
        const User = require('../models/user');
        const userId = req.session.user._id;
        
        console.log('=== Profile Update Request ===');
        console.log('User ID:', userId);
        console.log('Request body:', req.body);
        console.log('File uploaded:', req.file ? req.file.filename : 'No file');
        
        const updateData = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            phone: req.body.phone,
            bio: req.body.bio
        };
        
        // Handle nested profile fields (age, address, organization)
        if (req.body.age !== undefined && req.body.age !== '') {
            updateData['profile.age'] = parseInt(req.body.age, 10);
        }
        if (req.body.address !== undefined && req.body.address !== '') {
            updateData['profile.address'] = req.body.address;
        }
        if (req.body.organization !== undefined && req.body.organization !== '') {
            updateData['profile.organization_name'] = req.body.organization;
        }
        
        // If profile image was uploaded
        if (req.file) {
            updateData.profile_image = resolveUploadedImagePath(req.file);
        }
        
        console.log('Update data prepared:', updateData);
        
        // Use User model's findByIdAndUpdate directly
        const mongoose = require('mongoose');
        const UserModel = mongoose.model('User');
        
        const updatedUser = await UserModel.findByIdAndUpdate(
            userId, 
            { $set: updateData },
            { new: true, runValidators: true }
        );
        
        if (!updatedUser) {
            console.error('User not found or update failed');
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to update profile in database' 
            });
        }
        
        console.log('Profile updated successfully');
        
        // Prepare session user object
        const sessionUser = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
        sessionUser.name = sessionUser.first_name + (sessionUser.last_name ? ' ' + sessionUser.last_name : '');
        
        // Update session
        req.session.user = sessionUser;
        
        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        
        console.log('Session updated successfully');
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: sessionUser._id,
                name: sessionUser.name,
                email: sessionUser.email,
                first_name: sessionUser.first_name,
                last_name: sessionUser.last_name,
                phone: sessionUser.phone,
                age: sessionUser.profile?.age || '',
                address: sessionUser.profile?.address || '',
                bio: sessionUser.bio,
                organization: sessionUser.profile?.organization_name || '',
                profile_image: sessionUser.profile_image,
                role: sessionUser.role
            }
        });
    } catch (error) {
        console.error('=== Profile Update Error ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update profile',
            error: error.message 
        });
    }
});

// PUT /api/organizer/change-password - Change password
router.put('/change-password', async (req, res) => {
    try {
        const User = require('../models/user');
        const userId = req.session.user._id;
        const { oldPassword, newPassword } = req.body;
        
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Old password and new password are required' 
            });
        }
        
        // Get user from database
        const user = await User.getUserById(userId);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Verify old password
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ 
                success: false, 
                message: 'Current password is incorrect' 
            });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Update password in database
        await User.updateUser(userId, { password: hashedPassword });
        
        res.json({ 
            success: true, 
            message: 'Password changed successfully' 
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to change password',
            error: error.message 
        });
    }
});

// PUT /api/organizer/event/:eventId/approve-team/:teamId - Approve team registration
router.put('/event/:eventId/approve-team/:teamId', isOrganizerAPI, async (req, res) => {
    try {
        const Event = require('../models/event');
        const { eventId, teamId } = req.params;
        const organizerId = req.session.user._id;

        // Get event and verify ownership
        const event = await Event.getEventById(eventId);
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (event.organizer_id.toString() !== organizerId.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'You are not authorized to approve teams for this event' 
            });
        }

        // Update team registration status
        const updated = await Event.approveTeamRegistration(eventId, teamId);

        if (!updated) {
            return res.status(400).json({ 
                success: false, 
                message: 'Failed to approve team. Team may not be found or already approved.' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Team registration approved successfully' 
        });
    } catch (error) {
        console.error('Approve team error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error approving team registration',
            error: error.message 
        });
    }
});

// PUT /api/organizer/event/:eventId/reject-team/:teamId - Reject team registration
router.put('/event/:eventId/reject-team/:teamId', isOrganizerAPI, async (req, res) => {
    try {
        const Event = require('../models/event');
        const { eventId, teamId } = req.params;
        const organizerId = req.session.user._id;

        // Get event and verify ownership
        const event = await Event.getEventById(eventId);
        
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (event.organizer_id.toString() !== organizerId.toString()) {
            return res.status(403).json({ 
                success: false, 
                message: 'You are not authorized to reject teams for this event' 
            });
        }

        // Update team registration status
        const updated = await Event.rejectTeamRegistration(eventId, teamId);

        if (!updated) {
            return res.status(400).json({ 
                success: false, 
                message: 'Failed to reject team. Team may not be found.' 
            });
        }

        res.json({ 
            success: true, 
            message: 'Team registration rejected' 
        });
    } catch (error) {
        console.error('Reject team error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error rejecting team registration',
            error: error.message 
        });
    }
});

// POST /api/organizer/event/:eventId/schedule-matches - Schedule matches for an event
router.post('/event/:eventId/schedule-matches', async (req, res) => {
    try {
        const { eventId } = req.params;
        const { matches } = req.body;
        const Match = require('../models/match');
        const Event = require('../models/event');

        console.log('📅 Scheduling matches for event:', eventId);
        console.log('📊 Total matches to create:', matches?.length);

        // Verify event exists and organizer owns it
        const event = await Event.getEventById(eventId);
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        if (event.organizer_id.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to schedule matches for this event'
            });
        }

        // Validate matches array
        if (!matches || !Array.isArray(matches) || matches.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Matches array is required and cannot be empty'
            });
        }

        const createdMatches = [];
        const errors = [];

        // Create each match
        for (let i = 0; i < matches.length; i++) {
            const matchData = matches[i];
            
            try {
                // Validate required fields
                if (!matchData.team_a || !matchData.team_b) {
                    errors.push(`Match ${matchData.match_number}: Missing teams`);
                    continue;
                }

                if (!matchData.match_date) {
                    errors.push(`Match ${matchData.match_number}: Missing date`);
                    continue;
                }

                if (matchData.team_a === matchData.team_b) {
                    errors.push(`Match ${matchData.match_number}: Teams must be different`);
                    continue;
                }

                // Create match in database
                const match = await Match.createMatch({
                    event_id: eventId,
                    team_a: matchData.team_a,
                    team_b: matchData.team_b,
                    team_a_name: matchData.team_a_name,
                    team_b_name: matchData.team_b_name,
                    match_date: new Date(matchData.match_date),
                    venue: matchData.venue || event.location || '',
                    round: matchData.round || 'Round 1',
                    match_number: matchData.match_number || (i + 1),
                    status: 'scheduled',
                    scheduled_by: req.session.user._id,
                    scheduled_at: new Date()
                });

                createdMatches.push(match);
                console.log(`✅ Created match ${match.match_number}`);

            } catch (error) {
                console.error(`❌ Error creating match ${matchData.match_number}:`, error);
                errors.push(`Match ${matchData.match_number}: ${error.message}`);
            }
        }

        // Return response
        if (createdMatches.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Failed to create any matches',
                errors: errors
            });
        }

        console.log(`✅ Successfully created ${createdMatches.length} matches`);

        res.status(201).json({
            success: true,
            message: `Successfully scheduled ${createdMatches.length} out of ${matches.length} matches`,
            matchesCreated: createdMatches.length,
            totalRequested: matches.length,
            matches: createdMatches,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('❌ Schedule matches error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to schedule matches',
            error: error.message
        });
    }
});

// POST /api/organizer/event/:eventId/finalize-schedule - Finalize the schedule (lock it)
router.post('/event/:eventId/finalize-schedule', async (req, res) => {
    try {
        const { eventId } = req.params;
        const Event = require('../models/event');
        const Match = require('../models/schemas/matchSchema');

        console.log('🔒 Finalizing schedule for event:', eventId);

        // Get event
        const event = await Event.getEventById(eventId);
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Check authorization
        if (event.organizer_id.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to finalize this event schedule'
            });
        }

        // Check if already finalized
        if (event.schedule_finalized) {
            return res.status(400).json({
                success: false,
                message: 'Schedule is already finalized'
            });
        }

        // Check if matches exist
        const matchCount = await Match.countDocuments({ event_id: eventId });
        
        if (matchCount === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot finalize schedule - no matches have been created yet'
            });
        }

        // Update event
        await Event.findByIdAndUpdate(eventId, {
            schedule_finalized: true,
            schedule_finalized_at: new Date(),
            schedule_finalized_by: req.session.user._id,
            $inc: { schedule_version: 1 }
        });

        console.log('✅ Schedule finalized successfully');

        res.json({
            success: true,
            message: 'Schedule finalized successfully. Matches are now locked.',
            matchCount: matchCount
        });

    } catch (error) {
        console.error('❌ Finalize schedule error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to finalize schedule',
            error: error.message
        });
    }
});

// GET /api/organizer/events/:eventId/export-participants-csv - Export approved participants as CSV (Pro/Enterprise)
router.get('/events/:eventId/export-participants-csv', async (req, res) => {
    try {
        const plan = req.session.user?.subscription?.plan || 'free';
        if (plan === 'free') {
            return res.status(403).json({ success: false, message: 'Upgrade to Pro or Enterprise to export participant data.' });
        }
        const Event = require('../models/event');
        const Team = require('../models/team');
        const User = require('../models/user');
        const { eventId } = req.params;
        const event = await Event.getEventById(eventId);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
        if (event.organizer_id.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const approvedRegs = (event.team_registrations || []).filter(r => r.status === 'approved');
        const rows = ['Team Name,Manager Name,Manager Email,Members,Registration Date'];
        for (const reg of approvedRegs) {
            try {
                const team = await Team.getTeamById(reg.team_id);
                if (!team) continue;
                const manager = await User.getUserById(team.manager_id);
                const managerName = manager ? `${manager.first_name || ''} ${manager.last_name || ''}`.trim() : 'N/A';
                const managerEmail = manager?.email || 'N/A';
                const members = team.members?.length || 0;
                const regDate = reg.registered_at ? new Date(reg.registered_at).toLocaleDateString() : 'N/A';
                rows.push(`"${(team.name || '').replace(/"/g,'""')}","${managerName.replace(/"/g,'""')}","${managerEmail}","${members}","${regDate}"`);
            } catch (e) { /* skip */ }
        }
        const csv = rows.join('\n');
        const filename = `${(event.title || 'event').replace(/[^a-z0-9]/gi,'_')}_participants.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting participants CSV:', error);
        res.status(500).json({ success: false, message: 'Failed to export data' });
    }
});

// GET /api/organizer/events/:eventId/export-matches-csv - Export match results as CSV (Pro/Enterprise)
router.get('/events/:eventId/export-matches-csv', async (req, res) => {
    try {
        const plan = req.session.user?.subscription?.plan || 'free';
        if (plan === 'free') {
            return res.status(403).json({ success: false, message: 'Upgrade to Pro or Enterprise to export match results.' });
        }
        const Match = require('../models/schemas/matchSchema');
        const Event = require('../models/event');
        const { eventId } = req.params;
        const event = await Event.getEventById(eventId);
        if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
        if (event.organizer_id.toString() !== req.session.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        const matches = await Match.find({ event_id: eventId }).sort({ match_date: 1 }).lean();
        const rows = ['Match Number,Team A,Team B,Score A,Score B,Status,Date'];
        matches.forEach((m, i) => {
            const teamA = `"${(m.team1_name || m.team_a_name || '').replace(/"/g,'""')}"`;
            const teamB = `"${(m.team2_name || m.team_b_name || '').replace(/"/g,'""')}"`;
            const scoreA = m.score_team1 ?? m.score_a ?? '-';
            const scoreB = m.score_team2 ?? m.score_b ?? '-';
            const status = m.status || 'scheduled';
            const date = m.match_date ? new Date(m.match_date).toLocaleDateString() : 'N/A';
            rows.push(`${i + 1},${teamA},${teamB},"${scoreA}","${scoreB}","${status}","${date}"`);
        });
        const csv = rows.join('\n');
        const filename = `${(event.title || 'event').replace(/[^a-z0-9]/gi,'_')}_matches.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting matches CSV:', error);
        res.status(500).json({ success: false, message: 'Failed to export data' });
    }
});

module.exports = router;
