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

  /** Purchase a new subscription (first-time) */
  async purchase(plan, billingCycle = 'monthly', idempotencyKey = null) {
    return apiService.post(`${API_BASE}/purchase`, {
      plan,
      billingCycle,
      idempotencyKey: idempotencyKey || `sub_${plan}_${billingCycle}_${Date.now()}`
    });
  }

  /** Upgrade or switch to a different plan */
  async upgrade(newPlan, billingCycle = 'monthly', idempotencyKey = null) {
    return apiService.post(`${API_BASE}/upgrade`, {
      newPlan,
      billingCycle,
      idempotencyKey: idempotencyKey || `upg_${newPlan}_${billingCycle}_${Date.now()}`
    });
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
