/**
 * Razorpay Configuration
 * 
 * Initializes the Razorpay SDK and provides helper functions
 * for order creation and payment signature verification.
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;
const isRazorpayConfigured = Boolean(keyId && keySecret);

if (!isRazorpayConfigured) {
  console.warn('[Razorpay] Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET. Payment endpoints will fail until configured.');
}

// Initialize Razorpay instance only when credentials are available.
const razorpay = isRazorpayConfigured
  ? new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  })
  : {
    orders: {
      create: async () => {
        throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.');
      }
    }
  };

/**
 * Verify Razorpay payment signature using HMAC-SHA256.
 * 
 * @param {string} orderId - razorpay_order_id returned by checkout
 * @param {string} paymentId - razorpay_payment_id returned by checkout
 * @param {string} signature - razorpay_signature returned by checkout
 * @returns {boolean} true if signature is valid
 */
function verifyPaymentSignature(orderId, paymentId, signature) {
  if (!keySecret) {
    return false;
  }

  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex');
  return expectedSignature === signature;
}

module.exports = {
  razorpay,
  verifyPaymentSignature,
  isRazorpayConfigured
};
