const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Order Item sub-schema
const orderItemSchema = new Schema({
    itemId: {
        type: Schema.Types.ObjectId,
        ref: 'ShopItem',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    imageUrl: {
        type: String,
        default: '/images/shop/default-product.jpg'
    }
});

// Order schema
const orderSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    orderItems: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    itemCount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        required: true,
        enum: ['Placed', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Confirmed'
    },
    customerInfo: {
        fullName: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true }
    },
    shippingAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: { type: String, default: 'USA' }
    },
    deliveryDate: {
        type: Date
    },
    paymentMethod: {
        type: String,
        enum: ['Credit Card', 'Debit Card', 'PayPal', 'Cash on Delivery', 'Wallet'],
        default: 'Credit Card'
    },
    walletTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'WalletTransaction',
        required: false
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
        default: 'Paid'
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    expectedDelivery: {
        type: Date
    },
    deliveredAt: {
        type: Date
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

// Generate order number before saving
orderSchema.pre('save', function(next) {
    if (this.isNew) {
        const timestamp = Date.now().toString();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.orderNumber = `SA-${timestamp.slice(-6)}${random}`;
        
        // Set expected delivery (2-5 days from order date)
        const days = Math.floor(Math.random() * 4) + 2; // 2–5 days
        this.expectedDelivery = new Date(this.orderDate.getTime() + (days * 24 * 60 * 60 * 1000));
        
        // Set delivery date (same as expected delivery for now)
        this.deliveryDate = this.expectedDelivery;
    }
    
    this.updatedAt = Date.now();
    next();
});

// Create indexes
orderSchema.index({ userId: 1, orderDate: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);