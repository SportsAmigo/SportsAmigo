const Event = require('../models/event');
const Team = require('../models/team');

/**
 * Controller for event-related operations
 */
module.exports = {
    /**
     * Create a new event
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    createEvent: async (req, res) => {
        try {
            const organizerId = req.session.user._id;
            
            const eventData = {
                organizer_id: organizerId,
                title: req.body.title,
                description: req.body.description || '',
                sport_type: req.body.sport_type,
                event_date: req.body.event_date,
                event_time: req.body.event_time,
                location: req.body.location,
                max_teams: req.body.max_teams || 0,
                entry_fee: req.body.entry_fee || 0,
                registration_deadline: req.body.registration_deadline || null,
                status: req.body.status || 'upcoming'
            };
            
            const event = await Event.createEvent(eventData);
            
            // Set success message
            req.session.flashMessage = {
                type: 'success',
                text: 'Event created successfully!'
            };
            
            return res.redirect(`/organizer/events/${event._id}`);
        } catch (err) {
            console.error('Error creating event:', err);
            req.session.flashMessage = {
                type: 'error',
                text: 'Error creating event. Please try again.'
            };
            return res.redirect('/organizer/events/new');
        }
    },
    
    /**
     * Get all events
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    getAllEvents: async (req, res) => {
        try {
            const events = await Event.getAllEvents();
            return res.status(200).json(events);
        } catch (err) {
            console.error('Error fetching events:', err);
            return res.status(500).json({ error: 'Error fetching events' });
        }
    },
    
    /**
     * Get a single event by ID
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    getEventById: async (req, res) => {
        try {
            const eventId = req.params.id;
            const event = await Event.getEventById(eventId);
            
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }
            
            return res.status(200).json(event);
        } catch (err) {
            console.error('Error fetching event:', err);
            return res.status(500).json({ error: 'Error fetching event' });
        }
    },
    
    /**
     * Update an event
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    updateEvent: async (req, res) => {
        try {
            const eventId = req.params.id;
            const organizerId = req.session.user._id;
            
            // Verify event ownership
            const event = await Event.getEventById(eventId);
            
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }
            
            if (event.organizer_id.toString() !== organizerId.toString()) {
                return res.status(403).json({ error: 'Not authorized to update this event' });
            }
            
            const eventData = {
                title: req.body.title,
                description: req.body.description,
                sport_type: req.body.sport_type,
                event_date: req.body.event_date,
                event_time: req.body.event_time,
                location: req.body.location,
                max_teams: req.body.max_teams,
                entry_fee: req.body.entry_fee,
                registration_deadline: req.body.registration_deadline,
                status: req.body.status
            };
            
            await Event.updateEvent(eventId, eventData);
            
            // Set success message
            req.session.flashMessage = {
                type: 'success',
                text: 'Event updated successfully!'
            };
            
            return res.redirect(`/organizer/events/${eventId}`);
        } catch (err) {
            console.error('Error updating event:', err);
            req.session.flashMessage = {
                type: 'error',
                text: 'Error updating event. Please try again.'
            };
            return res.redirect(`/organizer/events/${req.params.id}/edit`);
        }
    },
    
    /**
     * Delete an event
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    deleteEvent: async (req, res) => {
        try {
            const eventId = req.params.id;
            const organizerId = req.session.user._id;
            
            // Verify event ownership
            const event = await Event.getEventById(eventId);
            
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }
            
            if (event.organizer_id.toString() !== organizerId.toString()) {
                return res.status(403).json({ error: 'Not authorized to delete this event' });
            }
            
            await Event.deleteEvent(eventId);
            
            // Set success message
            req.session.flashMessage = {
                type: 'success',
                text: 'Event deleted successfully!'
            };
            
            return res.redirect('/organizer/events');
        } catch (err) {
            console.error('Error deleting event:', err);
            req.session.flashMessage = {
                type: 'error',
                text: 'Error deleting event. Please try again.'
            };
            return res.redirect(`/organizer/events/${req.params.id}`);
        }
    },
    
    /**
     * Register a team for an event
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    registerTeamForEvent: async (req, res) => {
        try {
            const eventId = req.params.id;
            const teamId = req.body.team_id;
            const userId = req.session.user._id;
            
            // Verify team ownership if manager is registering
            if (req.session.user.role === 'manager') {
                const team = await Team.getTeamById(teamId);
                
                if (!team) {
                    return res.status(404).json({ error: 'Team not found' });
                }
                
                if (team.manager_id.toString() !== userId.toString()) {
                    return res.status(403).json({ error: 'Not authorized to register this team' });
                }
            }
            
            await Event.registerTeamForEvent(eventId, teamId);
            
            // Set success message
            req.session.flashMessage = {
                type: 'success',
                text: 'Team registered for event successfully!'
            };
            
            return res.redirect(`/${req.session.user.role}/events/${eventId}`);
        } catch (err) {
            console.error('Error registering team for event:', err);
            req.session.flashMessage = {
                type: 'error',
                text: `Error registering team: ${err.message}`
            };
            return res.redirect(`/${req.session.user.role}/events/${req.params.id}`);
        }
    },
    
    /**
     * Update registration status
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    updateRegistrationStatus: async (req, res) => {
        try {
            const eventId = req.params.id;
            const teamId = req.params.teamId;
            const status = req.body.status;
            const organizerId = req.session.user._id;
            
            // Verify event ownership
            const event = await Event.getEventById(eventId);
            
            if (!event) {
                return res.status(404).json({ error: 'Event not found' });
            }
            
            if (event.organizer_id.toString() !== organizerId.toString()) {
                return res.status(403).json({ error: 'Not authorized to manage this event' });
            }
            
            await Event.updateRegistrationStatus(eventId, teamId, status);
            
            // Set success message
            req.session.flashMessage = {
                type: 'success',
                text: `Registration ${status} successfully!`
            };
            
            return res.redirect(`/organizer/events/${eventId}/registrations`);
        } catch (err) {
            console.error('Error updating registration status:', err);
            req.session.flashMessage = {
                type: 'error',
                text: 'Error updating registration status. Please try again.'
            };
            return res.redirect(`/organizer/events/${req.params.id}/registrations`);
        }
    },
    
    /**
     * Get events by organizer
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    getEventsByOrganizer: async (req, res) => {
        try {
            const organizerId = req.session.user._id;
            
            const events = await Event.getEventsByOrganizer(organizerId);
            
            return res.status(200).json(events);
        } catch (err) {
            console.error('Error fetching organizer events:', err);
            return res.status(500).json({ error: 'Error fetching events' });
        }
    },
    
    /**
     * Get events a team is registered for
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    getTeamEvents: async (req, res) => {
        try {
            const teamId = req.params.id;
            
            const events = await Event.getTeamEvents(teamId);
            
            return res.status(200).json(events);
        } catch (err) {
            console.error('Error fetching team events:', err);
            return res.status(500).json({ error: 'Error fetching events' });
        }
    }
};
