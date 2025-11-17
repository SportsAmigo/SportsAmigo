const WalletTransaction = require('./schemas/walletTransactionSchema');
const mongoose = require('mongoose');

/**
 * Wallet Transaction model
 */
module.exports = {
    /**
     * Create a new wallet transaction
     * @param {object} transactionData - Transaction data
     * @returns {Promise<object>} - Promise resolving to the created transaction
     */
    createTransaction: async function(transactionData) {
        try {
            const transaction = new WalletTransaction(transactionData);
            await transaction.save();
            return { success: true, data: transaction };
        } catch (error) {
            console.error('Error creating wallet transaction:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get player's wallet transactions
     * @param {string} playerId - Player ID
     * @param {number} limit - Number of transactions to return
     * @returns {Promise<Array>} - Promise resolving to array of transactions
     */
    getPlayerTransactions: async function(playerId, limit = 50) {
        try {
            const transactions = await WalletTransaction.getPlayerTransactions(playerId, limit);
            return { success: true, data: transactions };
        } catch (error) {
            console.error('Error fetching player transactions:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get transactions by type
     * @param {string} playerId - Player ID
     * @param {string} type - Transaction type ('Credit' or 'Debit')
     * @param {number} limit - Number of transactions to return
     * @returns {Promise<Array>} - Promise resolving to array of transactions
     */
    getTransactionsByType: async function(playerId, type, limit = 20) {
        try {
            const transactions = await WalletTransaction.getTransactionsByType(playerId, type, limit);
            return { success: true, data: transactions };
        } catch (error) {
            console.error('Error fetching transactions by type:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Calculate wallet balance
     * @param {string} playerId - Player ID
     * @returns {Promise<number>} - Promise resolving to current balance
     */
    calculateBalance: async function(playerId) {
        try {
            const credits = await WalletTransaction.getTotalCredits(playerId);
            const debits = await WalletTransaction.getTotalDebits(playerId);
            
            const totalCredits = credits.length > 0 ? credits[0].total : 0;
            const totalDebits = debits.length > 0 ? debits[0].total : 0;
            
            const balance = totalCredits - totalDebits;
            return { success: true, balance: Math.max(0, balance) };
        } catch (error) {
            console.error('Error calculating wallet balance:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Add funds to wallet (Credit transaction)
     * @param {string} playerId - Player ID
     * @param {number} amount - Amount to add
     * @param {string} description - Transaction description
     * @param {object} metadata - Additional transaction metadata
     * @returns {Promise<object>} - Promise resolving to transaction and new balance
     */
    addFunds: async function(playerId, amount, description = 'Funds Added', metadata = {}) {
        try {
            // Calculate current balance
            const balanceResult = await this.calculateBalance(playerId);
            if (!balanceResult.success) {
                return { success: false, error: 'Failed to calculate current balance' };
            }

            const newBalance = balanceResult.balance + amount;

            // Create credit transaction
            const transactionData = {
                playerId,
                amount,
                transactionType: 'Credit',
                description,
                balanceAfter: newBalance,
                metadata,
                status: 'Completed'
            };

            const result = await this.createTransaction(transactionData);
            if (!result.success) {
                return { success: false, error: 'Failed to create transaction' };
            }

            return {
                success: true,
                transaction: result.data,
                newBalance,
                message: `₹${amount.toFixed(2)} added to wallet successfully`
            };
        } catch (error) {
            console.error('Error adding funds:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Deduct funds from wallet (Debit transaction)
     * @param {string} playerId - Player ID
     * @param {number} amount - Amount to deduct
     * @param {string} description - Transaction description
     * @param {string} orderId - Optional order ID reference
     * @param {object} metadata - Additional transaction metadata
     * @returns {Promise<object>} - Promise resolving to transaction and new balance
     */
    deductFunds: async function(playerId, amount, description = 'Purchase', orderId = null, metadata = {}) {
        try {
            // Calculate current balance
            const balanceResult = await this.calculateBalance(playerId);
            if (!balanceResult.success) {
                return { success: false, error: 'Failed to calculate current balance' };
            }

            if (balanceResult.balance < amount) {
                return { success: false, error: 'Insufficient wallet balance' };
            }

            const newBalance = balanceResult.balance - amount;

            // Create debit transaction
            const transactionData = {
                playerId,
                amount,
                transactionType: 'Debit',
                description,
                balanceAfter: newBalance,
                orderId,
                metadata,
                status: 'Completed'
            };

            const result = await this.createTransaction(transactionData);
            if (!result.success) {
                return { success: false, error: 'Failed to create transaction' };
            }

            return {
                success: true,
                transaction: result.data,
                newBalance,
                message: `₹${amount.toFixed(2)} deducted from wallet successfully`
            };
        } catch (error) {
            console.error('Error deducting funds:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get transaction by reference ID
     * @param {string} referenceId - Transaction reference ID
     * @returns {Promise<object>} - Promise resolving to transaction
     */
    getTransactionByReference: async function(referenceId) {
        try {
            const transaction = await WalletTransaction.findOne({ referenceId })
                .populate('playerId', 'first_name last_name email')
                .populate('orderId', 'orderNumber totalAmount');
            
            if (!transaction) {
                return { success: false, error: 'Transaction not found' };
            }

            return { success: true, data: transaction };
        } catch (error) {
            console.error('Error fetching transaction by reference:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get wallet summary for player
     * @param {string} playerId - Player ID
     * @returns {Promise<object>} - Promise resolving to wallet summary
     */
    getWalletSummary: async function(playerId) {
        try {
            const balanceResult = await this.calculateBalance(playerId);
            if (!balanceResult.success) {
                return { success: false, error: 'Failed to calculate balance' };
            }

            const recentTransactions = await this.getPlayerTransactions(playerId, 10);
            if (!recentTransactions.success) {
                return { success: false, error: 'Failed to fetch transactions' };
            }

            const credits = await WalletTransaction.getTotalCredits(playerId);
            const debits = await WalletTransaction.getTotalDebits(playerId);

            const totalCredits = credits.length > 0 ? credits[0].total : 0;
            const totalDebits = debits.length > 0 ? debits[0].total : 0;

            return {
                success: true,
                data: {
                    currentBalance: balanceResult.balance,
                    totalCredits,
                    totalDebits,
                    transactionCount: await WalletTransaction.countDocuments({ playerId }),
                    recentTransactions: recentTransactions.data
                }
            };
        } catch (error) {
            console.error('Error fetching wallet summary:', error);
            return { success: false, error: error.message };
        }
    }
};