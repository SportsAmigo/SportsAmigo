/**
 * Value-Added Services (VAS) API Service
 * Handles all API calls related to VAS products and purchases
 */

import apiService from './apiService';

class VASService {
  /**
   * Get all VAS products with pricing
   */
  async getVASProducts() {
    try {
      const response = await apiService.get('/vas/products');
      return response;
    } catch (error) {
      console.error('Error fetching VAS products:', error);
      throw error;
    }
  }

  /**
   * Get user's purchased VAS services
   */
  async getMyPurchases(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/vas/my-purchases${queryParams ? '?' + queryParams : ''}`;
      const response = await apiService.get(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching VAS purchases:', error);
      throw error;
    }
  }

  /**
   * Purchase Event Insurance (Organizer)
   */
  async purchaseEventInsurance(eventId, insuranceType) {
    try {
      const response = await apiService.post('/vas/organizer/insurance', {
        eventId,
        insuranceType
      });
      return response;
    } catch (error) {
      console.error('Error purchasing event insurance:', error);
      throw error;
    }
  }

  /**
   * Purchase Marketing Boost (Organizer)
   */
  async purchaseMarketingBoost(eventId, boostType) {
    try {
      const response = await apiService.post('/vas/organizer/marketing', {
        eventId,
        boostType
      });
      return response;
    } catch (error) {
      console.error('Error purchasing marketing boost:', error);
      throw error;
    }
  }

  /**
   * Purchase Certificate Generation (Organizer)
   */
  async purchaseCertificates(eventId, certificateCount, certificateType = 'standard') {
    try {
      const response = await apiService.post('/vas/organizer/certificates', {
        eventId,
        certificateCount,
        certificateType
      });
      return response;
    } catch (error) {
      console.error('Error purchasing certificates:', error);
      throw error;
    }
  }

  /**
   * Purchase SMS Package (Organizer)
   */
  async purchaseSMSPackage(eventId, smsCount) {
    try {
      const response = await apiService.post('/vas/organizer/sms', {
        eventId,
        smsCount
      });
      return response;
    } catch (error) {
      console.error('Error purchasing SMS package:', error);
      throw error;
    }
  }

  /**
   * Purchase Premium Profile (Player)
   */
  async purchasePremiumProfile() {
    try {
      const response = await apiService.post('/vas/player/premium-profile');
      return response;
    } catch (error) {
      console.error('Error purchasing premium profile:', error);
      throw error;
    }
  }

  /**
   * Purchase Performance Analytics (Player)
   */
  async purchasePerformanceAnalytics() {
    try {
      const response = await apiService.post('/vas/player/analytics');
      return response;
    } catch (error) {
      console.error('Error purchasing performance analytics:', error);
      throw error;
    }
  }

  /**
   * Purchase Player Insurance (Player)
   */
  async purchasePlayerInsurance(plan) {
    try {
      const response = await apiService.post('/vas/player/insurance', {
        insurancePlan: plan
      });
      return response;
    } catch (error) {
      console.error('Error purchasing player insurance:', error);
      throw error;
    }
  }

  /**
   * Check if user has an active VAS service
   */
  async checkVASStatus(serviceType) {
    try {
      const response = await apiService.get(`/vas/check/${serviceType}`);
      return response;
    } catch (error) {
      console.error('Error checking VAS status:', error);
      throw error;
    }
  }

  /**
   * Get organizer's events for VAS service linking
   */
  async getMyEvents() {
    try {
      const response = await apiService.get('/organizer/events');
      return response;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  /**
   * Get user's purchased VAS services (alias for getMyPurchases)
   */
  async getMyVAS(filters = {}) {
    try {
      const response = await this.getMyPurchases(filters);
      return response;
    } catch (error) {
      console.error('Error fetching VAS services:', error);
      throw error;
    }
  }

  /**
   * Get VAS revenue statistics (Admin only)
   */
  async getRevenueStats(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/vas/admin/revenue${queryParams ? '?' + queryParams : ''}`;
      const response = await apiService.get(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching VAS revenue stats:', error);
      throw error;
    }
  }
}

const vasServiceInstance = new VASService();
export default vasServiceInstance;
