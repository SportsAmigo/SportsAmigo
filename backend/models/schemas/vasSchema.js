/**
 * Value-Added Services (VAS) Schema
 * 
 * Tracks all value-added service purchases:
 * - For Organizers: Insurance, Photography, Marketing, Certificates, SMS
 * - For Players: Premium Profile, Performance Analytics, Player Insurance
 */

const mongoose = require('mongoose');

const vasSchema = new mongoose.Schema({
  // Reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'users',
    required: true,
    index: true
  },
  
  // Service details
  serviceType: {
    type: String,
    enum: [
      // Organizer services
      'event_insurance',
      'photography_booking',
      'venue_partner',
      'marketing_boost',
      'certificate_generation',
      'sms_notifications',
      
      // Player services
      'premium_profile',
      'performance_analytics',
      'player_insurance'
    ],
    required: true,
    index: true
  },
  
  serviceCategory: {
    type: String,
    enum: ['organizer', 'player'],
    required: true
  },
  
  // Linked resources
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    // Required for event-specific services
    required: function() {
      return ['event_insurance', 'photography_booking', 'marketing_boost', 'certificate_generation', 'sms_notifications'].includes(this.serviceType);
    }
  },
  
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  
  currency: {
    type: String,
    default: 'INR'
  },
  
  // Subscription-based services
  subscriptionPeriod: {
    type: String,
    enum: ['one_time', 'monthly', 'yearly'],
    default: 'one_time'
  },
  
  startDate: {
    type: Date,
    default: Date.now
  },
  
  endDate: {
    type: Date,
    // Auto-calculate for subscription services
    default: function() {
      if (this.subscriptionPeriod === 'monthly') {
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      } else if (this.subscriptionPeriod === 'yearly') {
        return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 365 days
      }
      return null;
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'pending', 'completed'],
    default: 'active'
  },
  
  // Payment details
  paymentId: {
    type: String
  },
  
  paymentMethod: {
    type: String,
    enum: ['card', 'wallet', 'upi', 'netbanking', 'cod']
  },
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed'
  },
  
  // Service-specific data
  serviceDetails: {
    // Event Insurance specific
    insuranceType: {
      type: String,
      enum: ['basic', 'standard', 'premium']
    },
    coverageAmount: Number,
    policyNumber: String,
    
    // Photography specific
    photographerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'users'
    },
    sessionDate: Date,
    deliveryDate: Date,
    photosCount: Number,
    
    // Venue Partner specific
    venueId: String,
    venueName: String,
    bookingDate: Date,
    commissionRate: Number,
    
    // Marketing Boost specific
    boostType: {
      type: String,
      enum: ['basic', 'standard', 'premium']
    },
    targetAudience: String,
    impressions: Number,
    clicks: Number,
    conversions: Number,
    
    // Certificate Generation specific
    certificateCount: Number,
    templateId: String,
    generatedCount: {
      type: Number,
      default: 0
    },
    
    // SMS Notifications specific
    smsCount: Number,
    smsUsed: {
      type: Number,
      default: 0
    },
    recipient: String,
    
    // Premium Profile specific (Player)
    features: [String], // ['verified_badge', 'portfolio', 'stats', 'videos']
    profileUrl: String,
    
    // Performance Analytics specific (Player)
    eventsTracked: Number,
    analyticsEnabled: Boolean,
    
    // Player Insurance specific
    insurancePlan: {
      type: String,
      enum: ['basic', 'comprehensive']
    },
    coverageDetails: String
  },
  
  // Usage tracking
  usage: {
    lastUsed: Date,
    totalUsage: {
      type: Number,
      default: 0
    },
    remainingUsage: Number
  },
  
  // Auto-renewal for subscriptions
  autoRenew: {
    type: Boolean,
    default: false
  },
  
  // Notes
  notes: String,
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for performance
vasSchema.index({ userId: 1, serviceType: 1 });
vasSchema.index({ status: 1, endDate: 1 });
vasSchema.index({ serviceCategory: 1, status: 1 });

// Update timestamp on save
vasSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Instance methods

// Check if service is active
vasSchema.methods.isActive = function() {
  if (this.status !== 'active') return false;
  if (this.endDate && this.endDate < new Date()) return false;
  return true;
};

// Check if service has remaining usage
vasSchema.methods.hasRemainingUsage = function() {
  if (this.usage.remainingUsage === undefined || this.usage.remainingUsage === null) {
    return true; // No usage limit
  }
  return this.usage.remainingUsage > 0;
};

// Use service (increment usage)
vasSchema.methods.useService = async function(amount = 1) {
  this.usage.lastUsed = new Date();
  this.usage.totalUsage += amount;
  
  if (this.usage.remainingUsage !== undefined && this.usage.remainingUsage !== null) {
    this.usage.remainingUsage -= amount;
    
    if (this.usage.remainingUsage <= 0) {
      this.usage.remainingUsage = 0;
      this.status = 'completed';
    }
  }
  
  return await this.save();
};

// Renew subscription
vasSchema.methods.renew = async function() {
  if (this.subscriptionPeriod === 'one_time') {
    throw new Error('Cannot renew one-time purchase');
  }
  
  this.startDate = new Date();
  
  if (this.subscriptionPeriod === 'monthly') {
    this.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  } else if (this.subscriptionPeriod === 'yearly') {
    this.endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  }
  
  this.status = 'active';
  
  return await this.save();
};

// Static methods

// Get pricing for service type
vasSchema.statics.getPricing = function(serviceType, tier = 'basic') {
  const pricing = {
    // Organizer services
    event_insurance: {
      basic: 999,
      standard: 2499,
      premium: 4999
    },
    photography_booking: {
      basic: 2999,
      standard: 4999,
      premium: 9999
    },
    venue_partner: {
      commission: 10 // 10% commission
    },
    marketing_boost: {
      basic: 499,
      standard: 1499,
      premium: 2999
    },
    certificate_generation: {
      perCertificate: 10, // ₹10 per certificate
      bulk50: 400,        // ₹8 per certificate
      bulk100: 700,       // ₹7 per certificate
      bulk500: 2500       // ₹5 per certificate
    },
    sms_notifications: {
      package1000: 999,   // ₹1 per SMS
      package5000: 4499,  // ₹0.90 per SMS
      package10000: 7999  // ₹0.80 per SMS
    },
    
    // Player services
    premium_profile: {
      yearly: 299
    },
    performance_analytics: {
      yearly: 499
    },
    player_insurance: {
      basic: 1499,
      comprehensive: 1999
    }
  };
  
  if (pricing[serviceType]) {
    if (typeof pricing[serviceType] === 'object' && pricing[serviceType][tier]) {
      return pricing[serviceType][tier];
    }
    return pricing[serviceType];
  }
  
  return null;
};

// Get active service for user
vasSchema.statics.getActiveService = async function(userId, serviceType) {
  return await this.findOne({
    userId,
    serviceType,
    status: 'active',
    $or: [
      { endDate: null },
      { endDate: { $gte: new Date() } }
    ]
  });
};

// Check if user has active service
vasSchema.statics.hasActiveService = async function(userId, serviceType) {
  const service = await this.getActiveService(userId, serviceType);
  return service !== null;
};

// Get all active services for user
vasSchema.statics.getUserServices = async function(userId, category = null) {
  const query = {
    userId,
    status: 'active'
  };
  
  if (category) {
    query.serviceCategory = category;
  }
  
  return await this.find(query).sort({ createdAt: -1 });
};

// Get expiring services (for renewal reminders)
vasSchema.statics.getExpiringServices = async function(daysBeforeExpiry = 7) {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + daysBeforeExpiry);
  
  return await this.find({
    status: 'active',
    subscriptionPeriod: { $in: ['monthly', 'yearly'] },
    endDate: {
      $gte: new Date(),
      $lte: expiryDate
    }
  }).populate('userId', 'name email phone');
};

module.exports = mongoose.model('VAS', vasSchema);
