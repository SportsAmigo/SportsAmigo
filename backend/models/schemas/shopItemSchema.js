const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Shop Item schema
const shopItemSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['Apparel', 'Equipment', 'Accessories', 'Footwear', 'Sports Gear']
    },
    imageUrl: {
        type: String,
        default: '/images/shop/default-product.jpg'
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 10
    },
    description: {
        type: String,
        required: true,
        maxlength: 500
    },
    featured: {
        type: Boolean,
        default: false
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

// Update the updatedAt field before saving
shopItemSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Create indexes for better search performance
shopItemSchema.index({ name: 'text', description: 'text' });
shopItemSchema.index({ category: 1 });
shopItemSchema.index({ price: 1 });

module.exports = mongoose.model('ShopItem', shopItemSchema);