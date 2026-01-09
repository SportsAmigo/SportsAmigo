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
     * @returns {Promise<boolean>} - Promise resolving to true if deleted
     */
    deleteMatch: async function(matchId) {
        try {
            const result = await Match.findByIdAndDelete(matchId).exec();
            return !!result;
        } catch (err) {
            console.error('Error deleting match:', err);
            throw err;
        }
    },

    /**
     * Get all matches for teams owned by a manager
     * @param {string} managerId - Manager ID
     * @returns {Promise<Array>} - Promise resolving to array of matches
     */
    getMatchesByManager: async function(managerId) {
        try {
            const Team = require('./team');
            const teams = await Team.getTeamsByManager(managerId);
            const teamIds = teams.map(t => t._id);
            
            return await Match.find({
                $or: [
                    { team_a: { $in: teamIds } },
                    { team_b: { $in: teamIds } }
                ]
            })
            .populate('team_a', 'name')
            .populate('team_b', 'name')
            .populate('recorded_by', 'first_name last_name')
            .populate('verified_by', 'first_name last_name')
            .sort({ match_date: -1 })
            .exec();
        } catch (err) {
            console.error('Error getting matches by manager:', err);
            throw err;
        }
    },

    /**
     * Get pending matches for an event (for organizer verification)
     * @param {string} eventId - Event ID
     * @returns {Promise<Array>} - Promise resolving to array of pending matches
     */
    getPendingMatchesByEvent: async function(eventId) {
        try {
            return await Match.find({
                event_id: eventId,
                status: 'pending'
            })
            .populate('team_a', 'name')
            .populate('team_b', 'name')
            .populate('recorded_by', 'first_name last_name')
            .sort({ created_at: -1 })
            .exec();
        } catch (err) {
            console.error('Error getting pending matches:', err);
            throw err;
        }
    },

    /**
     * Verify a match and trigger stat updates
     * @param {string} matchId - Match ID
     * @param {string} organizerId - Organizer ID
     * @returns {Promise<object>} - Promise resolving to verified match
     */
    verifyMatch: async function(matchId, organizerId) {
        try {
            const match = await Match.findById(matchId).exec();
            
            if (!match) {
                throw new Error('Match not found');
            }
            
            match.status = 'verified';
            match.verified_by = organizerId;
            match.verified_at = new Date();
            
            await match.save();
            await this.updateTeamStats(match);
            
            return match;
        } catch (err) {
            console.error('Error verifying match:', err);
            throw err;
        }
    },

    /**
     * Mark a match as disputed
     * @param {string} matchId - Match ID
     * @param {string} reason - Dispute reason
     * @returns {Promise<object>} - Promise resolving to disputed match
     */
    disputeMatch: async function(matchId, reason) {
        try {
            return await Match.findByIdAndUpdate(
                matchId,
                {
                    status: 'disputed',
                    dispute_reason: reason,
                    updated_at: new Date()
                },
                { new: true }
            ).exec();
        } catch (err) {
            console.error('Error disputing match:', err);
            throw err;
        }
    },

    /**
     * Update team and player statistics after match verification
     * @param {object} match - Match object
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     */
    updateTeamStats: async function(match) {
        try {
            const Team = require('./team');
            
            // Determine match results
            let team_a_result, team_b_result;
            
            if (match.score_a > match.score_b) {
                team_a_result = 'win';
                team_b_result = 'loss';
            } else if (match.score_a < match.score_b) {
                team_a_result = 'loss';
                team_b_result = 'win';
            } else {
                team_a_result = 'draw';
                team_b_result = 'draw';
            }
            
            // Update both teams
            await Team.updateTeamMatchStats(match.team_a, team_a_result);
            await Team.updateTeamMatchStats(match.team_b, team_b_result);
            
            return true;
        } catch (err) {
            console.error('Error updating team stats:', err);
            throw err;
        }
    },

    /**
     * Generate event leaderboard with points system
     * @param {string} eventId - Event ID
     * @returns {Promise<Array>} - Promise resolving to sorted leaderboard array
     */
    getEventLeaderboard: async function(eventId) {
        try {
            const Event = require('./event');
            const Team = require('./team');
            
            const event = await Event.getEventById(eventId);
            const teamIds = event.team_registrations
                .filter(r => r.status === 'confirmed' || r.status === 'approved')
                .map(r => r.team_id);
            
            const matches = await Match.find({
                event_id: eventId,
                status: 'verified'
            }).exec();
            
            // Initialize standings
            const standings = {};
            teamIds.forEach(teamId => {
                standings[teamId.toString()] = {
                    played: 0,
                    won: 0,
                    drawn: 0,
                    lost: 0,
                    goals_for: 0,
                    goals_against: 0,
                    goal_difference: 0,
                    points: 0
                };
            });
            
            // Calculate standings from matches
            matches.forEach(match => {
                const teamAId = match.team_a.toString();
                const teamBId = match.team_b.toString();
                
                if (standings[teamAId]) {
                    standings[teamAId].played++;
                    standings[teamAId].goals_for += match.score_a;
                    standings[teamAId].goals_against += match.score_b;
                    
                    if (match.score_a > match.score_b) {
                        standings[teamAId].won++;
                        standings[teamAId].points += 3;
                    } else if (match.score_a === match.score_b) {
                        standings[teamAId].drawn++;
                        standings[teamAId].points += 1;
                    } else {
                        standings[teamAId].lost++;
                    }
                }
                
                if (standings[teamBId]) {
                    standings[teamBId].played++;
                    standings[teamBId].goals_for += match.score_b;
                    standings[teamBId].goals_against += match.score_a;
                    
                    if (match.score_b > match.score_a) {
                        standings[teamBId].won++;
                        standings[teamBId].points += 3;
                    } else if (match.score_b === match.score_a) {
                        standings[teamBId].drawn++;
                        standings[teamBId].points += 1;
                    } else {
                        standings[teamBId].lost++;
                    }
                }
            });
            
            // Calculate goal difference
            Object.keys(standings).forEach(teamId => {
                standings[teamId].goal_difference = 
                    standings[teamId].goals_for - standings[teamId].goals_against;
            });
            
            // Get team details and build leaderboard
            const leaderboard = await Promise.all(
                Object.keys(standings).map(async (teamId) => {
                    const team = await Team.getTeamById(teamId);
                    return {
                        team_id: teamId,
                        team_name: team.name,
                        ...standings[teamId]
                    };
                })
            );
            
            // Sort by points, then goal difference, then goals for
            leaderboard.sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.goal_difference !== a.goal_difference) 
                    return b.goal_difference - a.goal_difference;
                return b.goals_for - a.goals_for;
            });
            
            return leaderboard;
        } catch (err) {
            console.error('Error generating leaderboard:', err);
            throw err;
        }
    },

    /**
     * Get comprehensive statistics for a team across all matches
     * @param {string} teamId - Team ID
     * @returns {Promise<object>} - Promise resolving to team statistics
     */
    getTeamStats: async function(teamId) {
        try {
            // Get all verified/completed matches for this team
            const matches = await Match.find({
                $or: [{ team_a: teamId }, { team_b: teamId }],
                status: { $in: ['completed', 'verified'] }
            })
            .populate('team_a', 'name')
            .populate('team_b', 'name')
            .sort({ match_date: -1 })
            .lean();
            
            const stats = {
                total_matches: matches.length,
                wins: 0,
                losses: 0,
                draws: 0,
                goals_scored: 0,
                goals_conceded: 0,
                points: 0,
                recent_form: [] // Last 5 matches: W, L, D
            };
            
            matches.forEach((match, index) => {
                const isTeamA = match.team_a._id.toString() === teamId.toString();
                const yourScore = isTeamA ? match.score_a : match.score_b;
                const oppScore = isTeamA ? match.score_b : match.score_a;
                
                stats.goals_scored += yourScore;
                stats.goals_conceded += oppScore;
                
                let result;
                if (yourScore > oppScore) {
                    stats.wins++;
                    stats.points += 3;
                    result = 'W';
                } else if (yourScore < oppScore) {
                    stats.losses++;
                    result = 'L';
                } else {
                    stats.draws++;
                    stats.points += 1;
                    result = 'D';
                }
                
                // Add to recent form (max 5 matches)
                if (index < 5) {
                    stats.recent_form.push(result);
                }
            });
            
            stats.goal_difference = stats.goals_scored - stats.goals_conceded;
            stats.win_rate = stats.total_matches > 0 
                ? ((stats.wins / stats.total_matches) * 100).toFixed(1)
                : '0.0';
            
            return stats;
        } catch (err) {
            console.error('Error getting team stats:', err);
            throw err;
        }
    },

    /**
     * Update team statistics after a match is completed/verified
     * This is called after match status changes to 'completed' or 'verified'
     * @param {string} matchId - Match ID
     * @returns {Promise<object>} - Promise resolving to update result
     */
    updateTeamStatsAfterMatch: async function(matchId) {
        try {
            const match = await Match.findById(matchId);
            
            if (!match) {
                throw new Error('Match not found');
            }
            
            if (!['completed', 'verified'].includes(match.status)) {
                console.warn(`Match ${matchId} is not completed/verified. Skipping stats update.`);
                return { success: false, message: 'Match not completed' };
            }
            
            const Team = require('./team');
            
            // Determine results
            let team_a_result, team_b_result;
            
            if (match.score_a > match.score_b) {
                team_a_result = 'win';
                team_b_result = 'loss';
            } else if (match.score_a < match.score_b) {
                team_a_result = 'loss';
                team_b_result = 'win';
            } else {
                team_a_result = 'draw';
                team_b_result = 'draw';
            }
            
            // Update both teams' statistics
            await Team.updateTeamMatchStats(match.team_a, team_a_result);
            await Team.updateTeamMatchStats(match.team_b, team_b_result);
            
            return {
                success: true,
                team_a_result,
                team_b_result,
                message: 'Team stats updated successfully'
            };
        } catch (err) {
            console.error('Error updating team stats after match:', err);
            throw err;
        }
    }
};
