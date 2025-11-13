/**
 * Cart Routes - Session-based cart management for shop
 */

const express = require('express');
const router = express.Router();
const ShopItem = require('../models/shopItem');

/**
 * Middleware to initialize cart in session
 */
const initializeCart = (req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = {
            items: [],
            itemCount: 0,
            totalAmount: 0,
            userId: req.session.shopUser ? req.session.shopUser.id : null
        };
    }
    next();
};

// Apply middleware to all routes
router.use(initializeCart);

/**
 * GET /cart - View cart page
 */
router.get('/', (req, res) => {
    const cart = req.session.cart;
    const error = req.query.error;
    
    let errorMessage = null;
    if (error === 'empty') {
        errorMessage = 'Your cart is empty. Please add some items before checkout.';
    }

    res.render('shop/cart', {
        title: 'Shopping Cart - SportsAmigo',
        cart: cart,
        shopUser: req.session.shopUser || null,
        error: errorMessage
    });
});

/**
 * POST /cart/add/:id - Add item to cart (AJAX)
 */
router.post('/add/:id', async (req, res) => {
    try {
        const itemId = req.params.id;
        const quantity = parseInt(req.body.quantity) || 1;

        // Get product details
        const productResult = await ShopItem.getItemById(itemId);
        if (!productResult.success) {
            return res.json({ success: false, error: 'Product not found' });
        }

        const product = productResult.data;
        
        // Check stock
        if (product.stock < quantity) {
            return res.json({ success: false, error: 'Insufficient stock' });
        }

        // Check if item already in cart
        const existingItemIndex = req.session.cart.items.findIndex(item => 
            item.itemId.toString() === itemId
        );

        if (existingItemIndex > -1) {
            // Update quantity
            const newQuantity = req.session.cart.items[existingItemIndex].quantity + quantity;
            if (newQuantity > product.stock) {
                return res.json({ success: false, error: 'Cannot add more items than available stock' });
            }
            req.session.cart.items[existingItemIndex].quantity = newQuantity;
        } else {
            // Add new item
            req.session.cart.items.push({
                itemId: product._id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                imageUrl: product.imageUrl
            });
        }

        // Recalculate totals
        updateCartTotals(req.session.cart);

        res.json({ 
            success: true, 
            message: 'Item added to cart successfully',
            count: req.session.cart.itemCount,
            cart: req.session.cart
        });

    } catch (error) {
        console.error('Error adding to cart:', error);
        res.json({ success: false, error: 'Failed to add item to cart' });
    }
});

/**
 * POST /cart/update - Update item quantity (AJAX)
 */
router.post('/update', (req, res) => {
    try {
        const { itemId, quantity } = req.body;
        const newQuantity = parseInt(quantity);

        if (!itemId || newQuantity < 1) {
            return res.json({ success: false, error: 'Invalid quantity' });
        }

        const itemIndex = req.session.cart.items.findIndex(item => 
            item.itemId.toString() === itemId
        );

        if (itemIndex === -1) {
            return res.json({ success: false, error: 'Item not found in cart' });
        }

        req.session.cart.items[itemIndex].quantity = newQuantity;
        updateCartTotals(req.session.cart);

        res.json({ 
            success: true, 
            message: 'Cart updated successfully',
            count: req.session.cart.itemCount,
            cart: req.session.cart
        });

    } catch (error) {
        console.error('Error updating cart:', error);
        res.json({ success: false, error: 'Failed to update cart' });
    }
});

/**
 * POST /cart/remove - Remove item from cart (AJAX)
 */
router.post('/remove', (req, res) => {
    try {
        const { itemId } = req.body;

        if (!itemId) {
            return res.json({ success: false, error: 'Item ID is required' });
        }

        const itemIndex = req.session.cart.items.findIndex(item => 
            item.itemId.toString() === itemId
        );

        if (itemIndex === -1) {
            return res.json({ success: false, error: 'Item not found in cart' });
        }

        req.session.cart.items.splice(itemIndex, 1);
        updateCartTotals(req.session.cart);

        res.json({ 
            success: true, 
            message: 'Item removed from cart',
            count: req.session.cart.itemCount,
            cart: req.session.cart
        });

    } catch (error) {
        console.error('Error removing from cart:', error);
        res.json({ success: false, error: 'Failed to remove item from cart' });
    }
});

/**
 * POST /cart/clear - Clear entire cart
 */
router.post('/clear', (req, res) => {
    try {
        req.session.cart = {
            items: [],
            itemCount: 0,
            totalAmount: 0,
            userId: req.session.shopUser ? req.session.shopUser.id : null
        };

        res.json({ 
            success: true, 
            message: 'Cart cleared successfully',
            count: 0,
            cart: req.session.cart
        });

    } catch (error) {
        console.error('Error clearing cart:', error);
        res.json({ success: false, error: 'Failed to clear cart' });
    }
});

/**
 * GET /cart/count - Get cart item count (AJAX)
 */
router.get('/count', (req, res) => {
    const count = req.session.cart ? req.session.cart.itemCount : 0;
    res.json({ success: true, count: count });
});

/**
 * Helper function to update cart totals
 */
function updateCartTotals(cart) {
    let itemCount = 0;
    let totalAmount = 0;

    cart.items.forEach(item => {
        itemCount += item.quantity;
        totalAmount += item.price * item.quantity;
    });

    cart.itemCount = itemCount;
    cart.totalAmount = totalAmount;
}

module.exports = router;