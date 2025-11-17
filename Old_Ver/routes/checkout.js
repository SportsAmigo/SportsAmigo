/**
 * Checkout Routes - Handles checkout process with shop login integration
 */

const express = require('express');
const router = express.Router();
const ShopItem = require('../models/shopItem');
const Order = require('../models/order');
const WalletTransaction = require('../models/walletTransaction');
const UserSchema = require('../models/schemas/userSchema');

/**
 * GET /checkout - Checkout page (requires shop login)
 */
router.get('/', async (req, res) => {
    try {
        // Check if user is logged in to shop
        if (!req.session.shopUser) {
            return res.redirect('/shop-login?returnUrl=/checkout');
        }

        // Check if cart has items
        const cart = req.session.cart;
        if (!cart || !cart.items || cart.items.length === 0) {
            return res.redirect('/cart?error=empty');
        }

        // Get fresh user data (including wallet balance)
        const user = await UserSchema.findById(req.session.shopUser.id);
        if (!user) {
            return res.redirect('/shop-login?error=invalid_session');
        }

        // Update session with latest wallet balance
        req.session.shopUser.walletBalance = user.walletBalance || 0;

        res.render('shop/checkout', {
            title: 'Checkout - SportsAmigo',
            cart: cart,
            user: user, // Pass user object for template compatibility
            shopUser: req.session.shopUser,
            walletBalance: user.walletBalance || 0,
            canUseWallet: (user.role === 'player' && (user.walletBalance || 0) > 0)
        });

    } catch (error) {
        console.error('Error loading checkout page:', error);
        res.render('error', { 
            message: 'Failed to load checkout page',
            error: error.message 
        });
    }
});

/**
 * POST /checkout - Process order
 */
router.post('/', async (req, res) => {
    try {
        // Check if user is logged in to shop
        if (!req.session.shopUser) {
            return res.json({ success: false, error: 'Authentication required' });
        }

        // Check if cart has items
        const cart = req.session.cart;
        if (!cart || !cart.items || cart.items.length === 0) {
            return res.json({ success: false, error: 'Cart is empty' });
        }

        const { fullName, phone, email, street, city, state, area, landmark, paymentMethod } = req.body;

        // Validate required fields
        if (!fullName || !phone || !street || !city || !state || !area || !paymentMethod) {
            return res.json({ success: false, error: 'Please fill in all required fields' });
        }

        // Combine address fields
        const address = `${street}, ${area}, ${city}, ${state}${landmark ? ', Near ' + landmark : ''}`;

        const userId = req.session.shopUser.id;
        const totalAmount = cart.totalAmount;

        // Get fresh user data
        const user = await UserSchema.findById(userId);
        if (!user) {
            return res.json({ success: false, error: 'User not found' });
        }

        let paymentDetails = {};
        let walletUsed = false;

        // Handle different payment methods
        switch (paymentMethod) {
            case 'Wallet':
                // Validate wallet balance
                if (user.role !== 'player') {
                    return res.json({ success: false, error: 'Wallet payment is only available for players' });
                }
                
                const walletBalance = user.walletBalance || 0;
                if (walletBalance < totalAmount) {
                    return res.json({ 
                        success: false, 
                        error: `Insufficient wallet balance. You have ₹${walletBalance.toFixed(2)}, but need ₹${totalAmount.toFixed(2)}` 
                    });
                }
                
                walletUsed = true;
                paymentDetails = {
                    method: 'wallet',
                    walletDeduction: totalAmount,
                    status: 'completed'
                };
                break;
                
            case 'COD':
                paymentDetails = {
                    method: 'cod',
                    status: 'pending'
                };
                break;
                
            default:
                return res.json({ success: false, error: 'Invalid payment method' });
        }

        // Create customer info object
        const customerInfo = { 
            fullName, 
            phone, 
            email: email || user.email, 
            address 
        };
        
        // Create order directly from session cart (bypass Order.createOrder which expects DB cart)
        const OrderModel = require('../models/schemas/orderSchema');
        
        // Generate order number
        const orderCount = await OrderModel.countDocuments();
        const orderNumber = `ORD${String(orderCount + 1).padStart(6, '0')}`;
        
        // Create order data
        const orderData = {
            userId: userId,
            orderNumber: orderNumber,
            orderItems: cart.items.map(item => ({
                itemId: item.itemId, // Use itemId directly since that's how it's stored
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                imageUrl: item.imageUrl || '/images/shop/default-product.jpg'
            })),
            totalAmount: totalAmount,
            itemCount: cart.itemCount,
            customerInfo: customerInfo,
            shippingAddress: { address }, // Simple address for now
            paymentMethod: paymentMethod === 'COD' ? 'Cash on Delivery' : paymentMethod, // Fix enum value
            orderStatus: 'Confirmed',
            paymentStatus: walletUsed ? 'Paid' : 'Pending'
        };

        const order = new OrderModel(orderData);
        await order.save();

        // Process wallet payment if selected
        if (walletUsed) {
            // Deduct from wallet
            const newBalance = user.walletBalance - totalAmount;
            await UserSchema.findByIdAndUpdate(userId, { walletBalance: newBalance });

            // Create wallet transaction
            const transactionResult = await WalletTransaction.createTransaction({
                playerId: userId,
                transactionType: 'Debit',
                amount: totalAmount,
                description: `Shop purchase - Order #${order.orderNumber}`,
                orderId: order._id,
                balanceAfter: newBalance,
                status: 'Completed',
                referenceId: `ORDER_${order.orderNumber}_${Date.now()}`
            });

            if (!transactionResult.success) {
                console.error('Failed to create wallet transaction:', transactionResult.error);
            }

            // Update session wallet balance
            req.session.shopUser.walletBalance = newBalance;
        }

        // Clear cart after successful order
        req.session.cart = { items: [], itemCount: 0, totalAmount: 0 };

        // Redirect to orders page as requested
        res.json({ 
            success: true, 
            message: 'Order placed successfully!',
            redirectUrl: `/shop/orders`
        });

    } catch (error) {
        console.error('Error processing checkout:', error);
        res.json({ success: false, error: 'Checkout failed. Please try again.' });
    }
});

/**
 * GET /checkout/order-success - Order confirmation page
 */
router.get('/order-success', async (req, res) => {
    try {
        const { orderId } = req.query;
        
        if (!orderId) {
            return res.redirect('/shop');
        }

        // Get order details
        const OrderModel = require('../models/schemas/orderSchema');
        const order = await OrderModel.findById(orderId).populate('orderItems.itemId');
        if (!order) {
            return res.render('error', { 
                message: 'Order not found' 
            });
        }

        // Calculate delivery date display
        const deliveryDate = order.deliveryDate || order.expectedDelivery;
        const deliveryDateStr = deliveryDate ? deliveryDate.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'To be determined';

        res.render('shop/order-success', {
            title: 'Order Confirmed - SportsAmigo',
            order: order,
            deliveryDate: deliveryDateStr,
            walletUsed: order.paymentMethod === 'Wallet'
        });

    } catch (error) {
        console.error('Error loading order success page:', error);
        res.render('error', { 
            message: 'Failed to load order confirmation',
            error: error.message 
        });
    }
});

module.exports = router;