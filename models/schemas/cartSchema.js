const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Cart Item sub-schema
const cartItemSchema = new Schema({
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
        min: 1,
        default: 1
    },
    imageUrl: {
        type: String,
        default: '/images/shop/default-product.jpg'
    }
});

// Cart schema
const cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [cartItemSchema],
    totalAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    itemCount: {
        type: Number,
        default: 0,
        min: 0
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

// Calculate total amount and item count before saving
cartSchema.pre('save', function(next) {
    this.totalAmount = this.items.reduce((total, item) => {
        return total + (item.price * item.quantity);
    }, 0);
    
    this.itemCount = this.items.reduce((count, item) => {
        return count + item.quantity;
    }, 0);
    
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Cart', cartSchema);