const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// User schema
const userSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  role: { 
    type: String, 
    required: true,
    enum: ['player', 'organizer', 'manager', 'admin', 'moderator', 'coordinator'] 
  },
  first_name: { 
    type: String, 
    required: true 
  },
  last_name: { 
    type: String, 
    required: true 
  },
  phone: String,
  bio: String,
  profile_image: String,
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  // Organizer-specific fields
  organizerTier: {
    type: String,
    enum: ['new', 'established', 'premium', 'enterprise'],
    default: 'new'
  },
  organizerStats: {
    totalEvents: { type: Number, default: 0 },
    completedEvents: { type: Number, default: 0 },
    cancelledEvents: { type: Number, default: 0 },
    qualityScore: { type: Number, default: 0, min: 0, max: 100 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRevenue: { type: Number, default: 0 },
    totalParticipants: { type: Number, default: 0 }
  },
  subscription: {
    plan: { 
      type: String, 
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    startDate: Date,
    endDate: Date,
    status: { 
      type: String, 
      enum: ['active', 'expired', 'cancelled'],
      default: 'active'
    },
    paymentId: String
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'suspended'],
    default: function() {
      return this.role === 'organizer' ? 'pending' : 'verified';
    }
  },
  verificationDocuments: {
    idProof: String,      // File path/URL to ID proof
    businessProof: String, // File path/URL to business registration
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: String
  },
  // Moderator-specific fields
  moderatorRegion: {
    type: String,
    enum: ['north', 'south', 'east', 'west', 'central', 'all']
  },
  moderatorCategory: {
    type: String,
    enum: ['cricket', 'football', 'basketball', 'badminton', 'tennis', 'all']
  },
  // User profile fields embedded in the user document
  profile: {
    age: Number,
    address: String,
    join_date: { 
      type: Date, 
      default: Date.now 
    },
    preferred_sports: String,  // For players (comma-separated)
    organization_name: String, // For organizers
    team_name: String          // For managers
  },
  // Premium Player Profile features
  premiumProfile: {
    isActive: { type: Boolean, default: false },
    activatedAt: Date,
    expiresAt: Date,
    features: {
      verifiedBadge: { type: Boolean, default: false },
      portfolio: { type: Boolean, default: false },
      videoHighlights: { type: Boolean, default: false },
      priorityNotifications: { type: Boolean, default: false },
      customProfileUrl: String
    },
    portfolio: {
      stats: [{
        sport: String,
        matches: Number,
        wins: Number,
        achievements: String
      }],
      videos: [String], // Video URLs
      achievements: [String]
    },
    visibility: {
      type: String,
      enum: ['public', 'premium', 'private'],
      default: 'public'
    }
  },
  // Performance Analytics (Player)
  performanceAnalytics: {
    isActive: { type: Boolean, default: false },
    activatedAt: Date,
    expiresAt: Date,
    eventsTracked: { type: Number, default: 0 }
  },
  // Player Insurance
  playerInsurance: {
    isActive: { type: Boolean, default: false },
    plan: {
      type: String,
      enum: ['basic', 'comprehensive']
    },
    policyNumber: String,
    activatedAt: Date,
    expiresAt: Date,
    coverageAmount: Number
  },
  // Wallet balance for players
  walletBalance: {
    type: Number,
    default: 1000, // Starting balance of ₹1000
    min: 0
  },
  // Wallet status
  walletStatus: {
    type: String,
    enum: ['Active', 'Suspended', 'Closed'],
    default: 'Active'
  },
  // OTP for email verification during signup
  otp: {
    code: { type: String },
    expiresAt: { type: Date },
    attempts: { type: Number, default: 0 }
  },
  // Password reset fields
  passwordReset: {
    token: { type: String },
    otp: { type: String },
    expiresAt: { type: Date }
  },
  // Email verification status
  isEmailVerified: {
    type: Boolean,
    default: true // Default true for backward compatibility with existing users
  },
  emailVerifiedAt: {
    type: Date
  }
});

// Text index supports MongoDB full-text fallback search when Solr is unavailable.
userSchema.index(
  {
    first_name: 'text',
    last_name: 'text',
    email: 'text',
    role: 'text',
    phone: 'text'
  },
  {
    name: 'user_text_search_idx',
    weights: {
      first_name: 8,
      last_name: 8,
      email: 10,
      role: 2,
      phone: 1
    }
  }
);

module.exports = mongoose.model('User', userSchema); 