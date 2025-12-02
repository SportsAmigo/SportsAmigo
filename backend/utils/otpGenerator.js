const crypto = require('crypto');

/**
 * Generate a random 6-digit OTP
 * @returns {string} - 6-digit OTP code
 */
const generateOTP = () => {
  // Generate random 6-digit number
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
};

/**
 * Generate OTP with expiry timestamp
 * @param {number} expiryMinutes - Minutes until OTP expires (default: 10)
 * @returns {Object} - { otp, expiresAt }
 */
const generateOTPWithExpiry = (expiryMinutes = 10) => {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);
  
  return {
    otp,
    expiresAt
  };
};

/**
 * Verify if OTP has expired
 * @param {Date} expiresAt - OTP expiry timestamp
 * @returns {boolean} - true if expired, false otherwise
 */
const isOTPExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

/**
 * Generate secure random token for password reset
 * @param {number} length - Length of token (default: 32)
 * @returns {string} - Random hex token
 */
const generateResetToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

module.exports = {
  generateOTP,
  generateOTPWithExpiry,
  isOTPExpired,
  generateResetToken
};
