/**
 * VAS Service — v1 API
 * All VAS API calls use the new RESTful endpoints with eventId in path.
 */

import apiService from './apiService';

const API_BASE = '/api/v1';

class VASService {
  /** Fetch the VAS product catalog */
  async getProducts() {
    return apiService.get(`${API_BASE}/vas/products`);
  }

  /** Purchase a VAS for a specific event */
  async purchaseVAS(eventId, serviceType, tier, quantity = null) {
    const body = {
      serviceType,
      tier,
      idempotencyKey: `vas_${eventId}_${serviceType}_${tier}_${Date.now()}`
    };
    if (quantity) body.quantity = quantity;
    return apiService.post(`${API_BASE}/events/${eventId}/vas/purchase`, body);
  }

  /** Fetch active VAS for a specific event */
  async getEventVAS(eventId) {
    return apiService.get(`${API_BASE}/events/${eventId}/vas`);
  }

  /** Fetch all VAS across all events (dashboard summary) */
  async getSummary() {
    return apiService.get(`${API_BASE}/organizers/vas/summary`);
  }

  /** Fetch VAS payment history */
  async getHistory() {
    return apiService.get(`${API_BASE}/organizers/vas/history`);
  }

  /** Get the PDF receipt download URL for a VAS transaction */
  getReceiptURL(transactionId) {
    const base = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    return `${base}${API_BASE}/organizers/vas/receipt/${transactionId}`;
  }

  /** Fetch organizer's events (for the event selector dropdown) */
  async getMyEvents() {
    return apiService.get('/api/organizer/events');
  }
}

const vasServiceInstance = new VASService();
export default vasServiceInstance;
