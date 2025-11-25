const User = require('./schemas/userSchema');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

/**
 * User model
 */
module.exports = {
    /**
     * Create a new user
     * @param {object} userData - User data
     * @returns {Promise<object>} - Promise resolving to the created user
     */
    createUser: async function(userData) {
        try {
            // Hash password
            if (userData.password) {
                const salt = await bcrypt.genSalt(10);
                userData.password = await bcrypt.hash(userData.password, salt);
            }
            
            // Extract profile data
            const profileData = {};
            if (userData.age) profileData.age = userData.age;
            if (userData.address) profileData.address = userData.address;
            if (userData.preferred_sports) profileData.preferred_sports = userData.preferred_sports;
            if (userData.organization_name) profileData.organization_name = userData.organization_name;
            if (userData.team_name) profileData.team_name = userData.team_name;
            
            // Create user with embedded profile
            const user = new User({
                email: userData.email,
                password: userData.password,
                role: userData.role,
                first_name: userData.first_name,
                last_name: userData.last_name,
                phone: userData.phone || '',
                bio: userData.bio || '',
                profile_image: userData.profile_image || '',
                profile: profileData
            });
            
            // Save and return user
            return await user.save();
        } catch (err) {
            console.error('Error creating user:', err);
            throw err;
        }
    },
    
    /**
     * Get user by email
     * @param {string} email - User email
     * @returns {Promise<object>} - Promise resolving to the user
     */
    getUserByEmail: async function(email) {
        try {
            return await User.findOne({ email });
        } catch (err) {
            console.error('Error getting user by email:', err);
            throw err;
        }
    },
    
    /**
     * Get user by ID
     * @param {string} userId - User ID
     * @returns {Promise<object>} - Promise resolving to the user
     */
    getUserById: async function(userId) {
        try {
            return await User.findById(userId);
        } catch (err) {
            console.error('Error getting user by ID:', err);
            throw err;
        }
    },
    
    /**
     * Update user
     * @param {string} userId - User ID
     * @param {object} userData - Updated user data
     * @returns {Promise<object>} - Promise resolving to the updated user
     */
    updateUser: async function(userId, userData) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            console.log('Updating user with data:', userData);

            // Create update document
            const updateData = {};
            
            // Process simple fields
            if (userData.first_name !== undefined) updateData.first_name = userData.first_name;
            if (userData.last_name !== undefined) updateData.last_name = userData.last_name;
            if (userData.name !== undefined) {
                // If name is provided but not first/last, try to split it
                if (!userData.first_name && !userData.last_name) {
                    const nameParts = userData.name.split(' ');
                    updateData.first_name = nameParts[0] || '';
                    updateData.last_name = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
                }
            }
            if (userData.phone !== undefined) updateData.phone = userData.phone;
            if (userData.bio !== undefined) updateData.bio = userData.bio;
            
            // Handle profile fields - these should go in the profile sub-document
            if (userData.age !== undefined) updateData['profile.age'] = userData.age;
            if (userData.address !== undefined) updateData['profile.address'] = userData.address;
            if (userData.organization_name !== undefined) updateData['profile.organization_name'] = userData.organization_name;
            if (userData.organization !== undefined && !userData.organization_name) {
                updateData['profile.organization_name'] = userData.organization;
            }
            
            // Ensure profile_image is copied over if it exists
            if (userData.profile_image !== undefined) {
                updateData.profile_image = userData.profile_image;
                console.log('Setting profile_image to:', userData.profile_image);
            }
            if (userData.photoUrl !== undefined) {
                updateData.profile_image = userData.photoUrl;
                console.log('Setting profile_image from photoUrl to:', userData.photoUrl);
            }
            
            // Process preferred_sports - ensure it's a string even if an array is passed
            if (userData.preferred_sports !== undefined) {
                if (Array.isArray(userData.preferred_sports)) {
                    updateData['profile.preferred_sports'] = userData.preferred_sports.join(', ');
                } else {
                    updateData['profile.preferred_sports'] = userData.preferred_sports;
                }
            }
            
            // Handle other profile fields
            if (userData.profile) {
                // For each profile field, check if it's an array and convert to string if needed
                for (const [key, value] of Object.entries(userData.profile)) {
                    if (value !== undefined) {
                        const fieldName = `profile.${key}`;
                        if (Array.isArray(value)) {
                            updateData[fieldName] = value.join(', ');
                        } else {
                            updateData[fieldName] = value;
                        }
                    }
                }
            }

            console.log('Update document:', updateData);

            // Update user in database
            const updatedUser = await User.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true }
            ).exec();

            if (!updatedUser) {
                throw new Error('User not found');
            }

            console.log('User updated successfully:', updatedUser);
            return updatedUser;
        } catch (err) {
            console.error('Error updating user:', err);
            throw err;
        }
    },
    
    /**
     * Delete user
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} - Promise resolving to success status
     */
    deleteUser: async function(userId) {
        try {
            if (!userId) {
                throw new Error('User ID is required');
            }

            // Ensure userId is a valid MongoDB ObjectId
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                throw new Error('Invalid user ID format');
            }

            // Convert string ID to MongoDB ObjectId
            const objectId = new mongoose.Types.ObjectId(userId);
            
            // Find and delete the user
            const result = await User.findByIdAndDelete(objectId);
            
            if (!result) {
                console.log(`No user found with ID ${userId}`);
                return false;
            }
            
            console.log(`Successfully deleted user ${userId}`);
            return true;
        } catch (err) {
            console.error('Error deleting user:', err);
            throw err;
        }
    },
    
    /**
     * Get all users
     * @param {object} filter - Filter criteria
     * @returns {Promise<Array>} - Promise resolving to array of users
     */
    getAllUsers: async function(filter = {}) {
        try {
            const query = {};
            if (filter.role) query.role = filter.role;
            
            return await User.find(query).sort({ first_name: 1, last_name: 1 });
        } catch (err) {
            console.error('Error getting all users:', err);
            throw err;
        }
    },
    
    /**
     * Authenticate user
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<object|null>} - Promise resolving to user or null
     */
    authenticate: async function(email, password) {
        try {
            const user = await User.findOne({ email });
            if (!user) {
                return null;
            }
            
            const isMatch = await bcrypt.compare(password, user.password);
            return isMatch ? user : null;
        } catch (err) {
            console.error('Error authenticating user:', err);
            throw err;
        }
    }
}; 