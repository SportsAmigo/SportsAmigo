const { Team, Event } = require('../models');
const Match = require('../models/schemas/matchSchema');

/**
 * Match controller for handling match-related operations
 */
module.exports = {
    /**
     * Create a new match (handles both single and bulk creation)
     * POST /api/matches/create
     */
    createMatch: async (req, res) => {
        try {
            const { matches } = req.body;

            // Check if matches array exists
            if (!matches || !Array.isArray(matches)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Matches array is required' 
                });
            }

            const createdMatches = [];
            const errors = [];

            // Process each match
            for (let i = 0; i < matches.length; i++) {
                const matchData = matches[i];

                try {
                    // Validate required fields
                    if (!matchData.event_id || !matchData.team_a || !matchData.team_b || !matchData.match_date) {
                        errors.push(`Match ${i + 1}: Missing required fields`);
                        continue;
                    }

                    // Check if teams are different
                    if (matchData.team_a === matchData.team_b) {
                        errors.push(`Match ${i + 1}: Teams must be different`);
                        continue;
                    }

                    // Get team names
                    const teamAData = await Team.getTeamById(matchData.team_a);
                    const teamBData = await Team.getTeamById(matchData.team_b);

                    if (!teamAData || !teamBData) {
                        errors.push(`Match ${i + 1}: One or both teams not found`);
                        continue;
                    }

                    // Create match with all fields
                    const newMatchData = {
                        event_id: matchData.event_id,
                        team_a: matchData.team_a,
                        team_b: matchData.team_b,
                        team_a_name: teamAData.name,
                        team_b_name: teamBData.name,
                        match_date: new Date(matchData.match_date),
                        venue: matchData.venue || '',
                        round: matchData.round || 'Round 1',
                        match_number: matchData.match_number || (i + 1),
                        status: 'scheduled',
                        scheduled_by: req.session.user._id,
                        scheduled_at: new Date()
                    };

                    const match = await Match.createMatch(newMatchData);
                    createdMatches.push(match);

                } catch (error) {
                    console.error(`Error creating match ${i + 1}:`, error);
                    errors.push(`Match ${i + 1}: ${error.message}`);
                }
            }

            // Return response
            res.status(201).json({ 
                success: true, 
                message: `${createdMatches.length} matches created successfully`,
                matches: createdMatches,
                errors: errors.length > 0 ? errors : undefined
            });

        } catch (err) {
            console.error('Error creating matches:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Error creating matches',
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

            const allMatches = await Match.find({ event_id: eventId })
                .populate('team_a', 'name')
                .populate('team_b', 'name')
                .populate('event_id', 'title location')
                .populate('verified_by', 'name email')
                .sort({ match_date: 1 })
                .lean();

            // Group matches by status for organizer view
            const matches = {
                pending: allMatches.filter(m => m.status === 'pending'),
                verified: allMatches.filter(m => m.status === 'verified' || m.status === 'completed'),
                disputed: allMatches.filter(m => m.status === 'disputed')
            };

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
            const userId = req.session.user._id;
            const userRole = req.session.user.role;

            console.log('🎯 Updating match result:', matchId);
            console.log('📊 Scores:', score_a, 'vs', score_b);
            console.log('👤 User:', userId, 'Role:', userRole);

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

            // Get match with populated teams to check manager authorization
            const match = await Match.findById(matchId)
                .populate('team_a', 'name manager_id')
                .populate('team_b', 'name manager_id');

            if (!match) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found'
                });
            }

            // Check authorization
            let isAuthorized = false;

            if (userRole === 'organizer') {
                // Organizers can update any match
                isAuthorized = true;
            } else if (userRole === 'manager') {
                // Managers can only update their team's matches
                const teamAManagerId = match.team_a.manager_id?.toString();
                const teamBManagerId = match.team_b.manager_id?.toString();
                
                isAuthorized = (
                    userId.toString() === teamAManagerId ||
                    userId.toString() === teamBManagerId
                );
            }

            if (!isAuthorized) {
                return res.status(403).json({
                    success: false,
                    message: 'Not authorized to update this match'
                });
            }

            // Calculate winner
            let result = 'draw';
            if (score_a > score_b) result = 'team_a';
            else if (score_b > score_a) result = 'team_b';

            // Set status based on who submitted
            let status = 'completed';
            if (userRole === 'manager') {
                // Manager submission needs organizer approval
                status = 'pending';
            } else if (userRole === 'organizer') {
                // Organizer can directly mark as verified/completed
                status = 'verified';
            }

            // Update match with new scores, result, and status
            match.score_a = score_a;
            match.score_b = score_b;
            match.result = result;
            match.status = status;
            match.updated_at = new Date();

            await match.save();

            console.log('✅ Match updated successfully');
            console.log(`📊 Status: ${status} (submitted by ${userRole})`);

            // Different message based on who submitted
            const message = userRole === 'manager' 
                ? 'Result submitted for verification. Waiting for Organizer approval.'
                : 'Match result updated and verified successfully';

            res.json({ 
                success: true, 
                message: message,
                match: match,
                requiresApproval: userRole === 'manager'
            });
        } catch (err) {
            console.error('❌ Error updating match result:', err);
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
    },

    /**
     * Get upcoming matches for a team
     * GET /api/matches/team/:teamId/upcoming
     */
    getTeamUpcomingMatches: async (req, res) => {
        try {
            const { teamId } = req.params;

            if (!teamId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Team ID is required' 
                });
            }

            const Match = require('../models/match');
            const MatchSchema = require('../models/schemas/matchSchema');

            // Find upcoming matches where team is involved and status is scheduled
            const now = new Date();
            const matches = await MatchSchema.find({
                $or: [{ team_a: teamId }, { team_b: teamId }],
                match_date: { $gte: now },
                status: 'scheduled'
            })
            .populate('team_a', 'name')
            .populate('team_b', 'name')
            .populate('event_id', 'title sport_type')
            .sort({ match_date: 1 })
            .limit(10)
            .lean();

            // Return empty array if no matches found (not an error)
            if (!matches || matches.length === 0) {
                return res.json({
                    success: true,
                    upcomingMatches: [],
                    message: 'No upcoming matches found'
                });
            }

            // Format upcoming matches
            const upcomingMatches = matches.map(match => {
                const isTeamA = match.team_a._id.toString() === teamId;
                const opponent = isTeamA ? match.team_b.name : match.team_a.name;
                const opponentId = isTeamA ? match.team_b._id : match.team_a._id;

                return {
                    match_id: match._id,
                    opponent,
                    opponentId,
                    match_date: match.match_date,
                    venue: match.venue || 'TBA',
                    event: match.event_id ? match.event_id.title : 'Unknown Event',
                    sport: match.event_id ? match.event_id.sport_type : '',
                    match_number: match.match_number || 'N/A',
                    round: match.round || 'N/A'
                };
            });

            res.json({ 
                success: true, 
                upcomingMatches 
            });
        } catch (err) {
            console.error('Error getting upcoming matches:', err);
            res.status(500).json({ 
                success: false, 
                message: 'Error getting upcoming matches',
                error: err.message 
            });
        }
    },

    /**
     * Approve pending match result (Organizer only)
     * POST /api/matches/:matchId/approve
     */
    approveMatchResult: async (req, res) => {
        try {
            const { matchId } = req.params;

            const match = await Match.findById(matchId);

            if (!match) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found'
                });
            }

            if (match.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: `Cannot approve match with status: ${match.status}. Only pending results can be approved.`
                });
            }

            // Update status to verified
            match.status = 'verified';
            match.verified_by = req.session.user._id;
            match.verified_at = new Date();
            match.updated_at = new Date();

            await match.save();

            console.log(`✅ Match ${matchId} approved by organizer`);

            res.json({
                success: true,
                message: 'Match result approved and verified successfully',
                match: match
            });

        } catch (err) {
            console.error('❌ Error approving match result:', err);
            res.status(500).json({
                success: false,
                message: 'Error approving match result',
                error: err.message
            });
        }
    },

    /**
     * Reject pending match result (Organizer only)
     * POST /api/matches/:matchId/reject
     */
    rejectMatchResult: async (req, res) => {
        try {
            const { matchId } = req.params;
            const { reason } = req.body;

            const match = await Match.findById(matchId);

            if (!match) {
                return res.status(404).json({
                    success: false,
                    message: 'Match not found'
                });
            }

            if (match.status !== 'pending') {
                return res.status(400).json({
                    success: false,
                    message: `Cannot reject match with status: ${match.status}. Only pending results can be rejected.`
                });
            }

            // Reset match to scheduled, clear scores
            match.status = 'scheduled';
            match.score_a = null;
            match.score_b = null;
            match.result = null;
            match.rejection_reason = reason || 'Result rejected by organizer';
            match.updated_at = new Date();

            await match.save();

            console.log(`❌ Match ${matchId} rejected by organizer`);

            res.json({
                success: true,
                message: 'Match result rejected. Manager must resubmit.',
                match: match
            });

        } catch (err) {
            console.error('❌ Error rejecting match result:', err);
            res.status(500).json({
                success: false,
                message: 'Error rejecting match result',
                error: err.message
            });
        }
    }
};
