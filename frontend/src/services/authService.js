import api from './api';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

export const authService = {
    /**
     * Login user
     * @param {string} email 
     * @param {string} password 
     * @param {string} role - player, manager, organizer, admin
     * @returns {Promise}
     */
    login: async (email, password, role) => {
        try {
            const response = await api.post('/auth/login', { email, password, role });
            return response.data;
        } catch (error) {
            throw error.response?.data || { success: false, message: 'Login failed' };
        }
    },

    /**
     * Register new user
     * @param {Object} userData 
     * @returns {Promise}
     */
    signup: async (userData) => {
        try {
            const response = await api.post('/auth/signup', userData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { success: false, message: 'Signup failed' };
        }
    },

    /**
     * Logout user
     * @returns {Promise}
     */
    logout: async () => {
        try {
            const response = await api.post('/auth/logout');
            return response.data;
        } catch (error) {
            throw error.response?.data || { success: false, message: 'Logout failed' };
        }
    },

    /**
     * Check if user is authenticated
     * @returns {Promise}
     */
    checkSession: async () => {
        try {
            const response = await api.get('/auth/check-session');
            return response.data;
        } catch (error) {
            throw error.response?.data || { success: false, message: 'Session check failed' };
        }
    },

    /**
     * Get current user data
     * @returns {Promise}
     */
    getCurrentUser: async () => {
        try {
            const response = await api.get('/auth/user');
            return response.data;
        } catch (error) {
            throw error.response?.data || { success: false, message: 'Failed to get user data' };
        }
    },

    /**
     * Send OTP for email verification during signup
     * @param {Object} data - { email, first_name, last_name, role }
     * @returns {Promise}
     */
    sendOTP: async (data) => {
        try {
            const response = await api.post('/auth/send-otp', data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { success: false, message: 'Failed to send OTP' };
        }
    },

    /**
     * Verify OTP and complete signup
     * @param {Object} data - { email, otp, password, first_name, last_name, phone, role, ... }
     * @returns {Promise}
     */
    verifyOTP: async (data) => {
        try {
            const response = await api.post('/auth/verify-otp', data);
            return response.data;
        } catch (error) {
            throw error.response?.data || { success: false, message: 'Failed to verify OTP' };
        }
    },

    /**
     * Request password reset OTP
     * @param {string} email 
     * @returns {Promise}
     */
    forgotPassword: async (email) => {
        try {
            const response = await api.post('/auth/forgot-password', { email });
            return response.data;
        } catch (error) {
            throw error.response?.data || { success: false, message: 'Failed to send reset code' };
        }
    },

    /**
     * Verify password reset OTP
     * @param {string} email 
     * @param {string} otp 
     * @returns {Promise}
     */
    verifyResetOTP: async (email, otp) => {
        try {
            const response = await api.post('/auth/verify-reset-otp', { email, otp });
            return response.data;
        } catch (error) {
            throw error.response?.data || { success: false, message: 'Failed to verify reset code' };
        }
    },

    /**
     * Reset password with verified OTP
     * @param {string} email 
     * @param {string} otp 
     * @param {string} newPassword 
     * @returns {Promise}
     */
    resetPassword: async (email, otp, newPassword) => {
        try {
            const response = await api.post('/auth/reset-password', { email, otp, newPassword });
            return response.data;
        } catch (error) {
            throw error.response?.data || { success: false, message: 'Failed to reset password' };
        }
    },

    /**
     * Send OTP for login verification
     * @param {string} email 
     * @param {string} password 
     * @param {string} role 
     * @returns {Promise}
     */
    sendLoginOTP: async (email, password, role) => {
        try {
            const response = await api.post('/auth/send-login-otp', { email, password, role });
            return response.data;
        } catch (error) {
            throw error.response?.data || { success: false, message: 'Failed to send login OTP' };
        }
    },

    /**
     * Verify login OTP and complete login
     * @param {string} email 
     * @param {string} otp 
     * @param {string} role 
     * @returns {Promise}
     */
    verifyLoginOTP: async (email, otp, role) => {
        try {
            const response = await api.post('/auth/verify-login-otp', { email, otp, role });
            return response.data;
        } catch (error) {
            throw error.response?.data || { success: false, message: 'Failed to verify login OTP' };
        }
    },
};

export default authService;
