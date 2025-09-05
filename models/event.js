// models/event.js should already define the Event schema.
// Replace your existing SQLite-based event.js with the following Mongoose version:

const Event = require('./schemas/eventSchema');
const Team = require('./schemas/teamSchema');
const User = require('./schemas/userSchema');
// Comment out the registration import if not needed for now
// const Registration = require('../models/registration'); 

/**
 * Event model for event management
 */
module.exports = {
  /**
   * Create a new event
   * @param {object} eventData - Event data
   * @returns {Promise<object>} - Promise resolving to the created event
   */
  createEvent: async function(eventData) {
    try {
      // Map form field names to schema field names
      const mappedData = {
        organizer_id: eventData.organizer_id,
        title: eventData.title || eventData.name,
        description: eventData.description || '',
        sport_type: eventData.sport_type || eventData.sport,
        event_date: eventData.event_date || eventData.start_date,
        event_time: eventData.event_time || '12:00',
        location: eventData.location,
        max_teams: eventData.max_teams || 0,
        entry_fee: eventData.entry_fee || 0,
        registration_deadline: eventData.registration_deadline || null,
        status: eventData.status || 'upcoming'
      };

      // Validate required fields
      if (!mappedData.organizer_id || !mappedData.title || !mappedData.sport_type || 
          !mappedData.event_date || !mappedData.event_time || !mappedData.location) {
        throw new Error('Organizer ID, title, sport type, event date, event time, and location are required');
      }

      const event = new Event({
        organizer_id: mappedData.organizer_id,
        title: mappedData.title,
        description: mappedData.description,
        sport_type: mappedData.sport_type,
        event_date: mappedData.event_date,
        event_time: mappedData.event_time,
        location: mappedData.location,
        max_teams: mappedData.max_teams,
        entry_fee: mappedData.entry_fee,
        registration_deadline: mappedData.registration_deadline,
        status: mappedData.status,
        team_registrations: []
      });
      
      return await event.save();
    } catch (err) {
      console.error('Error creating event:', err);
      throw err;
    }
  },
  
  /**
   * Get event by ID
   * @param {string} eventId - Event ID
   * @returns {Promise<object>} - Promise resolving to the event object
   */
  getEventById: async function(eventId) {
    try {
      if (!eventId) {
        throw new Error('Event ID is required');
      }
      
      // Get event
      const event = await Event.findById(eventId).exec();
      
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Get organizer information
      const organizer = await User.findById(event.organizer_id)
          .select('first_name last_name email')
          .exec();
      
      // Create result object with organizer info
      const result = {
        ...event.toObject(),
        organizer_first_name: organizer ? organizer.first_name : '',
        organizer_last_name: organizer ? organizer.last_name : '',
        organizer_email: organizer ? organizer.email : ''
      };
      
      // If the event has team registrations, get team information
      if (event.team_registrations && event.team_registrations.length > 0) {
        const teamIds = event.team_registrations.map(reg => reg.team_id);
        const teams = await Team.find({ _id: { $in: teamIds } })
            .select('name sport_type manager_id')
            .exec();
        
        // Create a map of team info by ID
        const teamsMap = teams.reduce((map, team) => {
          map[team._id.toString()] = team;
          return map;
        }, {});
        
        // Add team info to registrations
        result.team_registrations = event.team_registrations.map(reg => {
          const team = teamsMap[reg.team_id.toString()];
          return {
            ...reg.toObject(),
            team_name: team ? team.name : '',
            team_sport: team ? team.sport_type : ''
          };
        });
      }
      
      return result;
    } catch (err) {
      console.error('Error getting event by ID:', err);
      throw err;
    }
  },
  
  /**
   * Get all events
   * @returns {Promise<Array>} - Promise resolving to an array of event objects
   */
  getAllEvents: async function() {
    try {
      const events = await Event.find().sort({ event_date: 1 }).exec();
      
      // Get all organizer IDs
      const organizerIds = events.map(event => event.organizer_id);
      const organizers = await User.find({ _id: { $in: organizerIds } })
          .select('_id first_name last_name')
          .exec();
      
      // Create a map of organizer info by ID
      const organizersMap = organizers.reduce((map, organizer) => {
        map[organizer._id.toString()] = organizer;
        return map;
      }, {});
      
      // Add organizer info to events
      return events.map(event => {
        const organizer = organizersMap[event.organizer_id.toString()];
        return {
          ...event.toObject(),
          organizer_name: organizer ? `${organizer.first_name} ${organizer.last_name}` : '',
          registered_teams: event.team_registrations ? event.team_registrations.length : 0
        };
      });
    } catch (err) {
      console.error('Error getting all events:', err);
      throw err;
    }
  },
  
  /**
   * Get events organized by a specific user
   * @param {string} organizerId - Organizer user ID
   * @returns {Promise<Array>} - Promise resolving to an array of event objects
   */
  getEventsByOrganizer: async function(organizerId) {
    try {
      if (!organizerId) {
        throw new Error('Organizer ID is required');
      }
      
      return await Event.find({ organizer_id: organizerId })
          .sort({ event_date: 1 })
          .exec();
    } catch (err) {
      console.error('Error getting events by organizer:', err);
      throw err;
    }
  },
  
  /**
   * Update event information
   * @param {string} eventId - Event ID
   * @param {object} eventData - Updated event data
   * @returns {Promise<object>} - Promise resolving to the updated event
   */
  updateEvent: async function(eventId, eventData) {
    try {
      if (!eventId) {
        throw new Error('Event ID is required');
      }
      
      const updateData = {};
      if (eventData.title) updateData.title = eventData.title;
      if (eventData.description !== undefined) updateData.description = eventData.description;
      if (eventData.sport_type) updateData.sport_type = eventData.sport_type;
      if (eventData.event_date) updateData.event_date = eventData.event_date;
      if (eventData.event_time) updateData.event_time = eventData.event_time;
      if (eventData.location) updateData.location = eventData.location;
      if (eventData.max_teams !== undefined) updateData.max_teams = eventData.max_teams;
      if (eventData.entry_fee !== undefined) updateData.entry_fee = eventData.entry_fee;
      if (eventData.registration_deadline) updateData.registration_deadline = eventData.registration_deadline;
      if (eventData.status) updateData.status = eventData.status;
      
      return await Event.findByIdAndUpdate(
          eventId,
          { $set: updateData },
          { new: true }
      ).exec();
    } catch (err) {
      console.error('Error updating event:', err);
      throw err;
    }
  },
  
  /**
   * Delete an event
   * @param {string} eventId - Event ID
   * @returns {Promise<boolean>} - Promise resolving to true if successful
   */
  deleteEvent: async function(eventId) {
    try {
      if (!eventId) {
        throw new Error('Event ID is required');
      }
      
      const result = await Event.findByIdAndDelete(eventId).exec();
      return !!result;
    } catch (err) {
      console.error('Error deleting event:', err);
      throw err;
    }
  },
  
  /**
   * Register a team for an event
   * @param {string} eventId - Event ID
   * @param {object|string} teamData - Team data object or Team ID string
   * @returns {Promise<object>} - Promise resolving to the updated event
   */
  registerTeamForEvent: async function(eventId, teamData) {
    try {
      if (!eventId) {
        throw new Error('Event ID is required');
      }
      
      // Handle both string teamId and object with team_id
      let teamId;
      let registrationData = {
        registration_date: new Date(),
        status: 'confirmed',
        notes: ''
      };
      
      if (typeof teamData === 'string') {
        teamId = teamData;
      } else if (typeof teamData === 'object' && teamData.team_id) {
        teamId = teamData.team_id;
        if (teamData.registration_date) registrationData.registration_date = teamData.registration_date;
        if (teamData.status) registrationData.status = teamData.status;
        if (teamData.notes) registrationData.notes = teamData.notes;
      } else {
        throw new Error('Valid Team ID is required');
      }
      
      // Check if event exists and has space
      const event = await Event.findById(eventId).exec();
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Check if registration deadline has passed
      if (event.registration_deadline && new Date(event.registration_deadline) < new Date()) {
        throw new Error('Registration deadline has passed');
      }
      
      // Check if max teams reached
      if (event.max_teams > 0 && event.team_registrations.length >= event.max_teams) {
        throw new Error('Event has reached maximum number of teams');
      }
      
      // Check if team is already registered
      const existingReg = event.team_registrations && event.team_registrations.find(
        reg => reg.team_id && reg.team_id.toString() === teamId.toString()
      );
      
      if (existingReg) {
        // If cancelled, update to pending
        if (existingReg.status === 'cancelled') {
          return await Event.findOneAndUpdate(
              { _id: eventId, 'team_registrations.team_id': teamId },
              { $set: { 'team_registrations.$.status': 'pending' } },
              { new: true }
          ).exec();
        }
        
        throw new Error('Team is already registered for this event');
      }
      
      // Add team registration
      return await Event.findByIdAndUpdate(
          eventId,
          { 
            $push: { 
              team_registrations: {
                team_id: teamId,
                registration_date: registrationData.registration_date,
                status: registrationData.status,
                notes: registrationData.notes
              }
            }
          },
          { new: true }
      ).exec();
    } catch (err) {
      console.error('Error registering team for event:', err);
      throw err;
    }
  },
  
  /**
   * Update team registration status
   * @param {string} eventId - Event ID
   * @param {string} teamId - Team ID
   * @param {string} status - New status (confirmed, cancelled)
   * @returns {Promise<object>} - Promise resolving to the updated event
   */
  updateRegistrationStatus: async function(eventId, teamId, status) {
    try {
      if (!eventId || !teamId) {
        throw new Error('Event ID and Team ID are required');
      }
      
      if (status !== 'confirmed' && status !== 'cancelled') {
        throw new Error('Status must be confirmed or cancelled');
      }
      
      return await Event.findOneAndUpdate(
          { _id: eventId, 'team_registrations.team_id': teamId },
          { $set: { 'team_registrations.$.status': status } },
          { new: true }
      ).exec();
    } catch (err) {
      console.error('Error updating registration status:', err);
      throw err;
    }
  },
  
  /**
   * Get events a team is registered for
   * @param {string} teamId - Team ID
   * @returns {Promise<Array>} - Promise resolving to an array of events
   */
  getTeamEvents: async function(teamId) {
    try {
      if (!teamId) {
        throw new Error('Team ID is required');
      }
      
      // Find events where team is registered
      const events = await Event.find({ 'team_registrations.team_id': teamId })
          .sort({ event_date: 1 })
          .exec();
      
      // Get organizer information
      const organizerIds = events.map(event => event.organizer_id);
      const organizers = await User.find({ _id: { $in: organizerIds } })
          .select('_id first_name last_name')
          .exec();
      
      // Create a map of organizer info by ID
      const organizersMap = organizers.reduce((map, organizer) => {
        map[organizer._id.toString()] = organizer;
        return map;
      }, {});
      
      // Add organizer info and registration status to events
      return events.map(event => {
        const organizer = organizersMap[event.organizer_id.toString()];
        const registration = event.team_registrations.find(reg => reg.team_id.toString() === teamId.toString());
        
        return {
          ...event.toObject(),
          organizer_name: organizer ? `${organizer.first_name} ${organizer.last_name}` : '',
          registration_status: registration ? registration.status : 'unknown'
        };
      });
    } catch (err) {
      console.error('Error getting team events:', err);
      throw err;
    }
  },

  /**
   * GET events a player is registered for
   * @param {String} playerId
   * @param {Function} [callback]
   * @returns {Promise<Array>}
   */
  getPlayerEvents: async function(playerId) {
    try {
      if (!playerId) {
        throw new Error('Player ID is required');
      }
      
      // For now, we'll simplify this since we don't have the Registration model setup
      // In a real implementation, this would use the Registration model to link players and events
      return [];
      
      // Original implementation with callback removed - uncomment when Registration model is fully ready
      /*
      return await Registration.find({ player_id: playerId })
        .populate({ path: 'event_id', populate: { path: 'organizer_id' } })
        .populate('team_id')
        .exec()
        .then(regs => regs.map(reg => ({
          event: reg.event_id,
          team: reg.team_id,
          status: reg.status,
          registration_date: reg.registration_date
        })));
      */
    } catch (err) {
      console.error('Error getting player events:', err);
      throw err;
    }
  },

  /**
   * Get events a player is indirectly registered for through team memberships
   * @param {String} playerId - The player's ID
   * @returns {Promise<Array>} - Promise resolving to array of events
   */
  getPlayerEventsViaTeams: async function(playerId) {
    try {
      if (!playerId) {
        throw new Error('Player ID is required');
      }
      
      // Find all teams the player is a member of
      const playerTeams = await Team.find({ 'members.player_id': playerId })
        .select('_id name sport_type')
        .exec();
      
      if (!playerTeams || playerTeams.length === 0) {
        return [];
      }
      
      // Get team IDs
      const teamIds = playerTeams.map(team => team._id);
      
      // Find all events where player's teams are registered
      const events = await Event.find({ 
        'team_registrations.team_id': { $in: teamIds },
        'team_registrations.status': { $ne: 'cancelled' }
      }).sort({ event_date: 1 }).exec();
      
      // Get organizer information
      const organizerIds = events.map(event => event.organizer_id);
      const organizers = await User.find({ _id: { $in: organizerIds } })
        .select('_id first_name last_name email')
        .exec();
      
      // Create map of organizers by ID
      const organizerMap = organizers.reduce((map, organizer) => {
        map[organizer._id.toString()] = organizer;
        return map;
      }, {});
      
      // Create map of teams by ID
      const teamMap = playerTeams.reduce((map, team) => {
        map[team._id.toString()] = team;
        return map;
      }, {});
      
      // Format events with team and organizer information
      return events.map(event => {
        const organizer = organizerMap[event.organizer_id.toString()];
        
        // Find which of the player's teams is registered for this event
        let registeredTeam = null;
        if (event.team_registrations && event.team_registrations.length > 0) {
          const playerTeamRegistration = event.team_registrations.find(reg => 
            teamMap[reg.team_id.toString()] && reg.status !== 'cancelled'
          );
          
          if (playerTeamRegistration) {
            registeredTeam = teamMap[playerTeamRegistration.team_id.toString()];
          }
        }
        
        return {
          id: event._id,
          name: event.title,
          description: event.description,
          event_date: event.event_date,
          location: event.location,
          sport: event.sport_type,
          status: event.status,
          organizer_name: organizer ? `${organizer.first_name} ${organizer.last_name}` : '',
          team_name: registeredTeam ? registeredTeam.name : '',
          team_id: registeredTeam ? registeredTeam._id : null
        };
      });
    } catch (err) {
      console.error('Error getting player events via teams:', err);
      throw err;
    }
  },

  /**
   * Withdraw a team from an event 
   * @param {string} eventId - Event ID
   * @param {string} teamId - Team ID
   * @returns {Promise<object>} - Promise resolving to the updated event
   */
  withdrawTeamFromEvent: async function(eventId, teamId) {
    try {
      if (!eventId || !teamId) {
        throw new Error('Event ID and Team ID are required');
      }
      
      console.log(`Withdrawing team ${teamId} from event ${eventId}`);
      
      // First verify the event exists
      const event = await Event.findById(eventId).exec();
      if (!event) {
        throw new Error('Event not found');
      }
      
      // Check if team is registered for this event
      if (!event.team_registrations || event.team_registrations.length === 0) {
        throw new Error('No registrations found for this event');
      }
      
      // Find the specific registration
      const registrationIndex = event.team_registrations.findIndex(
        reg => reg.team_id && reg.team_id.toString() === teamId.toString()
      );
      
      if (registrationIndex === -1) {
        throw new Error('Team is not registered for this event');
      }
      
      console.log(`Found registration at index ${registrationIndex}`);
      
      // Remove just this specific team registration
      event.team_registrations.splice(registrationIndex, 1);
      
      // Save the updated event
      await event.save();
      console.log('Team successfully withdrawn from event');
      
      return event;
    } catch (err) {
      console.error('Error withdrawing team from event:', err);
      throw err;
    }
  },

  /**
   * Get events a manager's teams are registered for
   * @param {string} managerId - The manager's user ID
   * @returns {Promise<Array>} - Promise resolving to array of events
   */
  getManagerEvents: async function(managerId) {
    try {
      if (!managerId) {
        throw new Error('Manager ID is required');
      }

      const Team = require('./schemas/teamSchema');
      
      // Get all teams managed by this manager
      const teams = await Team.find({ manager_id: managerId }).exec();
      if (!teams || teams.length === 0) {
        return [];
      }
      
      // Get team IDs
      const teamIds = teams.map(team => team._id);
      
      // Find all events where any of these teams are registered
      const events = await Event.find({
        'team_registrations.team_id': { $in: teamIds }
      }).exec();
      
      // Format the results to include team information
      const result = [];
      
      for (const event of events) {
        // Find the registrations for this manager's teams
        const registrations = event.team_registrations.filter(reg => 
          teamIds.some(id => id.toString() === reg.team_id.toString())
        );
        
        for (const registration of registrations) {
          // Find the team name
          const team = teams.find(t => t._id.toString() === registration.team_id.toString());
          if (!team) continue;
          
          result.push({
            event_id: event._id,
            event_name: event.title,
            event_date: event.event_date,
            event_location: event.location,
            event_status: event.status,
            team_id: registration.team_id,
            team_name: team.name,
            registration_status: registration.status,
            registration_date: registration.registration_date
          });
        }
      }
      
      return result;
    } catch (err) {
      console.error('Error getting manager events:', err);
      throw err;
    }
  },

  /**
   * Add static method reference to directly access Mongoose findByIdAndUpdate
   * @param {string} id - Document ID
   * @param {object} update - Update object
   * @param {object} options - Options object
   * @returns {Promise<object>} - Updated document
   */
  findByIdAndUpdate: async function(id, update, options = {}) {
    try {
      return await Event.findByIdAndUpdate(id, update, { new: true, ...options });
    } catch (err) {
      console.error('Error in findByIdAndUpdate:', err);
      throw err;
    }
  }
};
