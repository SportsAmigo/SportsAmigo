const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

// Check if user is organizer middleware
const isOrganizer = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    
    if (req.session.user.user_type !== 'organizer') {
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

// Create new match (organizer only)
router.post('/create', isOrganizer, matchController.createMatch);

// Get all matches for an event (authenticated users)
router.get('/event/:eventId', isAuthenticated, matchController.getMatchesByEvent);

// Get match history for a team (authenticated users)
router.get('/team/:teamId/history', isAuthenticated, matchController.getTeamMatchHistory);

// Update match result (organizer only)
router.put('/:matchId/result', isOrganizer, matchController.updateMatchResult);

// Get single match details (authenticated users)
router.get('/:matchId', isAuthenticated, matchController.getMatchById);

// Delete a match (organizer only)
router.delete('/:matchId', isOrganizer, matchController.deleteMatch);

module.exports = router;
