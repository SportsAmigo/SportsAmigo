const User = require('../models/user');
const Profile = require('../models/profile');
const PlayerProfile = require('../models/playerProfile');
const { generateOTPWithExpiry } = require('../utils/otpGenerator');
const { sendOTPEmail, sendPasswordResetOTPEmail, sendWelcomeEmail } = require('../utils/emailService');

/**
 * Controller for user-related operations
 */
module.exports = {
    /**
     * Direct authentication function that returns the user object
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<Object|null>} - Authenticated user or null
     */
    authUser: async function(email, password) {
        try {
            // Authenticate user
            const user = await User.authenticate(email, password);
            return user;
        } catch (err) {
            console.error('Error in authUser:', err);
            throw err;
        }
    },
    
    /**
     * Authenticate a user
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    login: async (req, res) => {
        const { email, password } = req.body;
        const role = req.body.role || req.params.role || 'player';
        
        console.log('Login attempt:', { email, role });
        
        try {
            // Authenticate user
            const user = await User.authenticate(email, password);
            
            if (!user) {
                console.log('Login failed: Invalid credentials');
                return res.render('login', { 
                    role,
                    error: 'Invalid email or password',
                    validationErrors: {},
                    email: email || ''
                });
            }

            console.log('User authenticated:', user.email, 'Role:', user.role);
            
            // Check if the user's role matches the requested role
            if (role && user.role !== role) {
                console.log('Login failed: Role mismatch. User role:', user.role, 'Requested role:', role);
                return res.render('login', { 
                    role,
                    error: `You are registered as a ${user.role}, not a ${role}. Please use the correct login page.`,
                    validationErrors: {},
                    email: email || ''
                });
            }
            
            // Set user session
            req.session.user = user;
            console.log('User logged in successfully:', user.email);
            
            // Redirect to appropriate dashboard
            return res.redirect(`/${user.role}`);
        } catch (err) {
            console.error('Error during login:', err);
            return res.render('login', { 
                error: 'An error occurred. Please try again.',
                validationErrors: {},
                email: email || ''
            });
        }
    },
    
    /**
     * Register a new user
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    register: async (req, res) => {
        const { email, password, first_name, last_name, phone, role, preferred_sports, organization_name, team_name } = req.body;
        
        try {
            // Check if user already exists
            const existingUser = await User.getUserByEmail(email);
            
            if (existingUser) {
                return res.render('signup', { 
                    role,
                    error: 'Email already registered',
                    validationErrors: { email: 'Email already in use' },
                    formData: req.body
                });
            }
            
            // Create new user
            const userData = {
                email,
                password,
                role,
                first_name,
                last_name,
                phone
            };
            
            // Add role-specific data
            if (role === 'player' && preferred_sports) {
                userData.preferred_sports = Array.isArray(preferred_sports) ? preferred_sports.join(',') : preferred_sports;
            } else if (role === 'organizer' && organization_name) {
                userData.organization_name = organization_name;
            } else if (role === 'manager' && team_name) {
                userData.team_name = team_name;
            }
            
            console.log('Creating user with data:', JSON.stringify(userData, null, 2));
            const newUser = await User.createUser(userData);
            
            // Create initial profile for the user
            await Profile.createProfile({
                user_id: newUser._id,
                address: '',
                city: '',
                state: '',
                country: ''
            });
            
            // If registering as a player, also create player profile
            if (role === 'player') {
                await PlayerProfile.createProfile({
                    user_id: newUser._id,
                    sport: Array.isArray(preferred_sports) ? preferred_sports[0] : (preferred_sports || 'General'),
                    position: '',
                    skill_level: 'Beginner'
                });
            }
            
            // Send success message
            req.session.flashMessage = { 
                type: 'success', 
                text: 'Registration successful! Please log in.' 
            };
            
            return res.redirect(`/login/${role}`);
        } catch (err) {
            console.error('Error during registration:', err);
            return res.render('signup', { 
                role,
                error: 'An error occurred. Please try again.',
                validationErrors: {},
                formData: req.body
            });
        }
    },
    
    /**
     * Get user profile
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    getProfile: async (req, res) => {
        try {
            const userId = req.session.user._id;
            const user = await User.getUserById(userId);
            
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Get extended profile
            const profile = await Profile.getProfileByUserId(userId);
            
            // Get player profile if user is a player
            let playerProfile = null;
            if (user.role === 'player') {
                playerProfile = await PlayerProfile.getProfileByUserId(userId);
            }
            
            return res.status(200).json({
                user: {
                    id: user._id,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role: user.role,
                    phone: user.phone,
                    profile_image: user.profile_image
                },
                profile: profile || {},
                playerProfile: playerProfile || {}
            });
        } catch (err) {
            console.error('Error fetching user profile:', err);
            return res.status(500).json({ error: 'Error fetching user profile' });
        }
    },
    
    /**
     * Update user profile
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    updateProfile: async (req, res) => {
        try {
            const userId = req.session.user._id;
            const userData = {
                first_name: req.body.first_name,
                last_name: req.body.last_name,
                phone: req.body.phone,
                bio: req.body.bio,
                age: req.body.age,
                address: req.body.address
            };
            
            console.log('Updating profile with data:', userData);
            
            // If profile image was uploaded, add it to userData
            if (req.file) {
                userData.profile_image = `/uploads/profile/${req.file.filename}`;
            }
            
            // Update user basic info
            const updatedUser = await User.updateUser(userId, userData);
            
            // Update profile info
            const profileData = {
                address: req.body.address,
                city: req.body.city,
                state: req.body.state,
                postal_code: req.body.postal_code,
                country: req.body.country,
                date_of_birth: req.body.date_of_birth,
                gender: req.body.gender,
                emergency_contact_name: req.body.emergency_contact_name,
                emergency_contact_relationship: req.body.emergency_contact_relationship,
                emergency_contact_phone: req.body.emergency_contact_phone,
                interests: req.body.interests,
                education: req.body.education,
                occupation: req.body.occupation
            };
            
            await Profile.updateProfile(userId, profileData);
            
            // If player, update player profile
            if (req.session.user.role === 'player') {
                const playerProfileData = {
                    sport: req.body.sport,
                    position: req.body.position,
                    skill_level: req.body.skill_level,
                    years_experience: req.body.years_experience,
                    achievements: req.body.achievements,
                    preferred_team_types: req.body.preferred_team_types,
                    availability: req.body.availability
                };
                
                await PlayerProfile.updateProfile(userId, playerProfileData);
            }
            
            // Fetch the complete updated user data from the database
            const freshUserData = await User.getUserById(userId);
            
            if (!freshUserData) {
                throw new Error('Failed to retrieve updated user data');
            }
            
            // Create complete user object for session
            const sessionUser = freshUserData.toObject ? freshUserData.toObject() : freshUserData;
            
            // Add UI-friendly name format 
            sessionUser.name = sessionUser.first_name + (sessionUser.last_name ? ' ' + sessionUser.last_name : '');
            
            // Ensure photo URL is properly set
            if (sessionUser.profile_image) {
                sessionUser.photoUrl = sessionUser.profile_image;
            }
            
            console.log('Updating session with fresh user data:', {
                name: sessionUser.name,
                email: sessionUser.email, 
                profile_image: sessionUser.profile_image,
                photoUrl: sessionUser.photoUrl,
                age: sessionUser.age,
                address: sessionUser.address,
                bio: sessionUser.bio
            });
            
            // Update session with complete fresh user data
            req.session.user = sessionUser;
            
            // Save session to ensure persistence
            req.session.save(err => {
                if (err) {
                    console.error('Error saving session after profile update:', err);
                }
                
                // Set success message
                req.session.flashMessage = {
                    type: 'success',
                    text: 'Profile updated successfully!'
                };
                
                // Redirect based on user role
                return res.redirect(`/${req.session.user.role}/profile`);
            });
        } catch (err) {
            console.error('Error updating profile:', err);
            req.session.flashMessage = {
                type: 'error',
                text: 'Error updating profile. Please try again.'
            };
            return res.redirect(`/${req.session.user.role}/profile`);
        }
    },
    
    /**
     * Logout user
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @param {Function} next - Next middleware function
     */
    logout: (req, res) => {
        req.session.destroy(err => {
            if (err) {
                console.error('Error destroying session:', err);
            }
            res.redirect('/login');
        });
    },

    /**
     * Send OTP for email verification (signup)
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    sendOTP: async (req, res) => {
        const { email, first_name, last_name } = req.body;

        try {
            // Check if user already exists
            const existingUser = await User.getUserByEmail(email);
            
            if (existingUser) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email already registered. Please login instead.' 
                });
            }

            // Generate OTP with 10-minute expiry
            const { otp, expiresAt } = generateOTPWithExpiry(10);

            // Create a temporary user record to store OTP (without password yet)
            // OR save OTP to a separate collection/field
            // For now, we'll create a user with a temporary password that will be updated later
            const tempPassword = Math.random().toString(36).slice(-8);
            const userData = {
                email,
                password: tempPassword,
                role: req.body.role || 'player',
                first_name: first_name || 'User',
                last_name: last_name || '',
                isEmailVerified: false
            };

            // Check if temp user already exists (from previous OTP request)
            let user = await User.getUserByEmail(email);
            if (!user) {
                user = await User.createUser(userData);
            }

            // Save OTP
            await User.saveOTP(email, otp, expiresAt);

            // Send OTP email
            const userName = `${first_name || 'User'} ${last_name || ''}`.trim();
            await sendOTPEmail(email, otp, userName);

            console.log(`OTP sent to ${email}: ${otp}`); // Remove in production

            return res.status(200).json({ 
                success: true, 
                message: 'OTP sent successfully to your email. Please check your inbox.',
                expiresIn: '10 minutes'
            });

        } catch (err) {
            console.error('Error sending OTP:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to send OTP. Please try again.' 
            });
        }
    },

    /**
     * Verify OTP and complete signup
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    verifyOTP: async (req, res) => {
        const { email, otp, password, first_name, last_name, phone, role, preferred_sports, organization_name, team_name } = req.body;

        try {
            // Verify OTP
            const verification = await User.verifyOTP(email, otp);

            if (!verification.valid) {
                return res.status(400).json({ 
                    success: false, 
                    message: verification.message 
                });
            }

            // Update user with actual password and details
            const user = verification.user;
            
            // Hash and update password
            await User.updatePassword(email, password);

            // Update other user details
            const updateData = {
                first_name,
                last_name,
                phone: phone || '',
                role: role || 'player'
            };

            // Add role-specific profile data
            if (preferred_sports) updateData.preferred_sports = preferred_sports;
            if (organization_name) updateData.organization_name = organization_name;
            if (team_name) updateData.team_name = team_name;
            
            // Set verification status for organizers
            if (role === 'organizer') {
                updateData.verificationStatus = 'pending';
            }

            await User.updateUser(user._id, updateData);

            // Send welcome email
            const userName = `${first_name} ${last_name}`.trim();
            await sendWelcomeEmail(email, userName, role);

            // Auto login after successful verification
            const verifiedUser = await User.getUserByEmail(email);
            req.session.user = verifiedUser;

            console.log(`User registered and verified successfully: ${email}`);

            return res.status(200).json({ 
                success: true, 
                message: 'mail verified successfully! Your account has been created.',
                user: {
                    email: verifiedUser.email,
                    role: verifiedUser.role,
                    name: `${verifiedUser.first_name} ${verifiedUser.last_name}`
                },
                redirectUrl: `/${verifiedUser.role}`
            });

        } catch (err) {
            console.error('Error verifying OTP:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to verify OTP. Please try again.' 
            });
        }
    },

    /**
     * Initiate forgot password - send reset OTP
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    forgotPassword: async (req, res) => {
        const { email } = req.body;

        try {
            // Check if user exists
            const user = await User.getUserByEmail(email);
            
            if (!user) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'No account found with this mail address.' 
                });
            }

            // Generate reset OTP with 10-minute expiry
            const { otp, expiresAt } = generateOTPWithExpiry(10);

            // Save reset OTP
            await User.savePasswordResetToken(email, otp, expiresAt);

            // Send reset OTP email
            const userName = `${user.first_name} ${user.last_name}`.trim();
            await sendPasswordResetOTPEmail(email, otp, userName);

            console.log(`Password reset OTP sent to ${email}: ${otp}`); // Remove in production

            return res.status(200).json({ 
                success: true, 
                message: 'Password reset code sent to your mail. Please check your inbox.',
                expiresIn: '10 minutes'
            });

        } catch (err) {
            console.error('Error in forgot password:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to send reset code. Please try again.' 
            });
        }
    },

    /**
     * Verify reset OTP
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    verifyResetOTP: async (req, res) => {
        const { email, otp } = req.body;

        try {
            // Validate reset OTP
            const validation = await User.validatePasswordResetToken(email, otp);

            if (!validation.valid) {
                return res.status(400).json({ 
                    success: false, 
                    message: validation.message 
                });
            }

            return res.status(200).json({ 
                success: true, 
                message: 'Reset code verified successfully. You can now set a new password.',
                resetToken: otp // Send back for password reset verification
            });

        } catch (err) {
            console.error('Error verifying reset OTP:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to verify reset code. Please try again.' 
            });
        }
    },

    /**
     * Reset password with verified OTP
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    resetPassword: async (req, res) => {
        const { email, otp, newPassword } = req.body;

        try {
            // Validate reset OTP again before password update
            const validation = await User.validatePasswordResetToken(email, otp);

            if (!validation.valid) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Invalid or expired reset code. Please request a new one.' 
                });
            }

            // Update password
            await User.updatePassword(email, newPassword);

            console.log(`Password reset successfully for ${email}`);

            return res.status(200).json({ 
                success: true, 
                message: 'Password reset successfully! You can now login with your new password.' 
            });

        } catch (err) {
            console.error('Error resetting password:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to reset password. Please try again.' 
            });
        }
    },

    /**
     * Send OTP for login verification
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    sendLoginOTP: async (req, res) => {
        const { email, password, role } = req.body;

        try {
            // Authenticate user first
            const user = await User.authenticate(email, password);
            
            if (!user) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Invalid email or password' 
                });
            }

            // Check role if provided
            if (role && user.role !== role) {
                return res.status(403).json({ 
                    success: false, 
                    message: `You are registered as a ${user.role}, not a ${role}` 
                });
            }

            // Check if email is verified (only for new users with OTP field)
            if (user.isEmailVerified === false && user.otp) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Please verify your email before logging in' 
                });
            }

            // Generate login OTP with 10-minute expiry
            const { otp, expiresAt } = generateOTPWithExpiry(10);

            // Save login OTP (reusing the same OTP field)
            await User.saveOTP(email, otp, expiresAt);

            // Send OTP email
            const userName = `${user.first_name} ${user.last_name}`.trim();
            await sendOTPEmail(email, otp, userName);

            console.log(`Login OTP sent to ${email}: ${otp}`); // Remove in production

            return res.status(200).json({ 
                success: true, 
                message: 'OTP sent to your email. Please check your inbox.',
                expiresIn: '10 minutes'
            });

        } catch (err) {
            console.error('Error sending login OTP:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to send OTP. Please try again.' 
            });
        }
    },

    /**
     * Verify login OTP and complete login
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     */
    verifyLoginOTP: async (req, res) => {
        const { email, otp, role } = req.body;

        try {
            // Verify OTP
            const verification = await User.verifyOTP(email, otp);

            if (!verification.valid) {
                return res.status(400).json({ 
                    success: false, 
                    message: verification.message 
                });
            }

            const user = verification.user;

            // Check role match again
            if (role && user.role !== role) {
                return res.status(403).json({ 
                    success: false, 
                    message: `You are registered as a ${user.role}, not a ${role}` 
                });
            }

            // Get fresh user data
            const freshUserData = await User.getUserById(user._id);
            
            if (!freshUserData) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Failed to retrieve user data' 
                });
            }

            // Create session
            const sessionUser = freshUserData.toObject ? freshUserData.toObject() : freshUserData;
            sessionUser.name = sessionUser.first_name + (sessionUser.last_name ? ' ' + sessionUser.last_name : '');
            
            req.session.user = sessionUser;

            req.session.save(err => {
                if (err) {
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Session error' 
                    });
                }

                return res.json({ 
                    success: true, 
                    message: 'Login successful!', 
                    user: { 
                        id: sessionUser._id, 
                        name: sessionUser.name, 
                        email: sessionUser.email, 
                        role: sessionUser.role, 
                        first_name: sessionUser.first_name, 
                        last_name: sessionUser.last_name, 
                        phone: sessionUser.phone,
                        age: sessionUser.profile?.age || '',
                        address: sessionUser.profile?.address || '',
                        bio: sessionUser.bio || '',
                        organization: sessionUser.profile?.organization_name || '',
                        profile_image: sessionUser.profile_image 
                    } 
                });
            });

        } catch (err) {
            console.error('Error verifying login OTP:', err);
            return res.status(500).json({ 
                success: false, 
                message: 'Failed to verify OTP. Please try again.' 
            });
        }
    }
}; 