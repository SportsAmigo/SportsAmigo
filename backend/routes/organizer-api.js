const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');

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

// Configure multer for profile image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/uploads/profile');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, 'profile-' + req.session.user._id + '-' + uniqueSuffix + extension);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5000000 }, // 5MB
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
        
        const formattedEvents = events.map(event => {
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
            status: 'upcoming',
            team_registrations: []
        };
        
        const newEvent = await Event.createEvent(eventData);
        
        res.status(201).json({
            success: true,
            message: 'Event created successfully!',
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
            teamRegistrations = await Promise.all(
                event.team_registrations.map(async (reg) => {
                    try {
                        const team = await TeamSchema.findById(reg.team_id);
                        return {
                            team_id: team ? {
                                _id: team._id,
                                name: team.name
                            } : reg.team_id,
                            status: reg.status,
                            registered_at: reg.registered_at
                        };
                    } catch (err) {
                        console.error('Error populating team:', err);
                        return reg;
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
            start_date: event.start_date || event.event_date,
            end_date: event.end_date || event.event_date,
            event_time: event.event_time,
            max_teams: event.max_teams,
            entry_fee: event.entry_fee,
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
        
        const updateData = {
            title: req.body.name || req.body.title,
            description: req.body.description,
            sport_type: req.body.sport || req.body.sport_type,
            event_date: req.body.start_date || req.body.event_date,
            start_date: req.body.start_date,
            end_date: req.body.end_date,
            event_time: req.body.event_time,
            location: req.body.location,
            max_teams: req.body.max_teams ? parseInt(req.body.max_teams) : event.max_teams,
            entry_fee: req.body.entry_fee !== undefined ? parseFloat(req.body.entry_fee) : event.entry_fee,
            registration_deadline: req.body.registration_deadline,
            status: req.body.status || event.status
        };
        
        await Event.updateEvent(req.params.id, updateData);
        
        res.json({
            success: true,
            message: 'Event updated successfully'
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
router.put('/profile', upload.single('profile_image'), async (req, res) => {
    try {
        const User = require('../models/user');
        const userId = req.session.user._id;
        
        const updateData = {
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            phone: req.body.phone,
            bio: req.body.bio
        };
        
        // Handle nested profile fields (age, address, organization)
        if (req.body.age !== undefined) {
            updateData['profile.age'] = req.body.age ? parseInt(req.body.age, 10) : null;
        }
        if (req.body.address !== undefined) {
            updateData['profile.address'] = req.body.address;
        }
        if (req.body.organization !== undefined) {
            updateData['profile.organization_name'] = req.body.organization;
        }
        
        // If profile image was uploaded
        if (req.file) {
            updateData.profile_image = `/uploads/profile/${req.file.filename}`;
        }
        
        console.log('Updating user with data:', updateData);
        
        // Update user in database using findByIdAndUpdate for nested fields
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            { $set: updateData },
            { new: true, runValidators: true }
        );
        
        if (!updatedUser) {
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to update profile in database' 
            });
        }
        
        console.log('Updated user from database:', updatedUser);
        
        // Prepare session user object
        const sessionUser = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
        sessionUser.name = sessionUser.first_name + (sessionUser.last_name ? ' ' + sessionUser.last_name : '');
        
        // Update session
        req.session.user = sessionUser;
        
        await new Promise((resolve, reject) => {
            req.session.save((err) => {
                if (err) reject(err);
                else resolve();
            });
        });
        
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
        console.error('Error updating profile:', error);
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

module.exports = router;
