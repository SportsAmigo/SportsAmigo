const Profile = require('./schemas/profileSchema');

/**
 * Profile model for user profile management
 */
module.exports = {
    /**
     * Get profile by user ID
     * @param {string} userId - User ID
     * @returns {Promise<object>} - Promise resolving to the profile
     */
    getProfileByUserId: async function(userId) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }
            
            return await Profile.findOne({ user_id: userId }).exec();
        } catch (err) {
            console.error('Error getting profile:', err);
            throw err;
        }
    },
    
    /**
     * Create user profile
     * @param {object} profileData - Profile data
     * @returns {Promise<object>} - Promise resolving to the created profile
     */
    createProfile: async function(profileData) {
        try {
            if (!profileData.user_id) {
                throw new Error('User ID is required');
            }
            
            const profile = new Profile({
                user_id: profileData.user_id,
                address: profileData.address || '',
                city: profileData.city || '',
                state: profileData.state || '',
                postal_code: profileData.postal_code || '',
                country: profileData.country || '',
                date_of_birth: profileData.date_of_birth || null,
                gender: profileData.gender || '',
                emergency_contact: {
                    name: profileData.emergency_contact_name || '',
                    relationship: profileData.emergency_contact_relationship || '',
                    phone: profileData.emergency_contact_phone || ''
                },
                interests: profileData.interests ? profileData.interests.split(',').map(i => i.trim()) : [],
                education: profileData.education || '',
                occupation: profileData.occupation || ''
            });
            
            return await profile.save();
        } catch (err) {
            console.error('Error creating profile:', err);
            throw err;
        }
    },
    
    /**
     * Update user profile
     * @param {string} userId - User ID
     * @param {object} profileData - Profile data to update
     * @returns {Promise<object>} - Promise resolving to the updated profile
     */
    updateProfile: async function(userId, profileData) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }
            
            // Check if profile exists
            const existingProfile = await this.getProfileByUserId(userId);
            
            if (!existingProfile) {
                // Profile doesn't exist, create it
                return await this.createProfile({
                    ...profileData,
                    user_id: userId
                });
            }
            
            // Prepare update data
            const updateData = {};
            
            if (profileData.address !== undefined) updateData.address = profileData.address;
            if (profileData.city !== undefined) updateData.city = profileData.city;
            if (profileData.state !== undefined) updateData.state = profileData.state;
            if (profileData.postal_code !== undefined) updateData.postal_code = profileData.postal_code;
            if (profileData.country !== undefined) updateData.country = profileData.country;
            if (profileData.date_of_birth !== undefined) updateData.date_of_birth = profileData.date_of_birth;
            if (profileData.gender !== undefined) updateData.gender = profileData.gender;
            
            // Handle emergency contact updates
            if (profileData.emergency_contact_name || 
                profileData.emergency_contact_relationship || 
                profileData.emergency_contact_phone) {
                
                updateData.emergency_contact = {
                    ...existingProfile.emergency_contact || {}
                };
                
                if (profileData.emergency_contact_name) {
                    updateData.emergency_contact.name = profileData.emergency_contact_name;
                }
                if (profileData.emergency_contact_relationship) {
                    updateData.emergency_contact.relationship = profileData.emergency_contact_relationship;
                }
                if (profileData.emergency_contact_phone) {
                    updateData.emergency_contact.phone = profileData.emergency_contact_phone;
                }
            }
            
            // Handle interests - convert string to array if provided
            if (profileData.interests) {
                updateData.interests = profileData.interests.split(',').map(i => i.trim());
            }
            
            if (profileData.education !== undefined) updateData.education = profileData.education;
            if (profileData.occupation !== undefined) updateData.occupation = profileData.occupation;
            
            // Set updated date
            updateData.updated_at = new Date();
            
            // Update and return the profile
            return await Profile.findOneAndUpdate(
                { user_id: userId },
                { $set: updateData },
                { new: true, runValidators: true }
            ).exec();
        } catch (err) {
            console.error('Error updating profile:', err);
            throw err;
        }
    },
    
    /**
     * Get player performance data
     * @param {string} playerId - Player ID
     * @returns {Promise<object>} - Promise resolving to the performance data
     */
    getPlayerPerformance: async function(playerId) {
        try {
            if (!playerId) {
                throw new Error('Player ID is required');
            }
            
            // This is a placeholder for actual performance data
            // In a real implementation, this would query the PlayerProfile model
            // For now, we return mock data for compatibility
            return {
                totalGames: 25,
                wins: 18,
                losses: 7,
                personalStats: {
                    points: 320,
                    assists: 85,
                    rebounds: 150
                },
                recentGames: [
                    { date: '2023-03-15', opponent: 'Thunder Giants', result: 'Win', score: '83-79' },
                    { date: '2023-03-08', opponent: 'Mighty Eagles', result: 'Loss', score: '72-78' },
                    { date: '2023-03-01', opponent: 'Royal Knights', result: 'Win', score: '91-85' }
                ]
            };
        } catch (err) {
            console.error('Error getting player performance:', err);
            throw err;
        }
    },
    
    /**
     * Add a team to a user's joined teams
     * @param {string} userId - User ID
     * @param {string} teamId - Team ID
     * @returns {Promise<object>} - Promise resolving to the updated profile
     */
    addTeamToProfile: async function(userId, teamId) {
        try {
            if (!userId || !teamId) {
                throw new Error('User ID and Team ID are required');
            }
            
            // Check if profile exists, create if it doesn't
            const profile = await this.getProfileByUserId(userId);
            
            if (!profile) {
                return await this.createProfile({
                    user_id: userId,
                    joined_teams: [{
                        team_id: teamId,
                        joined_date: new Date(),
                        status: 'active'
                    }]
                });
            }
            
            // Check if team already exists in profile
            const teamExists = profile.joined_teams.some(team => 
                team.team_id.toString() === teamId.toString()
            );
            
            if (teamExists) {
                // Update status to active if it exists
                return await Profile.findOneAndUpdate(
                    { 
                        user_id: userId,
                        'joined_teams.team_id': teamId 
                    },
                    { 
                        $set: { 
                            'joined_teams.$.status': 'active',
                            updated_at: new Date()
                        } 
                    },
                    { new: true }
                ).exec();
            } else {
                // Add new team to joined_teams array
                return await Profile.findOneAndUpdate(
                    { user_id: userId },
                    { 
                        $push: { 
                            joined_teams: {
                                team_id: teamId,
                                joined_date: new Date(),
                                status: 'active'
                            }
                        },
                        $set: { updated_at: new Date() }
                    },
                    { new: true, runValidators: true }
                ).exec();
            }
        } catch (err) {
            console.error('Error adding team to profile:', err);
            throw err;
        }
    }
}; 