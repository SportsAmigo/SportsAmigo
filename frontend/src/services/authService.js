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
};

export default authService;
