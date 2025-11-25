const Match = require('./schemas/matchSchema');
const Team = require('./team');

/**
 * Match model for managing match results
 */
module.exports = {
    /**
     * Create a new match
     * @param {object} matchData - Match data
     * @returns {Promise<object>} - Promise resolving to the created match
     */
    createMatch: async function(matchData) {
        try {
            const match = new Match(matchData);
            return await match.save();
        } catch (err) {
            console.error('Error creating match:', err);
            throw err;
        }
    },

    /**
     * Get match by ID
     * @param {string} matchId - Match ID
     * @returns {Promise<object>} - Promise resolving to the match
     */
    getMatchById: async function(matchId) {
        try {
            return await Match.findById(matchId)
                .populate('event_id', 'name sport')
                .populate('team_a', 'name')
                .populate('team_b', 'name')
                .exec();
        } catch (err) {
            console.error('Error getting match:', err);
            throw err;
        }
    },

    /**
     * Get all matches for an event
     * @param {string} eventId - Event ID
     * @returns {Promise<Array>} - Promise resolving to array of matches
     */
    getMatchesByEvent: async function(eventId) {
        try {
            return await Match.find({ event_id: eventId })
                .populate('team_a', 'name')
                .populate('team_b', 'name')
                .sort({ match_date: 1 })
                .exec();
        } catch (err) {
            console.error('Error getting matches by event:', err);
            throw err;
        }
    },

    /**
     * Get all matches for a team
     * @param {string} teamId - Team ID
     * @returns {Promise<Array>} - Promise resolving to array of matches
     */
    getMatchesByTeam: async function(teamId) {
        try {
            return await Match.find({
                $or: [{ team_a: teamId }, { team_b: teamId }],
                status: 'completed'
            })
            .populate('team_a', 'name')
            .populate('team_b', 'name')
            .populate('event_id', 'name sport')
            .sort({ match_date: -1 })
            .exec();
        } catch (err) {
            console.error('Error getting matches by team:', err);
            throw err;
        }
    },

    /**
     * Update match result
     * @param {string} matchId - Match ID
     * @param {number} scoreA - Score for team A
     * @param {number} scoreB - Score for team B
     * @returns {Promise<object>} - Promise resolving to updated match
     */
    updateMatchResult: async function(matchId, scoreA, scoreB) {
        try {
            const match = await Match.findById(matchId).exec();
            
            if (!match) {
                throw new Error('Match not found');
            }

            // Update scores
            match.score_a = scoreA;
            match.score_b = scoreB;
            match.status = 'completed';

            // Determine winner
            if (scoreA > scoreB) {
                match.winner = 'team_a';
                // Update team stats
                await Team.updateTeamStats(match.team_a, 'win');
                await Team.updateTeamStats(match.team_b, 'loss');
            } else if (scoreB > scoreA) {
                match.winner = 'team_b';
                // Update team stats
                await Team.updateTeamStats(match.team_b, 'win');
                await Team.updateTeamStats(match.team_a, 'loss');
            } else {
                match.winner = 'draw';
                // Update team stats for draw
                await Team.updateTeamStats(match.team_a, 'draw');
                await Team.updateTeamStats(match.team_b, 'draw');
            }

            return await match.save();
        } catch (err) {
            console.error('Error updating match result:', err);
            throw err;
        }
    },

    /**
     * Delete a match
     * @param {string} matchId - Match ID
     * @returns {Promise<boolean>} - Promise resolving to success status
     */
    deleteMatch: async function(matchId) {
        try {
            const result = await Match.findByIdAndDelete(matchId).exec();
            return !!result;
        } catch (err) {
            console.error('Error deleting match:', err);
            throw err;
        }
    }
};
