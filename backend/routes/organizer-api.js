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
            registered_teams: event.team_registrations?.length || 0,
            team_registrations: event.team_registrations || []
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
        
        // Validate required fields
        const errors = [];
        
        if (!req.body.first_name || !req.body.first_name.trim()) {
            errors.push('First name is required');
        } else if (!/^[A-Za-z\s]{2,50}$/.test(req.body.first_name.trim())) {
            errors.push('First name must be 2-50 letters only');
        }
        
        if (!req.body.last_name || !req.body.last_name.trim()) {
            errors.push('Last name is required');
        } else if (!/^[A-Za-z\s]{2,50}$/.test(req.body.last_name.trim())) {
            errors.push('Last name must be 2-50 letters only');
        }
        
        if (!req.body.phone || !req.body.phone.trim()) {
            errors.push('Phone number is required');
        } else if (!/^[6-9]\d{9}$/.test(req.body.phone.trim())) {
            errors.push('Phone must be 10 digits starting with 6-9');
        }
        
        if (!req.body.organization || !req.body.organization.trim()) {
            errors.push('Organization is required');
        } else if (!/^[A-Za-z\s]{2,100}$/.test(req.body.organization.trim())) {
            errors.push('Organization must be 2-100 letters only');
        }
        
        if (!req.body.age) {
            errors.push('Age is required');
        } else {
            const age = parseInt(req.body.age);
            if (isNaN(age) || age < 18 || age > 100) {
                errors.push('Age must be between 18 and 100');
            }
        }
        
        if (!req.body.address || !req.body.address.trim()) {
            errors.push('Address is required');
        } else if (req.body.address.length < 10 || req.body.address.length > 200) {
            errors.push('Address must be 10-200 characters');
        }
        
        if (req.body.bio && req.body.bio.length > 500) {
            errors.push('Bio must not exceed 500 characters');
        }
        
        if (errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: errors.join(', ')
            });
        }
        
        const updateData = {
            first_name: req.body.first_name.trim(),
            last_name: req.body.last_name.trim(),
            phone: req.body.phone.trim(),
            bio: req.body.bio || ''
        };
        
        // Handle nested profile fields (age, address, organization)
        if (req.body.age !== undefined) {
            updateData['profile.age'] = parseInt(req.body.age, 10);
        }
        if (req.body.address !== undefined) {
            updateData['profile.address'] = req.body.address.trim();
        }
        if (req.body.organization !== undefined) {
            updateData['profile.organization_name'] = req.body.organization.trim();
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

module.exports = router;
