/**
 * VAS Service — v1 API
 * All VAS API calls use the new RESTful endpoints with eventId in path.
 */

import apiService from './apiService';
import { API_BASE_URL } from '../utils/constants';

const API_BASE = '/api/v1';

class VASService {
  /** Fetch the VAS product catalog */
  async getProducts() {
    return apiService.get(`${API_BASE}/vas/products`);
  }

  /** Create Razorpay order for VAS purchase */
  async createOrder(eventId, serviceType, tier, quantity = null) {
    const body = { serviceType, tier };
    if (quantity) body.quantity = quantity;

    const createOrderResponse = await apiService.post(`${API_BASE}/events/${eventId}/vas/create-order`, body);

    // Compatibility fallback for servers that still expose only /purchase.
    if (createOrderResponse?.success === false && createOrderResponse?.status === 404) {
      const purchaseResponse = await apiService.post(`${API_BASE}/events/${eventId}/vas/purchase`, body);

      if (purchaseResponse?.success && !purchaseResponse?.orderId) {
        return {
          ...purchaseResponse,
          mode: 'direct_purchase'
        };
      }

      return purchaseResponse;
    }

    return createOrderResponse;
  }

  /** Verify Razorpay payment and activate VAS */
  async verifyPayment(eventId, payload) {
    return apiService.post(`${API_BASE}/events/${eventId}/vas/verify-payment`, payload);
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
    const base = process.env.REACT_APP_API_URL || API_BASE_URL;
    return `${base}${API_BASE}/organizers/vas/receipt/${transactionId}`;
  }

  /** Fetch organizer's events (for the event selector dropdown) */
  async getMyEvents() {
    return apiService.get('/api/organizer/events');
  }
}

const vasServiceInstance = new VASService();
export default vasServiceInstance;
