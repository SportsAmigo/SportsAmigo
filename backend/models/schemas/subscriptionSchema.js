const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Subscription schema for premium organizer plans
const subscriptionSchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  plan: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    required: true,
    default: 'free'
  },
  // Pricing
  pricing: {
    monthly: Number,
    yearly: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  // Subscription period
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  // Auto-renewal
  autoRenew: {
    type: Boolean,
    default: true
  },
  // Status
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'suspended'],
    default: 'active'
  },
  // Payment tracking
  paymentHistory: [{
    amount: Number,
    paymentDate: Date,
    paymentMethod: String,
    transactionId: String,
    status: {
      type: String,
      enum: ['success', 'failed', 'pending']
    }
  }],
  // Features included (based on plan)
  features: {
    maxEvents: {
      type: Number,
      default: 3  // Free tier: 3 events/month
    },
    commissionRate: {
      type: Number,
      default: 20  // Free tier: 20% commission
    },
    featuredListings: {
      type: Number,
      default: 0  // Free tier: 0 featured listings
    },
    analytics: {
      type: Boolean,
      default: false
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    customBranding: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    whiteLabel: {
      type: Boolean,
      default: false
    }
  },
  // Usage tracking
  usage: {
    eventsCreated: {
      type: Number,
      default: 0
    },
    featuredListingsUsed: {
      type: Number,
      default: 0
    },
    resetDate: Date  // Resets monthly on this date
  },
  // Cancellation
  cancelledAt: Date,
  cancellationReason: String,
  // Notes
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to set features based on plan
subscriptionSchema.pre('save', function(next) {
  if (this.isModified('plan')) {
    switch(this.plan) {
      case 'pro':
        this.features.maxEvents = -1; // Unlimited
        this.features.commissionRate = 15;
        this.features.featuredListings = 1;
        this.features.analytics = true;
        this.features.prioritySupport = true;
        this.features.customBranding = true;
        this.pricing.monthly = 2999;
        this.pricing.yearly = 29999;
        break;
      case 'enterprise':
        this.features.maxEvents = -1; // Unlimited
        this.features.commissionRate = 12;
        this.features.featuredListings = -1; // Unlimited
        this.features.analytics = true;
        this.features.prioritySupport = true;
        this.features.customBranding = true;
        this.features.apiAccess = true;
        this.features.whiteLabel = true;
        this.pricing.monthly = 9999;
        this.pricing.yearly = 99999;
        break;
      default: // free
        this.features.maxEvents = 3;
        this.features.commissionRate = 20;
        this.features.featuredListings = 0;
        this.features.analytics = false;
        this.features.prioritySupport = false;
        this.features.customBranding = false;
        this.features.apiAccess = false;
        this.features.whiteLabel = false;
        this.pricing.monthly = 0;
        this.pricing.yearly = 0;
    }
  }
  
  // Set end date based on billing cycle
  if (this.isNew || this.isModified('startDate') || this.isModified('billingCycle')) {
    const endDate = new Date(this.startDate);
    if (this.billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    } else {
      endDate.setMonth(endDate.getMonth() + 1);
    }
    this.endDate = endDate;
    this.usage.resetDate = new Date(this.endDate);
  }
  
  this.updatedAt = Date.now();
  next();
});

// Method to check if subscription is still valid
subscriptionSchema.methods.isValid = function() {
  return this.status === 'active' && new Date() <= this.endDate;
};

// Method to check if can create more events
subscriptionSchema.methods.canCreateEvent = function() {
  if (this.features.maxEvents === -1) return true; // Unlimited
  return this.usage.eventsCreated < this.features.maxEvents;
};

// Indexes
subscriptionSchema.index({ user: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ endDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
