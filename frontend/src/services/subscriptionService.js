/**
 * Subscription Service — v1 API
 * Handles all subscription-related API calls using the new RESTful endpoints.
 */

import apiService from './apiService';

const API_BASE = '/api/v1/subscriptions';

class SubscriptionService {
  /** Fetch available subscription plans */
  async getPlans() {
    return apiService.get(`${API_BASE}/plans`);
  }

  /** Fetch the organizer's active subscription */
  async getCurrentSubscription() {
    return apiService.get(`${API_BASE}/current`);
  }

  /** Create Razorpay order for first-time subscription purchase */
  async createOrder(plan, billingCycle = 'monthly', idempotencyKey = null) {
    return apiService.post(`${API_BASE}/create-order`, {
      plan,
      billingCycle,
      idempotencyKey: idempotencyKey || `sub_${plan}_${billingCycle}_${Date.now()}`
    });
  }

  /** Verify payment for first-time subscription purchase */
  async verifyPayment(payload) {
    return apiService.post(`${API_BASE}/verify-payment`, payload);
  }

  /** Create Razorpay order for subscription upgrade/switch */
  async createUpgradeOrder(newPlan, billingCycle = 'monthly', idempotencyKey = null) {
    return apiService.post(`${API_BASE}/upgrade/create-order`, {
      newPlan,
      billingCycle,
      idempotencyKey: idempotencyKey || `upg_${newPlan}_${billingCycle}_${Date.now()}`
    });
  }

  /** Verify payment for subscription upgrade/switch */
  async verifyUpgradePayment(payload) {
    return apiService.post(`${API_BASE}/upgrade/verify-payment`, payload);
  }

  // Compatibility wrappers for existing callers.
  async purchase(plan, billingCycle = 'monthly', idempotencyKey = null) {
    return this.createOrder(plan, billingCycle, idempotencyKey);
  }

  async upgrade(newPlan, billingCycle = 'monthly', idempotencyKey = null) {
    return this.createUpgradeOrder(newPlan, billingCycle, idempotencyKey);
  }

  /** Fetch subscription payment history */
  async getHistory() {
    return apiService.get(`${API_BASE}/history`);
  }

  /** Get the PDF receipt download URL for a transaction */
  getReceiptURL(transactionId) {
    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${base}${API_BASE}/receipt/${transactionId}`;
  }
}

const subscriptionService = new SubscriptionService();
export default subscriptionService;
