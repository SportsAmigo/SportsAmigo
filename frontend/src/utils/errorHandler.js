/**
 * Error handling utility functions
 */

/**
 * Parse API error response
 */
export const parseError = (error) => {
    // Axios error
    if (error.response) {
        return {
            message: error.response.data?.message || 'An error occurred',
            status: error.response.status,
            errors: error.response.data?.errors || {},
        };
    }
    
    // Network error
    if (error.request) {
        return {
            message: 'Network error. Please check your connection.',
            status: 0,
            errors: {},
        };
    }
    
    // Other errors
    return {
        message: error.message || 'An unexpected error occurred',
        status: 0,
        errors: {},
    };
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error) => {
    const parsed = parseError(error);
    return parsed.message;
};

/**
 * Check if error is authentication error
 */
export const isAuthError = (error) => {
    const parsed = parseError(error);
    return parsed.status === 401 || parsed.status === 403;
};

/**
 * Check if error is network error
 */
export const isNetworkError = (error) => {
    return error.request && !error.response;
};

/**
 * Log error to console (development) or error tracking service (production)
 */
export const logError = (error, context = {}) => {
    const errorInfo = {
        error: parseError(error),
        context,
        timestamp: new Date().toISOString(),
    };
    
    if (process.env.NODE_ENV === 'development') {
        console.error('Error logged:', errorInfo);
    } else {
        // In production, send to error tracking service (Sentry, etc.)
        // Example: Sentry.captureException(error, { contexts: { custom: context } });
    }
};

/**
 * Create error object for form validation
 */
export const createFieldErrors = (apiErrors) => {
    if (!apiErrors || typeof apiErrors !== 'object') return {};
    
    const fieldErrors = {};
    Object.keys(apiErrors).forEach(key => {
        fieldErrors[key] = Array.isArray(apiErrors[key]) 
            ? apiErrors[key].join(', ') 
            : apiErrors[key];
    });
    
    return fieldErrors;
};

export default {
    parseError,
    getErrorMessage,
    isAuthError,
    isNetworkError,
    logError,
    createFieldErrors,
};

