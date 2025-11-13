const express = require('express');
const router = express.Router();
const ShopItem = require('../models/shopItem');

// GET /api/shop/items - Get all shop items
router.get('/items', async (req, res) => {
    try {
        const { category, search, featured, inStock } = req.query;
        
        const filters = {};
        if (category) filters.category = category;
        if (featured === 'true') filters.featured = true;
        if (inStock === 'true') filters.inStock = true;
        
        let result;
        if (search) {
            result = await ShopItem.searchItems(search);
        } else {
            result = await ShopItem.getAllItems(filters);
        }
        
        if (result.success) {
            return res.json({
                success: true,
                items: result.data
            });
        } else {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }
    } catch (error) {
        console.error('Error fetching shop items:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching shop items'
        });
    }
});

// GET /api/shop/items/:id - Get single item
router.get('/items/:id', async (req, res) => {
    try {
        const result = await ShopItem.getItemById(req.params.id);
        
        if (result.success) {
            return res.json({
                success: true,
                item: result.data
            });
        } else {
            return res.status(404).json({
                success: false,
                message: result.error
            });
        }
    } catch (error) {
        console.error('Error fetching item:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching item'
        });
    }
});

// GET /api/shop/categories - Get all categories
router.get('/categories', async (req, res) => {
    try {
        const result = await ShopItem.getAllItems();
        
        if (result.success) {
            const categories = [...new Set(result.data.map(item => item.category))];
            return res.json({
                success: true,
                categories
            });
        } else {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }
    } catch (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching categories'
        });
    }
});

// GET /api/shop/featured - Get featured items
router.get('/featured', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 6;
        const result = await ShopItem.getFeaturedItems(limit);
        
        if (result.success) {
            return res.json({
                success: true,
                items: result.data
            });
        } else {
            return res.status(500).json({
                success: false,
                message: result.error
            });
        }
    } catch (error) {
        console.error('Error fetching featured items:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching featured items'
        });
    }
});

module.exports = router;
