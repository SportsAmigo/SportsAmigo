const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const User = require('../models/user');

router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }
        const user = await userController.authUser(email, password);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
        if (role && user.role !== role) {
            return res.status(403).json({ success: false, message: `You are registered as a ${user.role}, not a ${role}` });
        }
        const freshUserData = await User.getUserById(user._id);
        if (!freshUserData) {
            return res.status(500).json({ success: false, message: 'Failed to retrieve user data' });
        }
        const sessionUser = freshUserData.toObject ? freshUserData.toObject() : freshUserData;
        sessionUser.name = sessionUser.first_name + (sessionUser.last_name ? ' ' + sessionUser.last_name : '');
        req.session.user = sessionUser;
        req.session.save(err => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Session error' });
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
        console.error('Login error:', err);
        return res.status(500).json({ success: false, message: 'An error occurred' });
    }
});

router.post('/signup', async (req, res) => {
    try {
        const { email, password, first_name, last_name, phone, role } = req.body;
        if (!email || !password || !first_name || !role) {
            return res.status(400).json({ success: false, message: 'Email, password, first name, and role are required' });
        }
        const existingUser = await User.getUserByEmail(email);
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'User with this email already exists' });
        }
        const newUser = await User.createUser({ email, password, first_name, last_name, phone, role });
        if (!newUser) {
            return res.status(500).json({ success: false, message: 'Failed to create user' });
        }
        const sessionUser = newUser.toObject ? newUser.toObject() : newUser;
        sessionUser.name = sessionUser.first_name + (sessionUser.last_name ? ' ' + sessionUser.last_name : '');
        req.session.user = sessionUser;
        req.session.save(err => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Registration successful but session error' });
            }
            return res.status(201).json({ success: true, message: 'Registration successful!', user: { id: sessionUser._id, name: sessionUser.name, email: sessionUser.email, role: sessionUser.role, first_name: sessionUser.first_name, last_name: sessionUser.last_name, phone: sessionUser.phone, profile_image: sessionUser.profile_image } });
        });
    } catch (err) {
        console.error('Signup error:', err);
        return res.status(500).json({ success: false, message: 'An error occurred during registration' });
    }
});

router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Error logging out' });
        }
        res.clearCookie('connect.sid');
        return res.json({ success: true, message: 'Logout successful' });
    });
});

router.get('/check-session', (req, res) => {
    if (req.session && req.session.user) {
        return res.json({ 
            authenticated: true, 
            user: { 
                id: req.session.user._id, 
                name: req.session.user.name, 
                email: req.session.user.email, 
                role: req.session.user.role, 
                first_name: req.session.user.first_name, 
                last_name: req.session.user.last_name, 
                phone: req.session.user.phone,
                age: req.session.user.profile?.age || '',
                address: req.session.user.profile?.address || '',
                bio: req.session.user.bio || '',
                organization: req.session.user.profile?.organization_name || '',
                profile_image: req.session.user.profile_image 
            } 
        });
    } else {
        return res.json({ authenticated: false });
    }
});

router.get('/user', async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    try {
        const user = await User.getUserById(req.session.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.json({ 
            success: true, 
            user: { 
                id: user._id, 
                name: user.first_name + (user.last_name ? ' ' + user.last_name : ''), 
                email: user.email, 
                role: user.role, 
                first_name: user.first_name, 
                last_name: user.last_name, 
                phone: user.phone,
                age: user.profile?.age || '',
                address: user.profile?.address || '',
                bio: user.bio || '',
                organization: user.profile?.organization_name || '',
                profile_image: user.profile_image 
            } 
        });
    } catch (err) {
        console.error('Get user error:', err);
        return res.status(500).json({ success: false, message: 'Error retrieving user data' });
    }
});

module.exports = router;
