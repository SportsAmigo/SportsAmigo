const { Match, Team, Event } = require('../models');

/**
 * Match controller for handling match-related operations
 */
module.exports = {
    /**
     * Create a new match
     * POST /api/matches/create
     */
    createMatch: async (req, res) => {
        try {
            const { event_id, team_a, team_b, match_date, venue } = req.body;

            // Validate required fields
            if (!event_id || !team_a || !team_b || !match_date) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Event ID, both teams, and match date are required' 
                });
            }

            // Check if teams are the same
            if (team_a === team_b) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Teams must be different' 
                });
            }

            // Get team names
            const teamAData = await Team.getTeamById(team_a);
            const teamBData = await Team.getTeamById(team_b);

            if (!teamAData || !teamBData) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'One or both teams not found' 
                });
            }

            // Create match
            const matchData = {
                event_id,
                team_a,
                team_b,
                team_a_name: teamAData.name,
                team_b_name: teamBData.name,
                match_date: new Date(match_date),
                venue: venue || '',
                status: 'scheduled'
            };

            const match = await Match.createMatch(matchData);

            res.json({ 
                success: true, 
                message: 'Match created successfully',
                match 
            });
        } catch (err) {
            console.error('Error creating match:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Error creating match',
                error: err.message 
            });
        }
    },

    /**
     * Get all matches for an event
     * GET /api/matches/event/:eventId
     */
    getMatchesByEvent: async (req, res) => {
        try {
            const { eventId } = req.params;

            if (!eventId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Event ID is required' 
                });
            }

            const matches = await Match.getMatchesByEvent(eventId);

            res.json({ 
                success: true, 
                matches 
            });
        } catch (err) {
            console.error('Error getting matches:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Error getting matches',
                error: err.message 
            });
        }
    },

    /**
     * Get match history for a team
     * GET /api/matches/team/:teamId/history
     */
    getTeamMatchHistory: async (req, res) => {
        try {
            const { teamId } = req.params;

            if (!teamId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Team ID is required' 
                });
            }

            const matches = await Match.getMatchesByTeam(teamId);

            // Format match history with result from team's perspective
            const history = matches.map(match => {
                const isTeamA = match.team_a._id.toString() === teamId;
                const opponent = isTeamA ? match.team_b.name : match.team_a.name;
                const teamScore = isTeamA ? match.score_a : match.score_b;
                const opponentScore = isTeamA ? match.score_b : match.score_a;
                
                let result = '';
                if (match.winner === 'draw') {
                    result = 'Draw';
                } else if (
                    (match.winner === 'team_a' && isTeamA) || 
                    (match.winner === 'team_b' && !isTeamA)
                ) {
                    result = 'Win';
                } else {
                    result = 'Loss';
                }

                return {
                    match_id: match._id,
                    opponent,
                    result,
                    score: `${teamScore} - ${opponentScore}`,
                    date: match.match_date,
                    event: match.event_id ? match.event_id.name : 'Unknown Event',
                    sport: match.event_id ? match.event_id.sport : ''
                };
            });

            res.json({ 
                success: true, 
                history 
            });
        } catch (err) {
            console.error('Error getting team match history:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Error getting match history',
                error: err.message 
            });
        }
    },

    /**
     * Update match result
     * PUT /api/matches/:matchId/result
     */
    updateMatchResult: async (req, res) => {
        try {
            const { matchId } = req.params;
            const { score_a, score_b } = req.body;

            // Validate required fields
            if (!matchId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Match ID is required' 
                });
            }

            if (score_a === undefined || score_b === undefined) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Both team scores are required' 
                });
            }

            // Validate scores are non-negative numbers
            if (score_a < 0 || score_b < 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Scores must be non-negative numbers' 
                });
            }

            // Update match result (this also updates team stats automatically)
            const updatedMatch = await Match.updateMatchResult(matchId, score_a, score_b);

            res.json({ 
                success: true, 
                message: 'Match result updated successfully',
                match: updatedMatch 
            });
        } catch (err) {
            console.error('Error updating match result:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Error updating match result',
                error: err.message 
            });
        }
    },

    /**
     * Get single match details
     * GET /api/matches/:matchId
     */
    getMatchById: async (req, res) => {
        try {
            const { matchId } = req.params;

            if (!matchId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Match ID is required' 
                });
            }

            const match = await Match.getMatchById(matchId);

            if (!match) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Match not found' 
                });
            }

            res.json({ 
                success: true, 
                match 
            });
        } catch (err) {
            console.error('Error getting match:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Error getting match',
                error: err.message 
            });
        }
    },

    /**
     * Delete a match
     * DELETE /api/matches/:matchId
     */
    deleteMatch: async (req, res) => {
        try {
            const { matchId } = req.params;

            if (!matchId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Match ID is required' 
                });
            }

            const deleted = await Match.deleteMatch(matchId);

            if (!deleted) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Match not found' 
                });
            }

            res.json({ 
                success: true, 
                message: 'Match deleted successfully' 
            });
        } catch (err) {
            console.error('Error deleting match:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Error deleting match',
                error: err.message 
            });
        }
    }
};
