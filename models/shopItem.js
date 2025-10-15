const ShopItem = require('./schemas/shopItemSchema');

/**
 * ShopItem model
 */
module.exports = {
    /**
     * Get all shop items
     * @param {object} filters - Optional filters
     * @returns {Promise<Array>} - Promise resolving to array of shop items
     */
    getAllItems: async function(filters = {}) {
        try {
            const query = {};
            
            // Apply filters
            if (filters.category) {
                query.category = filters.category;
            }
            
            if (filters.featured) {
                query.featured = true;
            }
            
            if (filters.inStock) {
                query.stock = { $gt: 0 };
            }
            
            const items = await ShopItem.find(query).sort({ createdAt: -1 });
            return { success: true, data: items };
        } catch (error) {
            console.error('Error fetching shop items:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Search shop items
     * @param {string} searchTerm - Search term
     * @returns {Promise<Array>} - Promise resolving to array of matching items
     */
    searchItems: async function(searchTerm) {
        try {
            const query = {
                $and: [
                    {
                        $or: [
                            { name: { $regex: searchTerm, $options: 'i' } },
                            { description: { $regex: searchTerm, $options: 'i' } },
                            { category: { $regex: searchTerm, $options: 'i' } }
                        ]
                    }
                ]
            };

            const items = await ShopItem.find(query).sort({ name: 1 });
            return { success: true, data: items };
        } catch (error) {
            console.error('Error searching shop items:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get item by ID
     * @param {string} itemId - Item ID
     * @returns {Promise<object>} - Promise resolving to the item
     */
    getItemById: async function(itemId) {
        try {
            const item = await ShopItem.findById(itemId);
            if (!item) {
                return { success: false, error: 'Item not found' };
            }
            return { success: true, data: item };
        } catch (error) {
            console.error('Error fetching item by ID:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Create a new shop item
     * @param {object} itemData - Item data
     * @returns {Promise<object>} - Promise resolving to the created item
     */
    createItem: async function(itemData) {
        try {
            const item = new ShopItem(itemData);
            await item.save();
            return { success: true, data: item };
        } catch (error) {
            console.error('Error creating shop item:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Update item stock
     * @param {string} itemId - Item ID
     * @param {number} quantity - Quantity to reduce from stock
     * @returns {Promise<object>} - Promise resolving to updated item
     */
    updateStock: async function(itemId, quantity) {
        try {
            const item = await ShopItem.findById(itemId);
            if (!item) {
                return { success: false, error: 'Item not found' };
            }

            if (item.stock < quantity) {
                return { success: false, error: 'Insufficient stock' };
            }

            item.stock -= quantity;
            await item.save();
            
            return { success: true, data: item };
        } catch (error) {
            console.error('Error updating stock:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get items by category
     * @param {string} category - Category name
     * @returns {Promise<Array>} - Promise resolving to array of items
     */
    getItemsByCategory: async function(category) {
        try {
            const items = await ShopItem.find({ category }).sort({ name: 1 });
            return { success: true, data: items };
        } catch (error) {
            console.error('Error fetching items by category:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get featured items
     * @param {number} limit - Number of items to return
     * @returns {Promise<Array>} - Promise resolving to array of featured items
     */
    getFeaturedItems: async function(limit = 6) {
        try {
            const items = await ShopItem.find({ featured: true, stock: { $gt: 0 } })
                .limit(limit)
                .sort({ createdAt: -1 });
            return { success: true, data: items };
        } catch (error) {
            console.error('Error fetching featured items:', error);
            return { success: false, error: error.message };
        }
    }
};