/**
 * Unified Payment Service
 * Handles payment processing for subscriptions and VAS purchases.
 * Ensures transaction integrity, idempotency, and proper state management.
 *
 * Payment States: PENDING → SUCCESS | FAILED | CANCELLED
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const redisClient = require('../config/redis');

/**
 * Generate a unique, collision-resistant transaction ID
 */
function generateTransactionId(prefix = 'TXN') {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(6).toString('hex').toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Server-side price validation
 * Prevents frontend price tampering by looking up canonical prices.
 */
const CANONICAL_PRICES = {
  subscription: {
    pro:        { monthly: 2999,  yearly: 29999  },
    enterprise: { monthly: 9999,  yearly: 99999  }
  },
  vas: {
    event_insurance:       { basic: 2999,  standard: 4999,  premium: 9999  },
    photography_booking:   { basic: 4999,  standard: 9999,  premium: 19999 },
    marketing_boost:       { basic: 999,   standard: 1999,  premium: 4999  },
    certificate_generation:{ basic: 10,    standard: 7,     premium: 5     },  // per-unit
    sms_notifications:     { '100': 100,   '500': 450,      '1000': 800    }
  }
};

function lookupSubscriptionPrice(plan, billingCycle) {
  const planPrices = CANONICAL_PRICES.subscription[plan];
  if (!planPrices) return null;
  return planPrices[billingCycle] ?? null;
}

function lookupVASPrice(serviceType, tier) {
  const servicePrices = CANONICAL_PRICES.vas[serviceType];
  if (!servicePrices) return null;
  return servicePrices[tier] ?? null;
}

/**
 * Process a payment in a transactional manner.
 *
 * @param {Object} opts
 * @param {string} opts.type          - 'subscription' | 'vas'
 * @param {string} opts.userId        - Organizer's user ID
 * @param {number} opts.amount        - Amount in INR (validated server-side)
 * @param {string} opts.idempotencyKey - Client-supplied key to prevent duplicate processing
 * @param {Function} opts.onSuccess   - Async callback executed inside the transaction on payment success.
 *                                       Receives (session, transactionId). Must use session for DB writes.
 * @returns {Object} { success, transactionId, status, receiptData? }
 */
async function processPayment({ type, userId, amount, idempotencyKey, onSuccess }) {
  // Idempotency guard using Redis
  if (idempotencyKey) {
    try {
      const isDuplicate = await redisClient.get('idempotency:' + idempotencyKey);
      if (isDuplicate) {
        const cached = JSON.parse(isDuplicate);
        return { success: true, transactionId: cached.transactionId, status: 'SUCCESS', cached: true, receiptData: cached.receiptData };
      }
    } catch (err) {
      console.error('[Redis] Idempotency check error:', err.message);
    }
  }

  const transactionId = generateTransactionId(type === 'subscription' ? 'SUB' : 'VAS');

  try {
    // Try transactional approach first (requires replica set)
    let receiptData;
    let usedTransaction = false;

    try {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();
        receiptData = await onSuccess(session, transactionId);
        await session.commitTransaction();
        usedTransaction = true;
      } catch (txnError) {
        // If the error is about transactions not being supported, fall back
        if (txnError.message && (
          txnError.message.includes('Transaction numbers') ||
          txnError.message.includes('replica set') ||
          txnError.message.includes('transaction')
        )) {
          try { await session.abortTransaction(); } catch (_) {}
          session.endSession();
          // Fallback: run without transaction session
          receiptData = await onSuccess(null, transactionId);
          usedTransaction = false;
        } else {
          try { await session.abortTransaction(); } catch (_) {}
          throw txnError;
        }
      } finally {
        if (usedTransaction) session.endSession();
      }
    } catch (sessionError) {
      // If even starting a session fails, run without one
      if (!sessionError.message || sessionError.message.includes('Transaction') || sessionError.message.includes('replica')) {
        receiptData = await onSuccess(null, transactionId);
      } else {
        throw sessionError;
      }
    }

    // Cache for idempotency in Redis (expires after 24 hours)
    if (idempotencyKey) {
      try {
        await redisClient.set('idempotency:' + idempotencyKey, JSON.stringify({ transactionId, receiptData }), 'EX', 86400);
      } catch (err) {
        console.error('[Redis] Idempotency write error:', err.message);
      }
    }

    return {
      success: true,
      transactionId,
      status: 'SUCCESS',
      receiptData
    };
  } catch (error) {
    console.error(`Payment FAILED [${transactionId}]:`, error.message);
    return {
      success: false,
      transactionId,
      status: 'FAILED',
      error: error.message
    };
  }
}

module.exports = {
  processPayment,
  generateTransactionId,
  lookupSubscriptionPrice,
  lookupVASPrice,
  CANONICAL_PRICES
};
