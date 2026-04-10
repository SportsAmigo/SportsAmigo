const Team = require('../models/team');
const Profile = require('../models/profile');

/**
 * Controller for team-related operations
 */
module.exports = {
    /**
     * Get all teams
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    getAllTeams: async (req, res) => {
        try {
            const teams = await Team.getAllTeams();
            return res.status(200).json(teams);
        } catch (err) {
            console.error('Error fetching teams:', err);
            return res.status(500).json({ error: 'Error fetching teams' });
        }
    },
    
    /**
     * Get team by ID
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    getTeamById: async (req, res) => {
        try {
            const teamId = req.params.id;
            const team = await Team.getTeamById(teamId);
            
            if (!team) {
                return res.status(404).json({ error: 'Team not found' });
            }
            
            return res.status(200).json(team);
        } catch (err) {
            console.error('Error fetching team:', err);
            return res.status(500).json({ error: 'Error fetching team' });
        }
    },
    
    /**
     * Create a new team
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    createTeam: async (req, res) => {
        try {
            const managerId = req.session.user._id;
            
            const teamData = {
                name: req.body.name,
                sport_type: req.body.sport_type,
                manager_id: managerId,
                description: req.body.description,
                max_members: req.body.max_members
            };
            
            const team = await Team.createTeam(teamData);
            
            // Set success message
            req.session.flashMessage = {
                type: 'success',
                text: 'Team created successfully!'
            };
            
            return res.redirect(`/manager/teams/${team._id}`);
        } catch (err) {
            console.error('Error creating team:', err);
            req.session.flashMessage = {
                type: 'error',
                text: 'Error creating team. Please try again.'
            };
            return res.redirect('/manager/teams/new');
        }
    },
    
    /**
     * Update a team
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    updateTeam: async (req, res) => {
        try {
            const teamId = req.params.id;
            const managerId = req.session.user._id;
            
            // Verify team ownership
            const team = await Team.getTeamById(teamId);
            
            if (!team) {
                return res.status(404).json({ error: 'Team not found' });
            }
            
            if (team.manager_id.toString() !== managerId.toString()) {
                return res.status(403).json({ error: 'Not authorized to update this team' });
            }
            
            const teamData = {
                name: req.body.name,
                sport_type: req.body.sport_type,
                description: req.body.description,
                max_members: req.body.max_members
            };
            
            await Team.updateTeam(teamId, teamData);
            
            // Set success message
            req.session.flashMessage = {
                type: 'success',
                text: 'Team updated successfully!'
            };
            
            return res.redirect(`/manager/teams/${teamId}`);
        } catch (err) {
            console.error('Error updating team:', err);
            req.session.flashMessage = {
                type: 'error',
                text: 'Error updating team. Please try again.'
            };
            return res.redirect(`/manager/teams/${req.params.id}/edit`);
        }
    },
    
    /**
     * Delete a team
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    deleteTeam: async (req, res) => {
        try {
            const teamId = req.params.id;
            const managerId = req.session.user._id;
            
            // Verify team ownership
            const team = await Team.getTeamById(teamId);
            
            if (!team) {
                return res.status(404).json({ error: 'Team not found' });
            }
            
            if (team.manager_id.toString() !== managerId.toString()) {
                return res.status(403).json({ error: 'Not authorized to delete this team' });
            }
            
            await Team.deleteTeam(teamId);
            
            // Set success message
            req.session.flashMessage = {
                type: 'success',
                text: 'Team deleted successfully!'
            };
            
            return res.redirect('/manager/teams');
        } catch (err) {
            console.error('Error deleting team:', err);
            req.session.flashMessage = {
                type: 'error',
                text: 'Error deleting team. Please try again.'
            };
            return res.redirect(`/manager/teams/${req.params.id}`);
        }
    },
    
    /**
     * Add a player to a team
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    addPlayerToTeam: async (req, res) => {
        try {
            const teamId = req.params.id;
            const playerId = req.body.player_id;
            const managerId = req.session.user._id;
            
            // Verify team ownership
            const team = await Team.getTeamById(teamId);
            
            if (!team) {
                return res.status(404).json({ error: 'Team not found' });
            }
            
            if (team.manager_id.toString() !== managerId.toString()) {
                return res.status(403).json({ error: 'Not authorized to manage this team' });
            }
            
            await Team.addPlayerToTeam(teamId, playerId);
            
            // Also update the player's profile to include this team
            await Profile.addTeamToProfile(playerId, teamId);
            
            // Set success message
            req.session.flashMessage = {
                type: 'success',
                text: 'Player added to team successfully!'
            };
            
            return res.redirect(`/manager/teams/${teamId}`);
        } catch (err) {
            console.error('Error adding player to team:', err);
            req.session.flashMessage = {
                type: 'error',
                text: 'Error adding player to team. Please try again.'
            };
            return res.redirect(`/manager/teams/${req.params.id}`);
        }
    },
    
    /**
     * Remove a player from a team
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    removePlayerFromTeam: async (req, res) => {
        try {
            const teamId = req.params.id;
            const playerId = req.params.playerId;
            const managerId = req.session.user._id;
            
            // Verify team ownership
            const team = await Team.getTeamById(teamId);
            
            if (!team) {
                return res.status(404).json({ error: 'Team not found' });
            }
            
            if (team.manager_id.toString() !== managerId.toString()) {
                return res.status(403).json({ error: 'Not authorized to manage this team' });
            }
            
            await Team.removePlayerFromTeam(teamId, playerId);
            
            // Set success message
            req.session.flashMessage = {
                type: 'success',
                text: 'Player removed from team successfully!'
            };
            
            return res.redirect(`/manager/teams/${teamId}`);
        } catch (err) {
            console.error('Error removing player from team:', err);
            req.session.flashMessage = {
                type: 'error',
                text: 'Error removing player from team. Please try again.'
            };
            return res.redirect(`/manager/teams/${req.params.id}`);
        }
    },
    
    /**
     * Process join request for a team
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    processJoinRequest: async (req, res) => {
        try {
            const teamId = req.params.id;
            const playerId = req.params.playerId;
            const status = req.body.status; // 'approved' or 'rejected'
            const managerId = req.session.user._id;
            
            // Verify team ownership
            const team = await Team.getTeamById(teamId);
            
            if (!team) {
                return res.status(404).json({ error: 'Team not found' });
            }
            
            if (team.manager_id.toString() !== managerId.toString()) {
                return res.status(403).json({ error: 'Not authorized to manage this team' });
            }
            
            await Team.updateJoinRequest(teamId, playerId, status);
            
            // If approved, also update the player's profile
            if (status === 'approved') {
                await Profile.addTeamToProfile(playerId, teamId);
            }
            
            // Set success message
            req.session.flashMessage = {
                type: 'success',
                text: `Join request ${status} successfully!`
            };
            
            return res.redirect(`/manager/teams/${teamId}/requests`);
        } catch (err) {
            console.error('Error processing join request:', err);
            req.session.flashMessage = {
                type: 'error',
                text: 'Error processing join request. Please try again.'
            };
            return res.redirect(`/manager/teams/${req.params.id}/requests`);
        }
    },
    
    /**
     * Get teams managed by a user
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    getTeamsByManager: async (req, res) => {
        try {
            const managerId = req.session.user._id;
            
            const teams = await Team.getTeamsByManager(managerId);
            
            return res.status(200).json(teams);
        } catch (err) {
            console.error('Error fetching manager teams:', err);
            return res.status(500).json({ error: 'Error fetching teams' });
        }
    },
    
    /**
     * Get teams a player is part of
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    getPlayerTeams: async (req, res) => {
        try {
            const playerId = req.params.id || req.session.user._id;
            
            const teams = await Team.getPlayerTeams(playerId);
            
            return res.status(200).json(teams);
        } catch (err) {
            console.error('Error fetching player teams:', err);
            return res.status(500).json({ error: 'Error fetching teams' });
        }
    }
}; 