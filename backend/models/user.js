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
            
            // Set verification status based on role if not explicitly provided
            if (userData.verificationStatus === undefined) {
                userData.verificationStatus = userData.role === 'organizer' ? 'pending' : 'verified';
            }
            
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
                verificationStatus: userData.verificationStatus,
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
            if (userData.role !== undefined) updateData.role = userData.role;
            if (userData.verificationStatus !== undefined) updateData.verificationStatus = userData.verificationStatus;
            
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
    },

    /**
     * Save OTP for email verification
     * @param {string} email - User email
     * @param {string} otp - OTP code
     * @param {Date} expiresAt - OTP expiry timestamp
     * @returns {Promise<object>} - Promise resolving to updated user
     */
    saveOTP: async function(email, otp, expiresAt) {
        try {
            const user = await User.findOneAndUpdate(
                { email },
                {
                    $set: {
                        'otp.code': otp,
                        'otp.expiresAt': expiresAt,
                        'otp.attempts': 0
                    }
                },
                { new: true }
            );
            return user;
        } catch (err) {
            console.error('Error saving OTP:', err);
            throw err;
        }
    },

    /**
     * Verify OTP
     * @param {string} email - User email
     * @param {string} otp - OTP code to verify
     * @returns {Promise<object>} - { valid: boolean, message: string, user?: object }
     */
    verifyOTP: async function(email, otp) {
        try {
            const user = await User.findOne({ email });
            
            if (!user) {
                return { valid: false, message: 'User not found' };
            }

            if (!user.otp || !user.otp.code) {
                return { valid: false, message: 'No OTP found. Please request a new one.' };
            }

            // Check if OTP has expired
            if (new Date() > user.otp.expiresAt) {
                return { valid: false, message: 'OTP has expired. Please request a new one.' };
            }

            // Check if max attempts exceeded
            if (user.otp.attempts >= 5) {
                return { valid: false, message: 'Maximum verification attempts exceeded. Please request a new OTP.' };
            }

            // Verify OTP
            if (user.otp.code !== otp) {
                // Increment attempts
                user.otp.attempts += 1;
                await user.save();
                return { valid: false, message: `Invalid OTP. ${5 - user.otp.attempts} attempts remaining.` };
            }

            // OTP is valid - mark email as verified
            user.isEmailVerified = true;
            user.emailVerifiedAt = new Date();
            user.otp = undefined; // Clear OTP
            await user.save();

            return { valid: true, message: 'OTP verified successfully', user };
        } catch (err) {
            console.error('Error verifying OTP:', err);
            throw err;
        }
    },

    /**
     * Clear OTP
     * @param {string} email - User email
     * @returns {Promise<object>} - Promise resolving to updated user
     */
    clearOTP: async function(email) {
        try {
            const user = await User.findOneAndUpdate(
                { email },
                {
                    $unset: { otp: 1 }
                },
                { new: true }
            );
            return user;
        } catch (err) {
            console.error('Error clearing OTP:', err);
            throw err;
        }
    },

    /**
     * Save password reset token/OTP
     * @param {string} email - User email
     * @param {string} tokenOrOtp - Reset token or OTP
     * @param {Date} expiresAt - Token expiry timestamp
     * @returns {Promise<object>} - Promise resolving to updated user
     */
    savePasswordResetToken: async function(email, tokenOrOtp, expiresAt) {
        try {
            const user = await User.findOneAndUpdate(
                { email },
                {
                    $set: {
                        'passwordReset.otp': tokenOrOtp,
                        'passwordReset.expiresAt': expiresAt
                    }
                },
                { new: true }
            );
            return user;
        } catch (err) {
            console.error('Error saving password reset token:', err);
            throw err;
        }
    },

    /**
     * Validate password reset token/OTP
     * @param {string} email - User email
     * @param {string} tokenOrOtp - Reset token or OTP to validate
     * @returns {Promise<object>} - { valid: boolean, message: string }
     */
    validatePasswordResetToken: async function(email, tokenOrOtp) {
        try {
            const user = await User.findOne({ email });
            
            if (!user) {
                return { valid: false, message: 'User not found' };
            }

            if (!user.passwordReset || !user.passwordReset.otp) {
                return { valid: false, message: 'No reset request found. Please request a new password reset.' };
            }

            // Check if token has expired
            if (new Date() > user.passwordReset.expiresAt) {
                return { valid: false, message: 'Reset code has expired. Please request a new one.' };
            }

            // Verify token/OTP
            if (user.passwordReset.otp !== tokenOrOtp) {
                return { valid: false, message: 'Invalid reset code.' };
            }

            return { valid: true, message: 'Reset code verified successfully' };
        } catch (err) {
            console.error('Error validating password reset token:', err);
            throw err;
        }
    },

    /**
     * Update user password
     * @param {string} email - User email
     * @param {string} newPassword - New password (plain text)
     * @returns {Promise<object>} - Promise resolving to updated user
     */
    updatePassword: async function(email, newPassword) {
        try {
            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Update password and clear reset token
            const user = await User.findOneAndUpdate(
                { email },
                {
                    $set: { password: hashedPassword },
                    $unset: { passwordReset: 1 }
                },
                { new: true }
            );

            return user;
        } catch (err) {
            console.error('Error updating password:', err);
            throw err;
        }
    }
}; 