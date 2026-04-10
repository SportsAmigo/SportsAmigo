/**
 * Validation utility functions
 */

/**
 * Validate email format
 */
export const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

/**
 * Validate phone number (Indian format)
 */
export const validatePhone = (phone) => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(phone);
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
    const errors = [];
    if (password.length < 6) errors.push('Minimum 6 characters required');
    if (!/[A-Z]/.test(password)) errors.push('One uppercase letter required');
    if (!/[a-z]/.test(password)) errors.push('One lowercase letter required');
    if (!/[0-9]/.test(password)) errors.push('One number required');
    return errors.length === 0 ? null : errors.join(', ');
};

/**
 * Validate age (18-100)
 */
export const validateAge = (age) => {
    const numAge = parseInt(age);
    return numAge >= 18 && numAge <= 100;
};

/**
 * Validate required field
 */
export const validateRequired = (value, fieldName = 'This field') => {
    return value && value.toString().trim() ? null : `${fieldName} is required`;
};

/**
 * Validate minimum length
 */
export const validateMinLength = (value, minLength, fieldName = 'This field') => {
    return value && value.length >= minLength 
        ? null 
        : `${fieldName} must be at least ${minLength} characters`;
};

/**
 * Validate maximum length
 */
export const validateMaxLength = (value, maxLength, fieldName = 'This field') => {
    return value && value.length <= maxLength 
        ? null 
        : `${fieldName} must be at most ${maxLength} characters`;
};

/**
 * Validate number range
 */
export const validateRange = (value, min, max, fieldName = 'This field') => {
    const num = Number(value);
    if (isNaN(num)) return `${fieldName} must be a number`;
    if (num < min || num > max) return `${fieldName} must be between ${min} and ${max}`;
    return null;
};

/**
 * Validate date (must be in future)
 */
export const validateFutureDate = (date, fieldName = 'Date') => {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return selectedDate >= today 
        ? null 
        : `${fieldName} must be today or in the future`;
};

/**
 * Validate URL format
 */
export const validateURL = (url) => {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
};

export default {
    validateEmail,
    validatePhone,
    validatePassword,
    validateAge,
    validateRequired,
    validateMinLength,
    validateMaxLength,
    validateRange,
    validateFutureDate,
    validateURL,
};

