/**
 * CSRF Token Service
 * 
 * This service handles CSRF (Cross-Site Request Forgery) token management
 * for secure API requests to the backend.
 * 
 * Usage:
 * 1. Call getCsrfToken() before making POST/PUT/DELETE requests
 * 2. Include the token in your request headers using addCsrfHeader()
 * 3. Or use the makeSecureRequest() wrapper for automatic handling
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class CsrfService {
    constructor() {
        this.csrfToken = null;
        this.tokenExpiry = null;
    }

    /**
     * Fetches a new CSRF token from the backend
     * @returns {Promise<string>} The CSRF token
     */
    async fetchToken() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/csrf-token`, {
                method: 'GET',
                credentials: 'include', // Important: Include session cookies
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch CSRF token');
            }

            const data = await response.json();
            this.csrfToken = data.csrfToken;
            this.tokenExpiry = Date.now() + (30 * 60 * 1000); // Token valid for 30 minutes
            
            return this.csrfToken;
        } catch (error) {
            console.error('Error fetching CSRF token:', error);
            throw error;
        }
    }

    /**
     * Gets the current CSRF token, fetching a new one if needed
     * @returns {Promise<string>} The CSRF token
     */
    async getCsrfToken() {
        // Check if token exists and is not expired
        if (this.csrfToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.csrfToken;
        }

        // Fetch new token if expired or doesn't exist
        return await this.fetchToken();
    }

    /**
     * Adds CSRF token to request headers
     * @param {Object} headers - Existing headers object
     * @returns {Promise<Object>} Headers with CSRF token added
     */
    async addCsrfHeader(headers = {}) {
        try {
            const token = await this.getCsrfToken();
            return {
                ...headers,
                'X-CSRF-Token': token,
                'CSRF-Token': token // Some backends use this header name
            };
        } catch (error) {
            console.warn('Failed to get CSRF token, continuing without it:', error.message);
            // Return headers without CSRF token - some endpoints may not require it
            return headers;
        }
    }

    /**
     * Makes a secure API request with automatic CSRF token handling
     * @param {string} url - The API endpoint (relative or absolute)
     * @param {Object} options - Fetch options (method, body, headers, etc.)
     * @returns {Promise<Response>} The fetch response
     */
    async makeSecureRequest(url, options = {}) {
        try {
            // Only add CSRF token for state-changing methods
            const method = (options.method || 'GET').toUpperCase();
            const requiresCsrf = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

            // Prepare headers
            let headers = options.headers || {};
            
            // Add CSRF token if needed
            if (requiresCsrf) {
                headers = await this.addCsrfHeader(headers);
            }

            // Make the request
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                credentials: 'include' // Always include credentials for session
            });

            // If CSRF token is invalid (403), fetch new token and retry once
            if (response.status === 403 && requiresCsrf) {
                console.warn('CSRF token invalid, fetching new token and retrying...');
                
                // Fetch fresh token
                await this.fetchToken();
                
                // Retry with new token
                headers = await this.addCsrfHeader(options.headers || {});
                return await fetch(url, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...headers
                    },
                    credentials: 'include'
                });
            }

            return response;
        } catch (error) {
            console.error('Secure request failed:', error);
            throw error;
        }
    }

    /**
     * Clears the stored CSRF token (useful on logout)
     */
    clearToken() {
        this.csrfToken = null;
        this.tokenExpiry = null;
    }
}

// Create singleton instance
const csrfService = new CsrfService();

export default csrfService;

// Convenience exports
export const getCsrfToken = () => csrfService.getCsrfToken();
export const makeSecureRequest = (url, options) => csrfService.makeSecureRequest(url, options);
export const clearCsrfToken = () => csrfService.clearToken();
