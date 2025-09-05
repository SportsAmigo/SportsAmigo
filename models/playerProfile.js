const PlayerProfile = require('./schemas/playerProfileSchema');
const User = require('./schemas/userSchema');

/**
 * PlayerProfile model for player profiles and performance data
 */
module.exports = {
    /**
     * Create a new player profile
     * @param {object} profileData - Profile data
     * @returns {Promise<object>} - Promise resolving to the created profile
     */
    createProfile: async function(profileData) {
        try {
            if (!profileData.user_id) {
                throw new Error('User ID is required');
            }
            
            const profile = new PlayerProfile({
                user_id: profileData.user_id,
                sport: profileData.sport,
                position: profileData.position || '',
                skill_level: profileData.skill_level || '',
                years_experience: profileData.years_experience || 0,
                achievements: profileData.achievements || '',
                preferred_team_types: profileData.preferred_team_types || '',
                availability: profileData.availability || '',
                stats: {
                    games_played: profileData.games_played || 0,
                    goals: profileData.goals || 0,
                    assists: profileData.assists || 0,
                    points: profileData.points || 0
                }
            });
            
            return await profile.save();
        } catch (err) {
            console.error('Error creating player profile:', err);
            throw err;
        }
    },
    
    /**
     * Get player profile by user ID
     * @param {string} userId - User ID
     * @returns {Promise<object>} - Promise resolving to the profile
     */
    getProfileByUserId: async function(userId) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }
            
            // Find profile and populate user data
            const profile = await PlayerProfile.findOne({ user_id: userId }).exec();
            
            if (!profile) {
                return null; // Profile not found
            }
            
            // Get user information
            const user = await User.findById(userId).exec();
            
            if (!user) {
                return profile; // Just return profile if user not found
            }
            
            // Combine profile with user data
            return {
                ...profile.toObject(),
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                role: user.role,
                created_at: user.created_at
            };
        } catch (err) {
            console.error('Error fetching player profile:', err);
            throw err;
        }
    },
    
    /**
     * Get all player profiles
     * @returns {Promise<Array>} - Promise resolving to an array of profiles
     */
    getAllProfiles: async function() {
        try {
            // Find all profiles
            const profiles = await PlayerProfile.find().exec();
            
            // Get all player users
            const users = await User.find({ role: 'player' }).exec();
            
            // Map users to profile data
            const usersMap = users.reduce((map, user) => {
                map[user._id.toString()] = user;
                return map;
            }, {});
            
            // Combine profile with user data
            return profiles.map(profile => {
                const userId = profile.user_id.toString();
                const user = usersMap[userId] || {};
                
                return {
                    ...profile.toObject(),
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role
                };
            });
        } catch (err) {
            console.error('Error fetching all player profiles:', err);
            throw err;
        }
    },
    
    /**
     * Update player profile
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
            let profile = await PlayerProfile.findOne({ user_id: userId }).exec();
            
            if (!profile) {
                // Profile doesn't exist, create it
                return await this.createProfile({ ...profileData, user_id: userId });
            }
            
            // Update profile fields
            const updateFields = {};
            
            if (profileData.sport) updateFields.sport = profileData.sport;
            if (profileData.position) updateFields.position = profileData.position;
            if (profileData.skill_level) updateFields.skill_level = profileData.skill_level;
            if (profileData.years_experience) updateFields.years_experience = profileData.years_experience;
            if (profileData.achievements) updateFields.achievements = profileData.achievements;
            if (profileData.preferred_team_types) updateFields.preferred_team_types = profileData.preferred_team_types;
            if (profileData.availability) updateFields.availability = profileData.availability;
            
            // Update stats if provided
            if (profileData.games_played || profileData.goals || profileData.assists || profileData.points) {
                updateFields.stats = { ...profile.stats };
                if (profileData.games_played) updateFields.stats.games_played = profileData.games_played;
                if (profileData.goals) updateFields.stats.goals = profileData.goals;
                if (profileData.assists) updateFields.stats.assists = profileData.assists;
                if (profileData.points) updateFields.stats.points = profileData.points;
            }
            
            // Set updated date
            updateFields.updated_at = new Date();
            
            // Update and return the profile
            return await PlayerProfile.findOneAndUpdate(
                { user_id: userId },
                { $set: updateFields },
                { new: true, runValidators: true }
            ).exec();
        } catch (err) {
            console.error('Error updating player profile:', err);
            throw err;
        }
    },
    
    /**
     * Get a player's performance data
     * @param {string} userId - User ID of the player
     * @returns {Promise<object>} - Promise resolving to the player's performance data
     */
    getPlayerPerformance: async function(userId) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }
            
            // Get player's profile with stats
            const profile = await PlayerProfile.findOne({ user_id: userId }).exec();
            
            if (!profile) {
                return null;
            }
            
            // In a real implementation, we would also get team and event data
            // This would require importing the Team and Event models
            // For now, we'll just return the profile stats
            
            return {
                stats: profile.stats,
                // We would add team and event data here
                teams: [],
                events: []
            };
        } catch (err) {
            console.error('Error getting player performance:', err);
            throw err;
        }
    }
}; 