const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

// Check if user is organizer middleware
const isOrganizer = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    if (req.session.user.role !== 'organizer') {
        return res.status(403).json({ success: false, message: 'Access denied. Organizer access required.' });
    }
    
    next();
};

// Check if user is authenticated middleware
const isAuthenticated = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    next();
};

/**
 * @swagger
 * /api/matches/create:
 *   post:
 *     summary: Create a new match
 *     tags: [Matches]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     responses:
 *       200:
 *         description: Match created
 *
 * /api/matches/event/{eventId}:
 *   get:
 *     summary: Get matches for event
 *     tags: [Matches]
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
 *         description: Event matches returned
 *
 * /api/matches/team/{teamId}/history:
 *   get:
 *     summary: Get historical matches for team
 *     tags: [Matches]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team history returned
 *
 * /api/matches/team/{teamId}/upcoming:
 *   get:
 *     summary: Get upcoming matches for team
 *     tags: [Matches]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Upcoming matches returned
 *
 * /api/matches/teams:
 *   get:
 *     summary: Get all teams for match creation
 *     tags: [Matches]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Team list returned
 *
 * /api/matches/teams/{teamId}:
 *   get:
 *     summary: Get single team details
 *     tags: [Matches]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team details returned
 *       404:
 *         description: Team not found
 *
 * /api/matches/team/{teamId}/all:
 *   get:
 *     summary: Get all matches for team (scheduled and completed)
 *     tags: [Matches]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: teamId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Team matches returned
 *
 * /api/matches/{matchId}/result:
 *   put:
 *     summary: Update match result
 *     tags: [Matches]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Match result updated
 *
 * /api/matches/{matchId}/approve:
 *   post:
 *     summary: Approve pending match result
 *     tags: [Matches]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Match result approved
 *
 * /api/matches/{matchId}/reject:
 *   post:
 *     summary: Reject pending match result
 *     tags: [Matches]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Match result rejected
 *
 * /api/matches/{matchId}:
 *   get:
 *     summary: Get match details
 *     tags: [Matches]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Match details returned
 *   delete:
 *     summary: Delete a match
 *     tags: [Matches]
 *     security:
 *       - sessionAuth: []
 *       - csrfToken: []
 *     parameters:
 *       - in: path
 *         name: matchId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Match deleted
 */

// Create new match (organizer only)
router.post('/create', isOrganizer, matchController.createMatch);

// Get all matches for an event (authenticated users)
router.get('/event/:eventId', isAuthenticated, matchController.getMatchesByEvent);

// Get match history for a team (authenticated users)
router.get('/team/:teamId/history', isAuthenticated, matchController.getTeamMatchHistory);

// Get upcoming matches for a team (authenticated users)
router.get('/team/:teamId/upcoming', isAuthenticated, matchController.getTeamUpcomingMatches);

// GET /api/matches/teams - Get all teams for opponent selection (MUST BE BEFORE /:matchId)
router.get('/teams', isAuthenticated, async (req, res) => {
    try {
        const Team = require('../models/team');
        const teams = await Team.getAllTeams();
        res.json({
            success: true,
            teams: teams
        });
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching teams',
            error: error.message
        });
    }
});

// GET /api/matches/teams/:teamId - Get single team details (MUST BE BEFORE /:matchId)
router.get('/teams/:teamId', isAuthenticated, async (req, res) => {
    try {
        const Team = require('../models/team');
        const team = await Team.getTeamById(req.params.teamId);
        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }
        res.json({
            success: true,
            team: team
        });
    } catch (error) {
        console.error('Error fetching team:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching team',
            error: error.message
        });
    }
});

// GET /api/matches/team/:teamId/all - Get all matches for a team (scheduled + completed)
router.get('/team/:teamId/all', isAuthenticated, async (req, res) => {
    try {
        const Match = require('../models/schemas/matchSchema');
        const { teamId } = req.params;
        
        const matches = await Match.find({
            $or: [
                { team_a: teamId },
                { team_b: teamId }
            ]
        })
        .populate('team_a', 'name')
        .populate('team_b', 'name')
        .populate('event_id', 'title location')
        .sort({ match_date: -1 }) // Most recent first
        .lean();

        // Add team names to match objects
        const matchesWithNames = matches.map(match => ({
            ...match,
            team_a_name: match.team_a?.name || 'Unknown Team',
            team_b_name: match.team_b?.name || 'Unknown Team'
        }));

        res.json({
            success: true,
            matches: matchesWithNames
        });

    } catch (error) {
        console.error('Error fetching team matches:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch matches',
            error: error.message
        });
    }
});

// Update match result (organizer AND manager can update)
router.put('/:matchId/result', isAuthenticated, matchController.updateMatchResult);

// Organizer: Approve pending match result
router.post('/:matchId/approve', isOrganizer, matchController.approveMatchResult);

// Organizer: Reject pending match result
router.post('/:matchId/reject', isOrganizer, matchController.rejectMatchResult);

// Get single match details (authenticated users)
router.get('/:matchId', isAuthenticated, matchController.getMatchById);

// Delete a match (organizer only)
router.delete('/:matchId', isOrganizer, matchController.deleteMatch);

module.exports = router;
