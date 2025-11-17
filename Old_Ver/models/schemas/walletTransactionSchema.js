const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Wallet Transaction schema
const walletTransactionSchema = new Schema({
    playerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    transactionType: {
        type: String,
        required: true,
        enum: ['Credit', 'Debit'],
        index: true
    },
    description: {
        type: String,
        required: true,
        maxlength: 200
    },
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: false
    },
    balanceAfter: {
        type: Number,
        required: true,
        min: 0
    },
    referenceId: {
        type: String,
        unique: true,
        sparse: true // Allows multiple null values
    },
    metadata: {
        paymentMethod: String,
        gateway: String,
        transactionFee: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed', 'Cancelled'],
        default: 'Completed'
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save middleware to update timestamps
walletTransactionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Generate reference ID if not provided
    if (!this.referenceId) {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        this.referenceId = `TXN-${timestamp.slice(-8)}${random}`;
    }
    
    next();
});

// Index for efficient queries
walletTransactionSchema.index({ playerId: 1, timestamp: -1 });
walletTransactionSchema.index({ transactionType: 1, timestamp: -1 });
walletTransactionSchema.index({ status: 1 });

// Static methods
walletTransactionSchema.statics.getPlayerTransactions = function(playerId, limit = 50) {
    return this.find({ playerId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('orderId', 'orderNumber totalAmount');
};

walletTransactionSchema.statics.getTransactionsByType = function(playerId, type, limit = 20) {
    return this.find({ playerId, transactionType: type })
        .sort({ timestamp: -1 })
        .limit(limit);
};

walletTransactionSchema.statics.getTotalCredits = function(playerId) {
    return this.aggregate([
        { $match: { playerId: new mongoose.Types.ObjectId(playerId), transactionType: 'Credit' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
};

walletTransactionSchema.statics.getTotalDebits = function(playerId) {
    return this.aggregate([
        { $match: { playerId: new mongoose.Types.ObjectId(playerId), transactionType: 'Debit' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
};

// Instance methods
walletTransactionSchema.methods.getFormattedAmount = function() {
    return `₹${this.amount.toFixed(2)}`;
};

walletTransactionSchema.methods.getFormattedDate = function() {
    return this.timestamp.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);