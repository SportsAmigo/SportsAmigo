/**
 * Enhanced API Service with CSRF Protection
 * 
 * This service provides a centralized way to make API calls with automatic
 * CSRF token handling, error handling, and consistent configuration.
 */

import csrfService from './csrfService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiService {
    /**
     * Makes a GET request
     * @param {string} endpoint - API endpoint (e.g., '/api/users')
     * @param {Object} options - Additional fetch options
     */
    async get(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Makes a POST request with CSRF protection
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @param {Object} options - Additional fetch options
     */
    async post(endpoint, data = {}, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        try {
            const response = await csrfService.makeSecureRequest(url, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: options.headers,
                ...options
            });

            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Makes a PUT request with CSRF protection
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request body data
     * @param {Object} options - Additional fetch options
     */
    async put(endpoint, data = {}, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        try {
            const response = await csrfService.makeSecureRequest(url, {
                method: 'PUT',
                body: JSON.stringify(data),
                headers: options.headers,
                ...options
            });

            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Makes a DELETE request with CSRF protection
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Additional fetch options
     */
    async delete(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        
        try {
            const response = await csrfService.makeSecureRequest(url, {
                method: 'DELETE',
                headers: options.headers,
                ...options
            });

            return this.handleResponse(response);
        } catch (error) {
            return this.handleError(error);
        }
    }

    /**
     * Handles API response
     * @param {Response} response - Fetch response object
     */
    async handleResponse(response) {
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw {
                status: response.status,
                message: data.message || 'Request failed',
                data
            };
        }

        return data;
    }

    /**
     * Handles API errors
     * @param {Error} error - Error object
     */
    handleError(error) {
        console.error('API Error:', error);
        
        // Return a consistent error format
        return {
            success: false,
            error: error.message || 'Network error occurred',
            status: error.status
        };
    }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;

// Convenience exports for direct usage
export const get = (endpoint, options) => apiService.get(endpoint, options);
export const post = (endpoint, data, options) => apiService.post(endpoint, data, options);
export const put = (endpoint, data, options) => apiService.put(endpoint, data, options);
export const del = (endpoint, options) => apiService.delete(endpoint, options);
