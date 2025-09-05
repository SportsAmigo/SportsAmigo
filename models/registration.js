const Registration = require('./schemas/registrationSchema');
const Event = require('./schemas/eventSchema');
const Team = require('./schemas/teamSchema');

/**
 * Registration model for event registrations
 */
module.exports = {
  /**
   * Create a new registration
   * @param {object} registrationData - Registration data
   * @returns {Promise<object>} - Promise resolving to the created registration
   */
  createRegistration: async function(registrationData) {
    try {
      if (!registrationData.team_id || !registrationData.event_id) {
        throw new Error('Team ID and Event ID are required');
      }

      // Check if registration already exists
      const existingReg = await Registration.findOne({
        team_id: registrationData.team_id,
        event_id: registrationData.event_id
      }).exec();

      if (existingReg) {
        throw new Error('This team is already registered for this event');
      }

      const registration = new Registration({
        team_id: registrationData.team_id,
        event_id: registrationData.event_id,
        player_id: registrationData.player_id || null,
        status: registrationData.status || 'pending',
        paid: registrationData.paid || false,
        payment_amount: registrationData.payment_amount || 0,
        notes: registrationData.notes || ''
      });
      
      return await registration.save();
    } catch (err) {
      console.error('Error creating registration:', err);
      throw err;
    }
  },
  
  /**
   * Get registration by ID
   * @param {string} registrationId - Registration ID
   * @returns {Promise<object>} - Promise resolving to the registration
   */
  getRegistrationById: async function(registrationId) {
    try {
      return await Registration.findById(registrationId)
        .populate('team_id', 'name sport_type')
        .populate('event_id', 'title event_date location')
        .populate('player_id', 'first_name last_name email')
        .exec();
    } catch (err) {
      console.error('Error getting registration by ID:', err);
      throw err;
    }
  },
  
  /**
   * Get registrations by event ID
   * @param {string} eventId - Event ID
   * @returns {Promise<Array>} - Promise resolving to array of registrations
   */
  getRegistrationsByEvent: async function(eventId) {
    try {
      return await Registration.find({ event_id: eventId })
        .populate('team_id', 'name sport_type')
        .populate('player_id', 'first_name last_name email')
        .sort('registration_date')
        .exec();
    } catch (err) {
      console.error('Error getting registrations by event:', err);
      throw err;
    }
  },
  
  /**
   * Get registrations by team ID
   * @param {string} teamId - Team ID
   * @returns {Promise<Array>} - Promise resolving to array of registrations
   */
  getRegistrationsByTeam: async function(teamId) {
    try {
      return await Registration.find({ team_id: teamId })
        .populate('event_id', 'title event_date location')
        .sort('registration_date')
        .exec();
    } catch (err) {
      console.error('Error getting registrations by team:', err);
      throw err;
    }
  },
  
  /**
   * Get registrations by player ID
   * @param {string} playerId - Player ID
   * @returns {Promise<Array>} - Promise resolving to array of registrations
   */
  getRegistrationsByPlayer: async function(playerId) {
    try {
      return await Registration.find({ player_id: playerId })
        .populate('team_id', 'name sport_type')
        .populate('event_id', 'title event_date location')
        .sort('registration_date')
        .exec();
    } catch (err) {
      console.error('Error getting registrations by player:', err);
      throw err;
    }
  },
  
  /**
   * Update registration status
   * @param {string} registrationId - Registration ID
   * @param {string} status - New status (pending, confirmed, cancelled)
   * @returns {Promise<object>} - Promise resolving to updated registration
   */
  updateRegistrationStatus: async function(registrationId, status) {
    try {
      if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
        throw new Error('Invalid status. Must be pending, confirmed, or cancelled');
      }
      
      return await Registration.findByIdAndUpdate(
        registrationId,
        { $set: { status } },
        { new: true }
      ).exec();
    } catch (err) {
      console.error('Error updating registration status:', err);
      throw err;
    }
  },
  
  /**
   * Delete registration
   * @param {string} registrationId - Registration ID
   * @returns {Promise<boolean>} - Promise resolving to success status
   */
  deleteRegistration: async function(registrationId) {
    try {
      const result = await Registration.findByIdAndDelete(registrationId).exec();
      return !!result;
    } catch (err) {
      console.error('Error deleting registration:', err);
      throw err;
    }
  }
}; 