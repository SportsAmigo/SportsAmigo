/**
 * Data formatting utility functions
 */

/**
 * Format currency (Indian Rupees)
 */
export const formatCurrency = (amount, showSymbol = true) => {
    if (amount === null || amount === undefined) return showSymbol ? '₹0' : '0';
    
    const formatted = new Intl.NumberFormat('en-IN', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(amount);
    
    return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (number) => {
    if (number === null || number === undefined) return '0';
    
    return new Intl.NumberFormat('en-IN').format(number);
};

/**
 * Format phone number
 */
export const formatPhone = (phone) => {
    if (!phone) return '';
    
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
        return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    return phone;
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength = 50) => {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};

/**
 * Capitalize first letter
 */
export const capitalize = (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Capitalize each word
 */
export const capitalizeWords = (text) => {
    if (!text) return '';
    return text.split(' ').map(word => capitalize(word)).join(' ');
};

/**
 * Format file size
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format percentage
 */
export const formatPercentage = (value, total, decimals = 0) => {
    if (!total || total === 0) return '0%';
    
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(decimals)}%`;
};

/**
 * Parse query string to object
 */
export const parseQueryString = (queryString) => {
    const params = new URLSearchParams(queryString);
    const result = {};
    
    for (const [key, value] of params) {
        result[key] = value;
    }
    
    return result;
};

/**
 * Create query string from object
 */
export const createQueryString = (params) => {
    const searchParams = new URLSearchParams();
    
    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
            searchParams.append(key, params[key]);
        }
    });
    
    return searchParams.toString();
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
    if (!name) return '';
    
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
        return parts[0].charAt(0).toUpperCase();
    }
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Generate random color (for avatars, etc.)
 */
export const generateColor = (seed) => {
    const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
        '#14b8a6', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
        '#d946ef', '#ec4899', '#f43f5e',
    ];
    
    if (seed) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            hash = seed.charCodeAt(i) + ((hash << 5) - hash);
        }
        return colors[Math.abs(hash) % colors.length];
    }
    
    return colors[Math.floor(Math.random() * colors.length)];
};

export default {
    formatCurrency,
    formatNumber,
    formatPhone,
    truncateText,
    capitalize,
    capitalizeWords,
    formatFileSize,
    formatPercentage,
    parseQueryString,
    createQueryString,
    getInitials,
    generateColor,
};

