const express = require('express');
const router = express.Router();
const WalletTransaction = require('../models/walletTransaction');
const User = require('../models/schemas/userSchema');

// Middleware to check if user is authenticated and is a player
const isPlayerAuthenticated = (req, res, next) => {
    if (!req.session || !req.session.user || !req.session.user.id) {
        return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    
    if (req.session.user.role !== 'player') {
        return res.status(403).json({ success: false, error: 'Access denied. Players only.' });
    }
    
    return next();
};

// Middleware to check player authentication for page renders
const isPlayerAuthenticatedPage = (req, res, next) => {
    if (!req.session || !req.session.user || !req.session.user.id) {
        req.session.flashMessage = {
            type: 'error',
            message: 'Please login to access your wallet'
        };
        return res.redirect('/login');
    }
    
    if (req.session.user.role !== 'player') {
        req.session.flashMessage = {
            type: 'error',
            message: 'Wallet access is available for players only'
        };
        return res.redirect('/');
    }
    
    return next();
};

/**
 * GET /wallet - Show wallet balance and transaction history
 */
router.get('/', isPlayerAuthenticatedPage, async (req, res) => {
    try {
        const playerId = req.session.user.id;
        
        // Get wallet summary
        const summaryResult = await WalletTransaction.getWalletSummary(playerId);
        
        if (!summaryResult.success) {
            req.session.flashMessage = {
                type: 'error',
                message: 'Failed to load wallet information'
            };
            return res.redirect('/player/dashboard');
        }

        // Get user details to ensure wallet balance is current
        const user = await User.findById(playerId);
        
        res.render('player/wallet', {
            title: 'My Wallet - SportsAmigo',
            user: req.session.user,
            wallet: summaryResult.data,
            userBalance: user ? user.walletBalance : 0,
            cartCount: res.locals.cartCount || 0
        });
    } catch (error) {
        console.error('Error loading wallet page:', error);
        req.session.flashMessage = {
            type: 'error',
            message: 'Failed to load wallet page'
        };
        res.redirect('/player/dashboard');
    }
});

/**
 * GET /wallet/balance - Get current wallet balance (AJAX)
 */
router.get('/balance', isPlayerAuthenticated, async (req, res) => {
    try {
        const playerId = req.session.user.id;
        
        // Get balance from database (more accurate than calculation)
        const user = await User.findById(playerId);
        if (!user) {
            return res.json({ success: false, error: 'User not found' });
        }

        // Also calculate balance from transactions for verification
        const calculatedResult = await WalletTransaction.calculateBalance(playerId);
        
        res.json({ 
            success: true, 
            balance: user.walletBalance,
            calculatedBalance: calculatedResult.success ? calculatedResult.balance : null,
            formatted: `₹${user.walletBalance.toFixed(2)}`
        });
    } catch (error) {
        console.error('Error fetching wallet balance:', error);
        res.json({ success: false, error: 'Failed to fetch balance' });
    }
});

/**
 * POST /wallet/add - Add funds to wallet (simulated top-up)
 */
router.post('/add', isPlayerAuthenticated, async (req, res) => {
    try {
        const playerId = req.session.user.id;
        const { amount, paymentMethod = 'Online Banking' } = req.body;

        // Validate amount
        const addAmount = parseFloat(amount);
        if (!addAmount || addAmount <= 0) {
            return res.json({ success: false, error: 'Invalid amount. Please enter a positive number.' });
        }

        if (addAmount > 50000) {
            return res.json({ success: false, error: 'Maximum top-up amount is ₹50,000 per transaction.' });
        }

        if (addAmount < 1) {
            return res.json({ success: false, error: 'Minimum top-up amount is ₹1.' });
        }

        // Get current user
        const user = await User.findById(playerId);
        if (!user) {
            return res.json({ success: false, error: 'User not found' });
        }

        // Check wallet status
        if (user.walletStatus !== 'Active') {
            return res.json({ success: false, error: 'Wallet is not active. Please contact support.' });
        }

        // Update user balance first
        const newBalance = user.walletBalance + addAmount;
        await User.findByIdAndUpdate(playerId, { walletBalance: newBalance });

        // Create wallet transaction
        const transactionResult = await WalletTransaction.addFunds(
            playerId, 
            addAmount, 
            `Funds Added via ${paymentMethod}`,
            {
                paymentMethod,
                gateway: 'Simulated Gateway',
                transactionFee: 0
            }
        );

        if (!transactionResult.success) {
            // Rollback balance update
            await User.findByIdAndUpdate(playerId, { walletBalance: user.walletBalance });
            return res.json({ success: false, error: transactionResult.error });
        }

        res.json({ 
            success: true, 
            newBalance,
            formattedBalance: `₹${newBalance.toFixed(2)}`,
            transaction: transactionResult.transaction,
            message: `₹${addAmount.toFixed(2)} added to your wallet successfully!`
        });
    } catch (error) {
        console.error('Error adding funds to wallet:', error);
        res.json({ success: false, error: 'Failed to add funds. Please try again.' });
    }
});

/**
 * GET /wallet/transactions - Get paginated transaction history (AJAX)
 */
router.get('/transactions', isPlayerAuthenticated, async (req, res) => {
    try {
        const playerId = req.session.user.id;
        const { page = 1, limit = 20, type = 'all' } = req.query;
        
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        let transactionsResult;
        
        if (type === 'all') {
            transactionsResult = await WalletTransaction.getPlayerTransactions(playerId, limitNum);
        } else if (type === 'credit' || type === 'debit') {
            transactionsResult = await WalletTransaction.getTransactionsByType(
                playerId, 
                type.charAt(0).toUpperCase() + type.slice(1), 
                limitNum
            );
        } else {
            return res.json({ success: false, error: 'Invalid transaction type' });
        }

        if (!transactionsResult.success) {
            return res.json({ success: false, error: transactionsResult.error });
        }

        res.json({ 
            success: true, 
            transactions: transactionsResult.data,
            page: pageNum,
            hasMore: transactionsResult.data.length === limitNum
        });
    } catch (error) {
        console.error('Error fetching wallet transactions:', error);
        res.json({ success: false, error: 'Failed to fetch transactions' });
    }
});

/**
 * GET /wallet/summary - Get wallet summary (AJAX)
 */
router.get('/summary', isPlayerAuthenticated, async (req, res) => {
    try {
        const playerId = req.session.user.id;
        
        const summaryResult = await WalletTransaction.getWalletSummary(playerId);
        
        if (!summaryResult.success) {
            return res.json({ success: false, error: summaryResult.error });
        }

        res.json({ 
            success: true, 
            summary: summaryResult.data
        });
    } catch (error) {
        console.error('Error fetching wallet summary:', error);
        res.json({ success: false, error: 'Failed to fetch wallet summary' });
    }
});

/**
 * POST /wallet/validate-payment - Validate if wallet has sufficient balance for payment
 */
router.post('/validate-payment', isPlayerAuthenticated, async (req, res) => {
    try {
        const playerId = req.session.user.id;
        const { amount } = req.body;

        const paymentAmount = parseFloat(amount);
        if (!paymentAmount || paymentAmount <= 0) {
            return res.json({ success: false, error: 'Invalid payment amount' });
        }

        // Get current balance
        const user = await User.findById(playerId);
        if (!user) {
            return res.json({ success: false, error: 'User not found' });
        }

        const hasEnoughBalance = user.walletBalance >= paymentAmount;
        const shortfall = hasEnoughBalance ? 0 : paymentAmount - user.walletBalance;

        res.json({ 
            success: true, 
            hasEnoughBalance,
            currentBalance: user.walletBalance,
            requiredAmount: paymentAmount,
            shortfall,
            message: hasEnoughBalance 
                ? 'Sufficient balance available' 
                : `Insufficient balance. You need ₹${shortfall.toFixed(2)} more.`
        });
    } catch (error) {
        console.error('Error validating payment:', error);
        res.json({ success: false, error: 'Failed to validate payment' });
    }
});

/**
 * GET /wallet/transaction/:referenceId - Get specific transaction details
 */
router.get('/transaction/:referenceId', isPlayerAuthenticated, async (req, res) => {
    try {
        const { referenceId } = req.params;
        const playerId = req.session.user.id;

        const transactionResult = await WalletTransaction.getTransactionByReference(referenceId);
        
        if (!transactionResult.success) {
            return res.json({ success: false, error: 'Transaction not found' });
        }

        // Check if transaction belongs to the logged-in player
        if (transactionResult.data.playerId.toString() !== playerId) {
            return res.json({ success: false, error: 'Access denied' });
        }

        res.json({ 
            success: true, 
            transaction: transactionResult.data
        });
    } catch (error) {
        console.error('Error fetching transaction details:', error);
        res.json({ success: false, error: 'Failed to fetch transaction details' });
    }
});

module.exports = router;