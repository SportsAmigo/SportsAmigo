const Order = require('./schemas/orderSchema');
const Cart = require('./cart');
const ShopItem = require('./shopItem');

/**
 * Order model
 */
module.exports = {
    /**
     * Create order from cart
     * @param {string} userId - User ID
     * @param {object} shippingAddress - Shipping address
     * @param {string} paymentMethod - Payment method
     * @returns {Promise<object>} - Promise resolving to the created order
     */
    createOrder: async function(userId, customerInfo = {}, shippingAddress = {}, paymentMethod = 'Credit Card') {
        try {
            // Get user's cart
            const cartResult = await Cart.getCart(userId);
            if (!cartResult.success) {
                return { success: false, error: 'Failed to get cart' };
            }

            const cart = cartResult.data;
            if (!cart.items || cart.items.length === 0) {
                return { success: false, error: 'Cart is empty' };
            }

            // Verify stock for all items
            for (const item of cart.items) {
                const shopItemResult = await ShopItem.getItemById(item.itemId);
                if (!shopItemResult.success) {
                    return { success: false, error: `Item ${item.name} no longer exists` };
                }

                const shopItem = shopItemResult.data;
                if (shopItem.stock < item.quantity) {
                    return { success: false, error: `Insufficient stock for ${item.name}` };
                }
            }

            // Create order
            const order = new Order({
                userId,
                orderItems: cart.items,
                totalAmount: cart.totalAmount,
                itemCount: cart.itemCount,
                customerInfo,
                shippingAddress,
                paymentMethod
            });

            await order.save();

            // Update stock for all items
            for (const item of cart.items) {
                await ShopItem.updateStock(item.itemId, item.quantity);
            }

            // Clear cart
            await Cart.clearCart(userId);

            return { success: true, data: order };
        } catch (error) {
            console.error('Error creating order:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get user's orders
     * @param {string} userId - User ID
     * @param {number} limit - Number of orders to return
     * @returns {Promise<Array>} - Promise resolving to array of orders
     */
    getUserOrders: async function(userId, limit = 10) {
        try {
            const orders = await Order.find({ userId })
                .sort({ orderDate: -1 })
                .limit(limit)
                .populate('orderItems.itemId');

            return { success: true, data: orders };
        } catch (error) {
            console.error('Error fetching user orders:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get order by ID
     * @param {string} orderId - Order ID
     * @param {string} userId - User ID (for security)
     * @returns {Promise<object>} - Promise resolving to the order
     */
    getOrderById: async function(orderId, userId) {
        try {
            const order = await Order.findOne({ _id: orderId, userId })
                .populate('orderItems.itemId')
                .populate('userId', 'first_name last_name email');

            if (!order) {
                return { success: false, error: 'Order not found' };
            }

            return { success: true, data: order };
        } catch (error) {
            console.error('Error fetching order by ID:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update order status
     * @param {string} orderId - Order ID
     * @param {string} status - New status
     * @returns {Promise<object>} - Promise resolving to updated order
     */
    updateOrderStatus: async function(orderId, status) {
        try {
            const validStatuses = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
            if (!validStatuses.includes(status)) {
                return { success: false, error: 'Invalid status' };
            }

            const updateData = { status };
            if (status === 'Delivered') {
                updateData.deliveredAt = new Date();
            }

            const order = await Order.findByIdAndUpdate(
                orderId,
                updateData,
                { new: true }
            );

            if (!order) {
                return { success: false, error: 'Order not found' };
            }

            return { success: true, data: order };
        } catch (error) {
            console.error('Error updating order status:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get order by order number
     * @param {string} orderNumber - Order number
     * @returns {Promise<object>} - Promise resolving to the order
     */
    getOrderByNumber: async function(orderNumber) {
        try {
            const order = await Order.findOne({ orderNumber })
                .populate('orderItems.itemId')
                .populate('userId', 'first_name last_name email phone');

            if (!order) {
                return { success: false, error: 'Order not found' };
            }

            return { success: true, data: order };
        } catch (error) {
            console.error('Error fetching order by number:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get all orders (admin function)
     * @param {object} filters - Optional filters
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @returns {Promise<object>} - Promise resolving to paginated orders
     */
    getAllOrders: async function(filters = {}, page = 1, limit = 20) {
        try {
            const query = {};
            
            if (filters.status) {
                query.status = filters.status;
            }
            
            if (filters.dateFrom) {
                query.orderDate = { $gte: new Date(filters.dateFrom) };
            }
            
            if (filters.dateTo) {
                query.orderDate = { ...query.orderDate, $lte: new Date(filters.dateTo) };
            }

            const skip = (page - 1) * limit;
            
            const orders = await Order.find(query)
                .populate('userId', 'first_name last_name email')
                .sort({ orderDate: -1 })
                .skip(skip)
                .limit(limit);

            const total = await Order.countDocuments(query);
            
            return {
                success: true,
                data: {
                    orders,
                    pagination: {
                        current: page,
                        pages: Math.ceil(total / limit),
                        total
                    }
                }
            };
        } catch (error) {
            console.error('Error fetching all orders:', error);
            return { success: false, error: error.message };
        }
    }
};