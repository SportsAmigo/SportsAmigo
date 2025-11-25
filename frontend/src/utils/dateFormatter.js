/**
 * Date formatting utility functions
 */

/**
 * Format date in different formats
 */
export const formatDate = (date, format = 'default') => {
    if (!date) return '';
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    
    const formats = {
        default: d.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        }),
        short: d.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        }),
        time: d.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        }),
        datetime: d.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit', 
            minute: '2-digit' 
        }),
        full: d.toLocaleString('en-US', { 
            dateStyle: 'full', 
            timeStyle: 'short' 
        }),
        iso: d.toISOString().split('T')[0], // YYYY-MM-DD
    };
    
    return formats[format] || formats.default;
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const past = new Date(date);
    const diff = now - past;
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
    if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
};

/**
 * Check if date is upcoming (future)
 */
export const isUpcoming = (date) => {
    if (!date) return false;
    return new Date(date) > new Date();
};

/**
 * Check if date is past
 */
export const isPast = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
};

/**
 * Check if date is today
 */
export const isToday = (date) => {
    if (!date) return false;
    
    const d = new Date(date);
    const today = new Date();
    
    return d.getDate() === today.getDate() &&
           d.getMonth() === today.getMonth() &&
           d.getFullYear() === today.getFullYear();
};

/**
 * Get days until date
 */
export const getDaysUntil = (date) => {
    if (!date) return null;
    
    const target = new Date(date);
    const now = new Date();
    const diff = target - now;
    
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Format time remaining (e.g., "2 days, 3 hours remaining")
 */
export const getTimeRemaining = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const target = new Date(date);
    const diff = target - now;
    
    if (diff < 0) return 'Event has passed';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}, ${hours} hour${hours !== 1 ? 's' : ''} remaining`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''}, ${minutes} minute${minutes !== 1 ? 's' : ''} remaining`;
    return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
};

export default {
    formatDate,
    getRelativeTime,
    isUpcoming,
    isPast,
    isToday,
    getDaysUntil,
    getTimeRemaining,
};

