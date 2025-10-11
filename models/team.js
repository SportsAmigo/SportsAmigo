const Team = require('./schemas/teamSchema');
const User = require('./schemas/userSchema');

/**
 * Team model for team management
 */
module.exports = {
    /**
     * Create a new team
     * @param {object} teamData - Team data
     * @returns {Promise<object>} - Promise resolving to the created team
     */
    createTeam: async function(teamData) {
        try {
        if (!teamData || !teamData.name || !teamData.sport_type || !teamData.manager_id) {
                throw new Error('Team name, sport type, and manager ID are required');
            }

            const team = new Team({
                name: teamData.name,
                sport_type: teamData.sport_type,
                manager_id: teamData.manager_id,
                description: teamData.description || '',
                max_members: teamData.max_members || 0,
                members: [],
                join_requests: []
            });
            
            return await team.save();
        } catch (err) {
            console.error('Error creating team:', err);
            throw err;
        }
    },
    
    /**
     * Get team by ID
     * @param {string} teamId - Team ID
     * @returns {Promise<object>} - Promise resolving to the team object
     */
    getTeamById: async function(teamId) {
        try {
            if (!teamId) {
                throw new Error('Team ID is required');
            }
            
            // Get team with members populated
            const team = await Team.findById(teamId).exec();
                
                if (!team) {
                throw new Error('Team not found');
            }
            
            // Get manager information
            const manager = await User.findById(team.manager_id)
                .select('first_name last_name email')
                .exec();
            
            // Create team object with manager info
                    const teamWithManager = {
                ...team.toObject(),
                        manager_first_name: manager ? manager.first_name : '',
                        manager_last_name: manager ? manager.last_name : '',
                manager_email: manager ? manager.email : '',
                member_count: team.members ? team.members.length : 0
            };
            
            // Get user information for team members
            if (team.members && team.members.length > 0) {
                const memberIds = team.members.map(member => member.player_id);
                const users = await User.find({ _id: { $in: memberIds } })
                    .select('first_name last_name email')
                    .exec();
                
                // Create a map of user info by ID
                const usersMap = users.reduce((map, user) => {
                    map[user._id.toString()] = user;
                    return map;
                }, {});
                
                // Add user info to members
                teamWithManager.members = team.members.map(member => {
                    const user = usersMap[member.player_id.toString()];
                    return {
                        ...member.toObject(),
                        first_name: user ? user.first_name : '',
                        last_name: user ? user.last_name : '',
                        email: user ? user.email : ''
                    };
                });
            }
            
            return teamWithManager;
        } catch (err) {
            console.error('Error getting team by ID:', err);
            throw err;
        }
    },
    
    /**
     * Get all teams
     * @returns {Promise<Array>} - Promise resolving to an array of team objects
     */
    getAllTeams: async function() {
        try {
            const teams = await Team.find().sort({ name: 1 }).exec();
            
            return teams.map(team => ({
                ...team.toObject(),
                current_members: team.members ? team.members.length : 0
            }));
        } catch (err) {
            console.error('Error getting all teams:', err);
            throw err;
        }
    },
    
    /**
     * Get teams managed by a specific user
     * @param {string} managerId - Manager user ID
     * @returns {Promise<Array>} - Promise resolving to an array of team objects
     */
    getTeamsByManager: async function(managerId) {
        try {
            if (!managerId) {
                throw new Error('Manager ID is required');
            }
            
            const teams = await Team.find({ manager_id: managerId })
                .sort({ name: 1 })
                .exec();
            
            return teams.map(team => ({
                ...team.toObject(),
                current_members: team.members ? team.members.length : 0
            }));
        } catch (err) {
            console.error('Error getting teams by manager:', err);
            throw err;
        }
    },
    
    /**
     * Get all teams a player is a member of
     * @param {string} playerId - The ID of the player
     * @returns {Promise<Array>} - Promise resolving to teams array
     */
    getPlayerTeams: async function(playerId) {
        try {
            if (!playerId) {
                throw new Error('Player ID is required');
            }
            
            // Ensure playerId is properly formatted
            const ObjectId = require('mongoose').Types.ObjectId;
            const playerObjectId = new ObjectId(playerId);
            
            // Find teams where player is a member
            const teams = await Team.find({ 'members.player_id': playerObjectId })
                .sort({ name: 1 })
                .exec();
            
            // Get manager information for each team
            const managerIds = teams.map(team => team.manager_id);
            const managers = await User.find({ _id: { $in: managerIds } })
                .select('_id first_name last_name email')
                .exec();
            
            // Create a map of manager info by ID
            const managersMap = managers.reduce((map, manager) => {
                map[manager._id.toString()] = manager;
                return map;
            }, {});
            
            // Get all unique member IDs from all teams
            const allMemberIds = [];
            teams.forEach(team => {
                if (team.members && team.members.length > 0) {
                    team.members.forEach(member => {
                        if (member.player_id && !allMemberIds.includes(member.player_id.toString())) {
                            allMemberIds.push(member.player_id.toString());
                        }
                    });
                }
            });
            
            // Get user information for all members
            const memberUsers = await User.find({ _id: { $in: allMemberIds } })
                .select('_id first_name last_name email')
                .exec();
            
            // Create a map of user info by ID
            const usersMap = memberUsers.reduce((map, user) => {
                map[user._id.toString()] = user;
                return map;
            }, {});
            
            // Add manager info and member details to teams
            return teams.map(team => {
                const manager = managersMap[team.manager_id.toString()];
                const teamObj = team.toObject();
                
                // Add member details with user information
                if (teamObj.members && teamObj.members.length > 0) {
                    teamObj.team_members = teamObj.members.map(member => {
                        const user = usersMap[member.player_id.toString()];
                        return {
                            ...member,
                            player_id: member.player_id,
                            first_name: user ? user.first_name : 'Unknown',
                            last_name: user ? user.last_name : 'User',
                            email: user ? user.email : 'No email',
                            joined_date: member.joined_date,
                            status: member.status || 'active'
                        };
                    });
                } else {
                    teamObj.team_members = [];
                }
                
                return {
                    ...teamObj,
                    member_count: teamObj.members ? teamObj.members.length : 0,
                    manager_first_name: manager ? manager.first_name : '',
                    manager_last_name: manager ? manager.last_name : '',
                    manager_email: manager ? manager.email : '',
                    manager_name: manager ? `${manager.first_name} ${manager.last_name}` : 'Team Manager'
                };
            });
        } catch (err) {
            console.error('Error getting player teams:', err);
            throw err;
        }
    },
    
    /**
     * Check if a player is a member of specific teams
     * @param {string} playerId - The ID of the player
     * @param {Array} teamIds - Array of team IDs to check
     * @returns {Promise<Object>} - Promise resolving to map of teamId -> isMember
     */
    isPlayerInTeams: async function(playerId, teamIds) {
        try {
            if (!playerId) {
                throw new Error('Player ID is required');
            }
            
            if (!teamIds || !teamIds.length) {
                return {};
            }
            
            // Find all teams that this player is a member of
            const teams = await Team.find({ 
                'members.player_id': playerId,
                '_id': { $in: teamIds }
            }).exec();
            
            // Create a map of team IDs -> membership status
            const membershipMap = {};
            teamIds.forEach(teamId => {
                membershipMap[teamId] = false;
            });
            
            // Update map for teams player is in
            teams.forEach(team => {
                membershipMap[team._id.toString()] = true;
            });
            
            return membershipMap;
        } catch (err) {
            console.error('Error checking player team membership:', err);
            throw err;
        }
    },
    
    /**
     * Get primary team for a player (used by admin controller)
     * @param {string} playerId - Player ID
     * @returns {Promise<object>} - Promise resolving to the player's primary team or null
     */
    getTeamForPlayer: async function(playerId) {
        try {
            if (!playerId) {
                throw new Error('Player ID is required');
            }
            
            // Find the first team where this player is a member
            const team = await Team.findOne({ 'members.player_id': playerId }).exec();
            
            if (!team) {
                return null;
            }
            
            // Get manager information
            const manager = await User.findById(team.manager_id)
                .select('first_name last_name email')
                .exec();
            
            return {
                ...team.toObject(),
                manager_name: manager ? `${manager.first_name} ${manager.last_name}` : 'Unknown',
                manager_email: manager ? manager.email : ''
            };
        } catch (err) {
            console.error('Error getting team for player:', err);
            throw err;
        }
    },
    
    /**
     * Update team information
     * @param {string} teamId - Team ID
     * @param {object} teamData - Updated team data
     * @returns {Promise<object>} - Promise resolving to the updated team
     */
    updateTeam: async function(teamId, teamData) {
        try {
            if (!teamId) {
                throw new Error('Team ID is required');
            }
            
            const updateData = {};
            if (teamData.name) updateData.name = teamData.name;
            if (teamData.sport_type) updateData.sport_type = teamData.sport_type;
            if (teamData.description !== undefined) updateData.description = teamData.description;
            if (teamData.max_members !== undefined) updateData.max_members = teamData.max_members;
            
            return await Team.findByIdAndUpdate(
                teamId,
                { $set: updateData },
                { new: true }
            ).exec();
        } catch (err) {
            console.error('Error updating team:', err);
            throw err;
        }
    },
    
    /**
     * Delete a team
     * @param {string} teamId - Team ID
     * @returns {Promise<boolean>} - Promise resolving to true if successful
     */
    deleteTeam: async function(teamId) {
        try {
            if (!teamId) {
                throw new Error('Team ID is required');
            }
            
            const result = await Team.findByIdAndDelete(teamId).exec();
            return !!result;
        } catch (err) {
            console.error('Error deleting team:', err);
            throw err;
        }
    },
    
    /**
     * Get teams managed by a specific user (alias for getTeamsByManager)
     * @param {string} managerId - Manager user ID
     * @returns {Promise<Array>} - Promise resolving to an array of team objects
     */
    getManagerTeams: async function(managerId) {
        return this.getTeamsByManager(managerId);
    },
    
    /**
     * Get all join requests for teams managed by a specific user
     * @param {string} managerId - Manager user ID
     * @returns {Promise<Array>} - Promise resolving to an array of join request objects with team info
     */
    getManagerJoinRequests: async function(managerId) {
        try {
            if (!managerId) {
                throw new Error('Manager ID is required');
            }
            
            console.log(`Getting join requests for manager ${managerId}`);
            
            // Get all teams managed by this manager
            const teams = await Team.find({ manager_id: managerId }).exec();
            
            if (!teams || teams.length === 0) {
                console.log('No teams found for this manager');
                return [];
            }
            
            console.log(`Found ${teams.length} teams for manager`);
            
            // Get all join requests for these teams
            const joinRequests = [];
            
            // Get user ids from join requests to fetch user details
            const userIds = [];
            
            // Collect all join requests and user IDs
            teams.forEach(team => {
                if (team.join_requests && team.join_requests.length > 0) {
                    const pendingRequests = team.join_requests.filter(r => r.status === 'pending');
                    console.log(`Team ${team.name} has ${pendingRequests.length} pending join requests`);
                    
                    pendingRequests.forEach(request => {
                        joinRequests.push({
                            team_id: team._id,
                            team_name: team.name,
                            sport_type: team.sport_type,
                            request_id: request._id,
                            player_id: request.player_id,
                            request_date: request.request_date,
                            status: request.status,
                            message: request.message || ''
                        });
                        
                        userIds.push(request.player_id);
                    });
                }
            });
            
            if (joinRequests.length === 0) {
                console.log('No pending join requests found');
                return [];
            }
            
            console.log(`Found ${joinRequests.length} pending join requests total`);
            
            // Get user details for all player IDs
            const users = await User.find({ _id: { $in: userIds } })
                .select('first_name last_name email')
                .exec();
                
            console.log(`Found ${users.length} user records for player details`);
            
            // Create a map of user info by ID
            const usersMap = users.reduce((map, user) => {
                map[user._id.toString()] = user;
                return map;
            }, {});
            
            // Add user details to join requests
            return joinRequests.map(request => {
                const user = usersMap[request.player_id.toString()];
                return {
                    ...request,
                    player_first_name: user ? user.first_name : 'Unknown',
                    player_last_name: user ? user.last_name : 'Player',
                    player_email: user ? user.email : ''
                };
            });
        } catch (err) {
            console.error('Error getting manager join requests:', err);
            throw err;
        }
    },
    
    /**
     * Add a player to a team
     * @param {string} teamId - Team ID
     * @param {string} playerId - Player ID
     * @returns {Promise<object>} - Promise resolving to the updated team
     */
    addPlayerToTeam: async function(teamId, playerId) {
        try {
            if (!teamId || !playerId) {
                throw new Error('Team ID and Player ID are required');
            }
            
            // Check if player is already on the team
            const team = await Team.findById(teamId).exec();
            if (!team) {
                throw new Error('Team not found');
            }
            
            const existingMember = team.members.find(m => m.player_id.toString() === playerId.toString());
            if (existingMember) {
                // If they exist but are inactive, update to active
                if (existingMember.status !== 'active') {
                    return await Team.findOneAndUpdate(
                        { _id: teamId, 'members.player_id': playerId },
                        { $set: { 'members.$.status': 'active' } },
                        { new: true }
                    ).exec();
                }
                
                // Already an active member
                return team;
            }
            
            // Add the new player to the team
            return await Team.findByIdAndUpdate(
                teamId,
                { 
                    $push: { 
                        members: {
                            player_id: playerId,
                            joined_date: new Date(),
                            status: 'active'
                        }
                    }
                },
                { new: true }
            ).exec();
        } catch (err) {
                            console.error('Error adding player to team:', err);
            throw err;
        }
    },
    
    /**
     * Remove a player from a team
     * @param {string} teamId - Team ID
     * @param {string} playerId - Player ID
     * @returns {Promise<object>} - Promise resolving to the updated team
     */
    removePlayerFromTeam: async function(teamId, playerId) {
        try {
            if (!teamId || !playerId) {
                throw new Error('Team ID and Player ID are required');
            }
            
            console.log(`Removing player ${playerId} from team ${teamId}`);
            
            // Actually remove player from team members array
            const updatedTeam = await Team.findByIdAndUpdate(
                teamId,
                { $pull: { members: { player_id: playerId } } },
                { new: true }
            ).exec();
            
            console.log(`Player removal result:`, updatedTeam ? 'Success' : 'Failed');
            
            if (!updatedTeam) {
                throw new Error('Team not found or player not in team');
            }
            
            // Also check and remove any pending join requests from this player
            if (updatedTeam.join_requests && updatedTeam.join_requests.length > 0) {
                updatedTeam.join_requests = updatedTeam.join_requests.filter(
                    req => req.player_id.toString() !== playerId.toString()
                );
                await updatedTeam.save();
            }
            
            return updatedTeam;
        } catch (err) {
            console.error('Error removing player from team:', err);
            throw err;
        }
    },
    
    /**
     * Add a join request from a player to a team
     * @param {string} teamId - Team ID
     * @param {string} playerId - Player ID
     * @returns {Promise<object>} - Promise resolving to the updated team
     */
    addJoinRequest: async function(teamId, playerId) {
        try {
            if (!teamId || !playerId) {
                throw new Error('Team ID and player ID are required');
            }
            
            // Check if team exists
            const team = await Team.findById(teamId).exec();
            if (!team) {
                throw new Error('Team not found');
            }
            
            // Check if player is already a member of this team
            const isMember = team.members.some(member => 
                member.player_id.toString() === playerId.toString());
            
            if (isMember) {
                throw new Error('Player is already a member of this team');
            }
            
            // Check if player has already submitted a request
            const existingRequest = team.join_requests.find(request => 
                request.player_id.toString() === playerId.toString());
            
            if (existingRequest) {
                if (existingRequest.status === 'pending') {
                    throw new Error('Player has already submitted a request to join this team');
                } else if (existingRequest.status === 'rejected') {
                    // Update the existing request to pending again
                    return await Team.findOneAndUpdate(
                        { _id: teamId, 'join_requests.player_id': playerId },
                        { $set: { 'join_requests.$.status': 'pending', 'join_requests.$.request_date': new Date() } },
                        { new: true }
                    ).exec();
                }
            }
            
            // Add new join request
            return await Team.findByIdAndUpdate(
                teamId,
                { 
                    $push: { 
                        join_requests: {
                            player_id: playerId,
                            request_date: new Date(),
                            status: 'pending'
                        }
                    }
                },
                { new: true }
            ).exec();
        } catch (err) {
            console.error('Error adding join request:', err);
            throw err;
        }
    },
    
    /**
     * Update join request status
     * @param {string} teamId - Team ID
     * @param {string} playerId - Player ID
     * @param {string} status - New status (approved or rejected)
     * @returns {Promise<object>} - Promise resolving to the updated team
     */
    updateJoinRequest: async function(teamId, playerId, status) {
        try {
            if (!teamId || !playerId) {
                throw new Error('Team ID and Player ID are required');
            }
            
            if (status !== 'approved' && status !== 'rejected') {
                throw new Error('Status must be approved or rejected');
            }
            
            // Update the join request status
            const result = await Team.findOneAndUpdate(
                { _id: teamId, 'join_requests.player_id': playerId },
                { $set: { 'join_requests.$.status': status } },
                { new: true }
            ).exec();
            
            // If approved, add player to the team
            if (status === 'approved') {
                await this.addPlayerToTeam(teamId, playerId);
            }
            
            return result;
        } catch (err) {
            console.error('Error updating join request:', err);
            throw err;
        }
    },
    
    /**
     * Process a join request by request ID
     * @param {string} requestId - Request ID 
     * @param {string} status - New status (approved or rejected)
     * @returns {Promise<boolean>} - Promise resolving to success status
     */
    processJoinRequest: async function(requestId, status) {
        try {
            if (!requestId) {
                throw new Error('Request ID is required');
            }
            
            if (status !== 'approved' && status !== 'rejected') {
                throw new Error('Status must be approved or rejected');
            }
            
            console.log(`Processing join request ${requestId} with status ${status}`);
            
            // Find the team with this join request ID
            // In MongoDB, we're searching for a team that has a join_requests subdocument with the given _id
            const team = await Team.findOne({ 'join_requests._id': requestId }).exec();
            
            if (!team) {
                throw new Error('Join request not found');
            }
            
            // Find the specific request in the join_requests array
            const request = team.join_requests.find(req => req._id.toString() === requestId);
            
            if (!request) {
                throw new Error('Join request not found in team');
            }
            
            console.log(`Found join request from player ${request.player_id} for team ${team._id}`);
            
            // Update the request status
            team.join_requests.forEach(req => {
                if (req._id.toString() === requestId) {
                    req.status = status;
                }
            });
            
            // If approved, add player to the team members
            if (status === 'approved') {
                console.log(`Approving join request: adding player ${request.player_id} to team ${team._id}`);
                
                // Check if player is already a member
                const isMember = team.members.some(member => 
                    member.player_id.toString() === request.player_id.toString()
                );
                
                if (!isMember) {
                    team.members.push({
                        player_id: request.player_id,
                        joined_date: new Date(),
                        status: 'active'
                    });
                    console.log(`Added player ${request.player_id} to team members`);
                } else {
                    console.log(`Player ${request.player_id} is already a team member`);
                }
            }
            
            // Save the updated team
            await team.save();
            console.log(`Team saved successfully, request status updated to ${status}`);
            return true;
        } catch (err) {
            console.error('Error processing join request:', err);
            throw err;
        }
    },
    
    /**
     * Get all join requests for a team
     * @param {string} teamId - Team ID
     * @returns {Promise<Array>} - Promise resolving to an array of join requests
     */
    getTeamJoinRequests: async function(teamId) {
        try {
            if (!teamId) {
                throw new Error('Team ID is required');
            }
            
            const team = await Team.findById(teamId).exec();
            if (!team) {
                throw new Error('Team not found');
            }
            
            if (!team.join_requests || team.join_requests.length === 0) {
                return [];
            }
            
            // Get player info for each request
            const playerIds = team.join_requests.map(req => req.player_id);
            const players = await User.find({ _id: { $in: playerIds } })
                .select('first_name last_name email')
                .exec();
            
            // Create a map of player info by ID
            const playersMap = players.reduce((map, player) => {
                map[player._id.toString()] = player;
                return map;
            }, {});
            
            // Add player info to requests
            return team.join_requests.map(req => {
                const player = playersMap[req.player_id.toString()];
                            return {
                    ...req.toObject(),
                    player_name: player ? `${player.first_name} ${player.last_name}` : 'Unknown Player',
                    player_email: player ? player.email : ''
                };
            });
        } catch (err) {
            console.error('Error getting team join requests:', err);
            throw err;
        }
    },
    
    /**
     * Handle a join request (approve or reject)
     * @param {string} teamId - Team ID
     * @param {string} playerId - Player ID
     * @param {string} action - Action to take ('approve' or 'reject')
     * @returns {Promise<object>} - Promise resolving to the updated team
     */
    handleJoinRequest: async function(teamId, playerId, action) {
        try {
            if (!teamId || !playerId) {
                throw new Error('Team ID and player ID are required');
            }
            
            if (action !== 'approve' && action !== 'reject') {
                throw new Error('Action must be either "approve" or "reject"');
            }
            
            // Get team
            const team = await Team.findById(teamId).exec();
            if (!team) {
                throw new Error('Team not found');
            }
            
            // Find the request
            const requestIndex = team.join_requests.findIndex(req => 
                req.player_id.toString() === playerId.toString() && req.status === 'pending');
            
            if (requestIndex === -1) {
                throw new Error('No pending join request found for this player');
            }
            
            if (action === 'approve') {
                // First update the request status
                await Team.findOneAndUpdate(
                    { _id: teamId, 'join_requests.player_id': playerId },
                    { $set: { 'join_requests.$.status': 'approved' } }
                ).exec();
                
                // Then add the player to the team's members
                return await Team.findByIdAndUpdate(
                    teamId,
                    { 
                        $push: { 
                            members: {
                                player_id: playerId,
                                joined_date: new Date(),
                                status: 'active'
                            }
                        }
                    },
                    { new: true }
                ).exec();
                    } else {
                // Reject the request
                return await Team.findOneAndUpdate(
                    { _id: teamId, 'join_requests.player_id': playerId },
                    { $set: { 'join_requests.$.status': 'rejected' } },
                    { new: true }
                ).exec();
            }
        } catch (err) {
            console.error('Error handling join request:', err);
            throw err;
        }
    },
    
    /**
     * Get all members of a team with their user information
     * @param {string} teamId - Team ID
     * @returns {Promise<Array>} - Promise resolving to an array of team members
     */
    getTeamMembers: async function(teamId) {
        try {
            if (!teamId) {
                throw new Error('Team ID is required');
            }
            
            const team = await Team.findById(teamId).exec();
            if (!team) {
                throw new Error('Team not found');
            }
            
            if (!team.members || team.members.length === 0) {
                return [];
            }
            
            // Get user info for all members
            const memberIds = team.members.map(member => member.player_id);
            const users = await User.find({ _id: { $in: memberIds } })
                .select('first_name last_name email')
                .exec();
            
            // Create a map of user info by ID
            const usersMap = users.reduce((map, user) => {
                map[user._id.toString()] = user;
                return map;
            }, {});
            
            // Add user info to members
            return team.members.map(member => {
                const user = usersMap[member.player_id.toString()];
                return {
                    ...member.toObject(),
                    first_name: user ? user.first_name : 'Unknown',
                    last_name: user ? user.last_name : 'User',
                    email: user ? user.email : '',
                    full_name: user ? `${user.first_name} ${user.last_name}` : 'Unknown User'
                };
            });
        } catch (err) {
            console.error('Error getting team members:', err);
            throw err;
        }
    },
    
    /**
     * Remove a member from a team
     * @param {string} teamId - Team ID
     * @param {string} playerId - Player ID to remove
     * @returns {Promise<object>} - Promise resolving to the updated team
     */
    removeMember: async function(teamId, playerId) {
        try {
            if (!teamId || !playerId) {
                throw new Error('Team ID and player ID are required');
            }
            
            return await Team.findByIdAndUpdate(
                teamId,
                { $pull: { members: { player_id: playerId } } },
                { new: true }
            ).exec();
        } catch (err) {
            console.error('Error removing team member:', err);
            throw err;
        }
    }
}; 