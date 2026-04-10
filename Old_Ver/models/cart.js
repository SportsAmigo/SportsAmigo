const Cart = require('./schemas/cartSchema');
const ShopItem = require('./schemas/shopItemSchema');

/**
 * Cart model
 */
module.exports = {
    /**
     * Get user's cart
     * @param {string} userId - User ID
     * @returns {Promise<object>} - Promise resolving to the cart
     */
    getCart: async function(userId) {
        try {
            let cart = await Cart.findOne({ userId }).populate('items.itemId');
            
            if (!cart) {
                // Create empty cart if doesn't exist
                cart = new Cart({ userId, items: [] });
                await cart.save();
            }
            
            return { success: true, data: cart };
        } catch (error) {
            console.error('Error fetching cart:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Add item to cart
     * @param {string} userId - User ID
     * @param {string} itemId - Item ID to add
     * @param {number} quantity - Quantity to add (default: 1)
     * @returns {Promise<object>} - Promise resolving to updated cart
     */
    addToCart: async function(userId, itemId, quantity = 1) {
        try {
            // First, get the item details
            const shopItem = await ShopItem.findById(itemId);
            if (!shopItem) {
                return { success: false, error: 'Item not found' };
            }

            // Check stock availability
            if (shopItem.stock < quantity) {
                return { success: false, error: 'Insufficient stock available' };
            }

            // Get or create cart
            let cart = await Cart.findOne({ userId });
            if (!cart) {
                cart = new Cart({ userId, items: [] });
            }

            // Check if item already exists in cart
            const existingItemIndex = cart.items.findIndex(
                item => item.itemId.toString() === itemId
            );

            if (existingItemIndex > -1) {
                // Update quantity if item exists
                const newQuantity = cart.items[existingItemIndex].quantity + quantity;
                
                // Check if new quantity exceeds stock
                if (newQuantity > shopItem.stock) {
                    return { success: false, error: 'Cannot add more items than available in stock' };
                }
                
                cart.items[existingItemIndex].quantity = newQuantity;
            } else {
                // Add new item to cart
                cart.items.push({
                    itemId: shopItem._id,
                    name: shopItem.name,
                    price: shopItem.price,
                    quantity: quantity,
                    imageUrl: shopItem.imageUrl
                });
            }

            await cart.save();
            return { success: true, data: cart };
        } catch (error) {
            console.error('Error adding to cart:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Remove item from cart
     * @param {string} userId - User ID
     * @param {string} itemId - Item ID to remove
     * @returns {Promise<object>} - Promise resolving to updated cart
     */
    removeFromCart: async function(userId, itemId) {
        try {
            const cart = await Cart.findOne({ userId });
            if (!cart) {
                return { success: false, error: 'Cart not found' };
            }

            cart.items = cart.items.filter(item => item.itemId.toString() !== itemId);
            await cart.save();
            
            return { success: true, data: cart };
        } catch (error) {
            console.error('Error removing from cart:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update item quantity in cart
     * @param {string} userId - User ID
     * @param {string} itemId - Item ID
     * @param {number} quantity - New quantity
     * @returns {Promise<object>} - Promise resolving to updated cart
     */
    updateQuantity: async function(userId, itemId, quantity) {
        try {
            if (quantity <= 0) {
                return this.removeFromCart(userId, itemId);
            }

            // Check stock availability
            const shopItem = await ShopItem.findById(itemId);
            if (!shopItem) {
                return { success: false, error: 'Item not found' };
            }

            if (shopItem.stock < quantity) {
                return { success: false, error: 'Insufficient stock available' };
            }

            const cart = await Cart.findOne({ userId });
            if (!cart) {
                return { success: false, error: 'Cart not found' };
            }

            const itemIndex = cart.items.findIndex(item => item.itemId.toString() === itemId);
            if (itemIndex === -1) {
                return { success: false, error: 'Item not found in cart' };
            }

            cart.items[itemIndex].quantity = quantity;
            await cart.save();

            return { success: true, data: cart };
        } catch (error) {
            console.error('Error updating quantity:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Clear cart
     * @param {string} userId - User ID
     * @returns {Promise<object>} - Promise resolving to empty cart
     */
    clearCart: async function(userId) {
        try {
            const cart = await Cart.findOne({ userId });
            if (!cart) {
                return { success: false, error: 'Cart not found' };
            }

            cart.items = [];
            await cart.save();

            return { success: true, data: cart };
        } catch (error) {
            console.error('Error clearing cart:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get cart count for user
     * @param {string} userId - User ID
     * @returns {Promise<number>} - Promise resolving to cart item count
     */
    getCartCount: async function(userId) {
        try {
            const cart = await Cart.findOne({ userId });
            if (!cart) {
                return { success: true, count: 0 };
            }
            
            return { success: true, count: cart.itemCount };
        } catch (error) {
            console.error('Error fetching cart count:', error);
            return { success: false, error: error.message };
        }
    }
};