const PlayerProfile = require('../models/playerProfile');
const User = require('../models/user');

/**
 * Controller for player profile operations
 */
module.exports = {
    /**
     * Get a player's profile
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    getPlayerProfile: async (req, res) => {
        try {
            const playerId = req.params.id || req.session.user._id;
            
            const profile = await PlayerProfile.getProfileByUserId(playerId);
            
            if (!profile) {
                return res.status(404).json({ error: 'Player profile not found' });
            }
            
            return res.status(200).json(profile);
        } catch (err) {
            console.error('Error fetching player profile:', err);
            return res.status(500).json({ error: 'Error fetching player profile' });
        }
    },
    
    /**
     * Create or update a player's profile
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    updatePlayerProfile: async (req, res) => {
        try {
            const playerId = req.session.user._id;
            
            // Prepare profile data
            const profileData = {
                sport: req.body.sport,
                position: req.body.position,
                skill_level: req.body.skill_level,
                years_experience: req.body.years_experience,
                achievements: req.body.achievements,
                preferred_team_types: req.body.preferred_team_types,
                availability: req.body.availability,
                games_played: req.body.games_played,
                goals: req.body.goals,
                assists: req.body.assists,
                points: req.body.points
            };
            
            // Update or create the profile
            await PlayerProfile.updateProfile(playerId, profileData);
            
            // Set success message
            req.session.flashMessage = {
                type: 'success',
                text: 'Player profile updated successfully!'
            };
            
            return res.redirect('/player/profile');
        } catch (err) {
            console.error('Error updating player profile:', err);
            req.session.flashMessage = {
                type: 'error',
                text: 'Error updating player profile. Please try again.'
            };
            return res.redirect('/player/profile/edit');
        }
    },
    
    /**
     * Get player performance data
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    getPlayerPerformance: async (req, res) => {
        try {
            const playerId = req.params.id || req.session.user._id;
            
            const performance = await PlayerProfile.getPlayerPerformance(playerId);
            
            if (!performance) {
                return res.status(404).json({ error: 'Player performance data not found' });
            }
            
            return res.status(200).json(performance);
        } catch (err) {
            console.error('Error fetching player performance:', err);
            return res.status(500).json({ error: 'Error fetching player performance' });
        }
    },
    
    /**
     * Get all player profiles
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    getAllPlayerProfiles: async (req, res) => {
        try {
            const profiles = await PlayerProfile.getAllProfiles();
            return res.status(200).json(profiles);
        } catch (err) {
            console.error('Error fetching all player profiles:', err);
            return res.status(500).json({ error: 'Error fetching player profiles' });
        }
    },
    
    /**
     * Render player profile page
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    renderPlayerProfile: async (req, res) => {
        try {
            const playerId = req.session.user._id;
            
            // Get player profile
            const profile = await PlayerProfile.getProfileByUserId(playerId);
            
            // Get user info from User model
            const user = await User.getUserById(playerId);
            
            // Get player performance data
            const performance = await PlayerProfile.getPlayerPerformance(playerId);
            
            // Combine user data with profile data for the template
            const profileData = {
                ...req.session.user,
                ...user,
                ...profile
            };
            
            console.log('Combined profile data:', profileData);
            
            // Render profile page
            res.render('player/profile', {
                title: 'Player Profile',
                user: req.session.user,
                profile: profileData || {},
                performance: performance || {},
                messages: req.session.flashMessage || {},
                layout: 'layouts/sidebar-dashboard',
                path: '/player/profile'
            });
            
            // Clear flash messages
            delete req.session.flashMessage;
        } catch (err) {
            console.error('Error rendering player profile:', err);
            res.status(500).render('error', {
                message: 'Failed to load player profile',
                error: err
            });
        }
    },
    
    /**
     * Render player profile edit page
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    renderPlayerProfileEdit: async (req, res) => {
        try {
            const playerId = req.session.user._id;
            
            // Get player profile
            const profile = await PlayerProfile.getProfileByUserId(playerId);
            
            // Get user info
            const user = await User.getUserById(playerId);
            
            // Render profile edit page
            res.render('player/profile-edit', {
                title: 'Edit Player Profile',
                user: req.session.user,
                profile: profile || {},
                messages: req.session.flashMessage || {},
                layout: 'layouts/sidebar-dashboard',
                path: '/player/profile'
            });
            
            // Clear flash messages
            delete req.session.flashMessage;
        } catch (err) {
            console.error('Error rendering player profile edit:', err);
            res.status(500).render('error', {
                message: 'Failed to load player profile edit page',
                error: err
            });
        }
    }
}; 