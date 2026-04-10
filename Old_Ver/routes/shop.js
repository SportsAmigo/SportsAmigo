const express = require('express');
const router = express.Router();
const ShopItem = require('../models/shopItem');
const Cart = require('../models/cart');
const Order = require('../models/order');
const WalletTransaction = require('../models/walletTransaction');
const User = require('../models/schemas/userSchema');

// Middleware to check if user is authenticated to shop
const requireShopAuth = (req, res, next) => {
    if (!req.session.shopUser) {
        return res.redirect('/shop-login?returnUrl=' + encodeURIComponent(req.originalUrl));
    }
    res.locals.shopUser = req.session.shopUser;
    next();
};

// Middleware to initialize session cart
const initializeCart = (req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = {
            items: [],
            itemCount: 0,
            totalAmount: 0,
            userId: req.session.shopUser ? req.session.shopUser.id : null
        };
    }
    res.locals.cart = req.session.cart;
    next();
};

// Middleware to make shop user and cart available in all shop templates
const addShopLocals = (req, res, next) => {
    res.locals.shopUser = req.session.shopUser || null;
    res.locals.cart = req.session.cart || { items: [], itemCount: 0, totalAmount: 0 };
    next();
};

// Apply middleware to all routes
router.use(addShopLocals);
router.use(initializeCart);

/**
 * GET /shop - Browse all products
 */
router.get('/', async (req, res) => {
    try {
        const { category, search } = req.query;
        
        let filters = { inStock: true };
        if (category) {
            filters.category = category;
        }

        const result = await ShopItem.getAllItems(filters);
        
        if (!result.success) {
            return res.render('error', { 
                message: 'Failed to load products',
                error: result.error 
            });
        }

        // If search term provided, filter results
        let products = result.data;
        if (search && search.trim()) {
            const searchResult = await ShopItem.searchItems(search.trim());
            if (searchResult.success) {
                products = searchResult.data;
            }
        }

        // Get categories for filter dropdown
        const categories = ['Apparel', 'Equipment', 'Accessories', 'Footwear', 'Sports Gear'];
        
        res.render('shop/browse', {
            title: 'SportsAmigo Shop',
            products,
            categories,
            selectedCategory: category || '',
            searchTerm: search || '',
            user: req.session.user || null,
            shopUser: req.session.shopUser || null,
            cart: req.session.cart || { items: [], itemCount: 0, totalAmount: 0 }
        });
    } catch (error) {
        console.error('Error loading shop page:', error);
        res.render('error', { 
            message: 'Failed to load shop',
            error: error.message 
        });
    }
});

/**
 * GET /shop/search - AJAX search for products
 */
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim().length < 2) {
            return res.json({ success: false, error: 'Search term too short' });
        }

        const result = await ShopItem.searchItems(q.trim());
        
        if (!result.success) {
            return res.json({ success: false, error: result.error });
        }

        // Filter only items in stock
        const products = result.data.filter(item => item.stock > 0);
        
        res.json({ 
            success: true, 
            products: products.map(item => ({
                _id: item._id,
                name: item.name,
                price: item.price,
                category: item.category,
                imageUrl: item.imageUrl,
                stock: item.stock,
                description: item.description.substring(0, 100) + '...'
            }))
        });
    } catch (error) {
        console.error('Error searching products:', error);
        res.json({ success: false, error: 'Search failed' });
    }
});

/**
 * POST /shop/add-to-cart/:id - Add product to cart via AJAX (session-based)
 */
router.post('/add-to-cart/:id', async (req, res) => {
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

        // Initialize cart if not exists
        if (!req.session.cart) {
            req.session.cart = { items: [], itemCount: 0, totalAmount: 0 };
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
        let itemCount = 0;
        let totalAmount = 0;

        req.session.cart.items.forEach(item => {
            itemCount += item.quantity;
            totalAmount += item.price * item.quantity;
        });

        req.session.cart.itemCount = itemCount;
        req.session.cart.totalAmount = totalAmount;

        res.json({ 
            success: true, 
            message: 'Item added to cart successfully',
            count: itemCount,
            cart: req.session.cart
        });

    } catch (error) {
        console.error('Error adding to cart:', error);
        res.json({ success: false, error: 'Failed to add item to cart' });
    }
});

/**
 * GET /shop/cart - View cart (session-based)
 */
router.get('/cart', (req, res) => {
    try {
        // Get cart from session
        const cart = req.session.cart || { items: [], itemCount: 0, totalAmount: 0 };

        res.render('shop/cart', {
            title: 'Shopping Cart - SportsAmigo',
            cart: cart,
            shopUser: req.session.shopUser || null
        });
    } catch (error) {
        console.error('Error loading cart:', error);
        res.render('error', { 
            message: 'Failed to load cart',
            error: error.message 
        });
    }
});

/**
 * GET /shop/checkout - Checkout page (redirected to dedicated checkout system)
 */
router.get('/checkout', async (req, res) => {
    // Redirect to the new dedicated checkout system
    res.redirect('/checkout');
});

/**
 * GET /shop/orders - View user's orders (requires shop login)
 */
router.get('/orders', async (req, res) => {
    try {
        if (!req.session.shopUser) {
            return res.redirect('/shop-login?returnUrl=/shop/orders');
        }

        const Order = require('../models/order');
        const result = await Order.getUserOrders(req.session.shopUser.id);
        
        if (!result.success) {
            return res.render('error', { 
                message: 'Failed to load orders',
                error: result.error 
            });
        }

        res.render('shop/orders', {
            title: 'My Orders - SportsAmigo',
            orders: result.data,
            shopUser: req.session.shopUser,
            cart: req.session.cart || { items: [], itemCount: 0, totalAmount: 0 }
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        res.render('error', { 
            message: 'Failed to load orders',
            error: error.message 
        });
    }
});

/**
 * GET /shop/order/:id - View specific order details (requires shop login)
 */
router.get('/order/:id', async (req, res) => {
    try {
        // Check if user is logged in to shop
        if (!req.session.shopUser) {
            return res.redirect('/shop-login?returnUrl=/shop/orders');
        }

        const orderId = req.params.id;
        const userId = req.session.shopUser.id;

        // Get order details
        const Order = require('../models/order');
        const orderResult = await Order.getOrderById(orderId, userId);
        
        if (!orderResult.success) {
            return res.render('error', { 
                message: 'Order not found or access denied',
                error: 'The order you requested could not be found or you do not have permission to view it.'
            });
        }

        const order = orderResult.data;

        // Calculate delivery date display
        const deliveryDate = order.deliveryDate || order.expectedDelivery;
        const deliveryDateStr = deliveryDate ? deliveryDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'To be determined';

        res.render('shop/order-details', {
            title: `Order #${order.orderNumber} - SportsAmigo`,
            order: order,
            deliveryDate: deliveryDateStr,
            shopUser: req.session.shopUser,
            cartCount: req.session.cart ? req.session.cart.itemCount : 0
        });

    } catch (error) {
        console.error('Error loading order details:', error);
        res.render('error', { 
            message: 'Failed to load order details',
            error: error.message 
        });
    }
});

// ========================================
// API ROUTES - Public product browsing
// ========================================
// Note: Cart and checkout functionality now handled by dedicated routes:
// - /cart/* routes handle cart operations
// - /checkout/* routes handle checkout process  
// - /shop-login/* routes handle shop authentication

/**
 * GET /shop/featured - Get featured products (AJAX)
 */
router.get('/featured', async (req, res) => {
    try {
        const result = await ShopItem.getFeaturedItems(6);
        
        if (!result.success) {
            return res.json({ success: false, error: result.error });
        }

        res.json({ 
            success: true, 
            products: result.data
        });
    } catch (error) {
        console.error('Error fetching featured products:', error);
        res.json({ success: false, error: 'Failed to fetch featured products' });
    }
});

/**
 * GET /shop/categories/:category - Get products by category
 */
router.get('/categories/:category', async (req, res) => {
    try {
        const category = req.params.category;
        const result = await ShopItem.getItemsByCategory(category);
        
        if (!result.success) {
            return res.json({ success: false, error: result.error });
        }

        res.json({ 
            success: true, 
            products: result.data.filter(item => item.stock > 0)
        });
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.json({ success: false, error: 'Failed to fetch products' });
    }
});

module.exports = router;