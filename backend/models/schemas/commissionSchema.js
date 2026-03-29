const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Commission schema for tracking platform revenue from events
const commissionSchema = new Schema({
  event: { 
    type: Schema.Types.ObjectId, 
    ref: 'Event',
    required: true 
  },
  organizer: { 
    type: Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  // Transaction tracking
  transaction: {
    type: Schema.Types.ObjectId,
    ref: 'WalletTransaction'
  },
  // Financial breakdown
  totalRevenue: {
    type: Number,
    required: true,
    default: 0
  },
  commissionRate: {
    type: Number,
    required: true,
    default: 15
  },
  commissionAmount: {
    type: Number,
    required: true,
    default: 0
  },
  organizerPayout: {
    type: Number,
    required: true,
    default: 0
  },
  paymentGatewayFee: {
    type: Number,
    default: 0
  },
  // Payout status
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'processed', 'paid', 'cancelled'],
    default: 'pending'
  },
  payoutDate: Date,
  payoutMethod: {
    type: String,
    enum: ['bank_transfer', 'upi', 'wallet', 'cheque']
  },
  payoutReference: String,
  // Settlement period (T+N days)
  settlementDays: {
    type: Number,
    default: 5  // T+5 days settlement
  },
  eligibleForPayoutAt: Date,
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

// Pre-save hook to calculate amounts
commissionSchema.pre('save', function(next) {
  if (this.isModified('totalRevenue') || this.isModified('commissionRate')) {
    this.commissionAmount = (this.totalRevenue * this.commissionRate) / 100;
    this.organizerPayout = this.totalRevenue - this.commissionAmount - (this.paymentGatewayFee || 0);
  }
  
  // Calculate eligible payout date
  if (this.isNew) {
    const eligibleDate = new Date();
    eligibleDate.setDate(eligibleDate.getDate() + this.settlementDays);
    this.eligibleForPayoutAt = eligibleDate;
  }
  
  this.updatedAt = Date.now();
  next();
});

// Indexes for better query performance
commissionSchema.index({ event: 1 });
commissionSchema.index({ organizer: 1 });
commissionSchema.index({ status: 1 });
commissionSchema.index({ eligibleForPayoutAt: 1 });

module.exports = mongoose.model('Commission', commissionSchema);
