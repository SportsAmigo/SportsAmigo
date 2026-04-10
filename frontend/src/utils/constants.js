/**
 * Application constants
 */

// API Base URL
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// User Roles
export const ROLES = {
    PLAYER: 'player',
    MANAGER: 'manager',
    ORGANIZER: 'organizer',
    ADMIN: 'admin',
};

// Event Status
export const EVENT_STATUS = {
    UPCOMING: 'upcoming',
    ONGOING: 'ongoing',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

// Sports List
export const SPORTS = [
    'Football',
    'Cricket',
    'Basketball',
    'Tennis',
    'Badminton',
    'Volleyball',
    'Table Tennis',
    'Hockey',
    'Swimming',
    'Athletics',
    'Kabaddi',
    'Chess',
    'Carrom',
];

// File Upload Limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

// Pagination
export const ITEMS_PER_PAGE = 10;
export const DEFAULT_PAGE = 1;

// Toast Duration
export const TOAST_DURATION = {
    SHORT: 2000,
    MEDIUM: 3000,
    LONG: 5000,
};

// Toast Types
export const TOAST_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
};

// Wallet Limits
export const WALLET = {
    MIN_ADD_AMOUNT: 100,
    MAX_ADD_AMOUNT: 50000,
    MIN_WITHDRAW_AMOUNT: 100,
};

// Team Size Limits
export const TEAM = {
    MIN_PLAYERS: 1,
    MAX_PLAYERS: 20,
    DEFAULT_SIZE: 11,
};

// Event Registration Limits
export const EVENT = {
    MIN_TEAMS: 2,
    MAX_TEAMS: 32,
    MIN_ENTRY_FEE: 0,
    MAX_ENTRY_FEE: 100000,
};

// Date Formats
export const DATE_FORMATS = {
    DISPLAY: 'MMM DD, YYYY',
    INPUT: 'YYYY-MM-DD',
    FULL: 'MMMM DD, YYYY hh:mm A',
};

// Local Storage Keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    USER_DATA: 'user_data',
    THEME: 'theme',
    LANGUAGE: 'language',
};

// API Endpoints (relative to BASE_URL)
export const ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    CHECK_SESSION: '/auth/check-session',
    
    // Player
    PLAYER_DASHBOARD: '/player/dashboard',
    PLAYER_EVENTS: '/player/events',
    PLAYER_WALLET: '/player/wallet',
    
    // Manager
    MANAGER_DASHBOARD: '/manager/dashboard',
    MANAGER_TEAMS: '/manager/teams',
    CREATE_TEAM: '/manager/create-team',
    
    // Organizer
    ORGANIZER_DASHBOARD: '/organizer/dashboard',
    ORGANIZER_EVENTS: '/organizer/events',
    CREATE_EVENT: '/organizer/create-event',
    
    // Admin
    ADMIN_DASHBOARD: '/admin/dashboard',
};

// Colors (for charts, badges, etc.)
export const COLORS = {
    PRIMARY: '#ea580c', // orange-600
    SECONDARY: '#dc2626', // red-600
    SUCCESS: '#16a34a', // green-600
    DANGER: '#dc2626', // red-600
    WARNING: '#f59e0b', // amber-500
    INFO: '#3b82f6', // blue-500
};

// Chart Colors
export const CHART_COLORS = [
    '#ea580c', // orange
    '#dc2626', // red
    '#16a34a', // green
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
];

export default {
    API_BASE_URL,
    ROLES,
    EVENT_STATUS,
    SPORTS,
    MAX_FILE_SIZE,
    ALLOWED_IMAGE_TYPES,
    ITEMS_PER_PAGE,
    DEFAULT_PAGE,
    TOAST_DURATION,
    TOAST_TYPES,
    WALLET,
    TEAM,
    EVENT,
    DATE_FORMATS,
    STORAGE_KEYS,
    ENDPOINTS,
    COLORS,
    CHART_COLORS,
};

