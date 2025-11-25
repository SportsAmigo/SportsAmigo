import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Initial state
const initialState = {
    balance: 0,
    transactions: [],
    loading: false,
    error: null,
};

// Async thunks

/**
 * Fetch wallet balance
 */
export const fetchWalletBalance = createAsyncThunk(
    'wallet/fetchWalletBalance',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/player/wallet');
            return response.data.balance || 0;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch wallet balance');
        }
    }
);

/**
 * Fetch transaction history
 */
export const fetchTransactions = createAsyncThunk(
    'wallet/fetchTransactions',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/player/wallet/transactions');
            return response.data.transactions || [];
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch transactions');
        }
    }
);

/**
 * Add money to wallet
 */
export const addMoney = createAsyncThunk(
    'wallet/addMoney',
    async (amount, { rejectWithValue }) => {
        try {
            const response = await api.post('/player/wallet/add', { amount });
            return {
                balance: response.data.balance,
                transaction: response.data.transaction,
            };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to add money');
        }
    }
);

/**
 * Withdraw money from wallet
 */
export const withdrawMoney = createAsyncThunk(
    'wallet/withdrawMoney',
    async (amount, { rejectWithValue }) => {
        try {
            const response = await api.post('/player/wallet/withdraw', { amount });
            return {
                balance: response.data.balance,
                transaction: response.data.transaction,
            };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to withdraw money');
        }
    }
);

// Wallet slice
const walletSlice = createSlice({
    name: 'wallet',
    initialState,
    reducers: {
        clearWalletError: (state) => {
            state.error = null;
        },
        resetWalletState: (state) => {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Wallet Balance
            .addCase(fetchWalletBalance.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWalletBalance.fulfilled, (state, action) => {
                state.loading = false;
                state.balance = action.payload;
                state.error = null;
            })
            .addCase(fetchWalletBalance.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch Transactions
            .addCase(fetchTransactions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTransactions.fulfilled, (state, action) => {
                state.loading = false;
                state.transactions = action.payload;
                state.error = null;
            })
            .addCase(fetchTransactions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Add Money
            .addCase(addMoney.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addMoney.fulfilled, (state, action) => {
                state.loading = false;
                state.balance = action.payload.balance;
                if (action.payload.transaction) {
                    state.transactions.unshift(action.payload.transaction);
                }
                state.error = null;
            })
            .addCase(addMoney.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Withdraw Money
            .addCase(withdrawMoney.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(withdrawMoney.fulfilled, (state, action) => {
                state.loading = false;
                state.balance = action.payload.balance;
                if (action.payload.transaction) {
                    state.transactions.unshift(action.payload.transaction);
                }
                state.error = null;
            })
            .addCase(withdrawMoney.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

// Export actions
export const { clearWalletError, resetWalletState } = walletSlice.actions;

// Export selectors
export const selectWalletBalance = (state) => state.wallet.balance;
export const selectTransactions = (state) => state.wallet.transactions;
export const selectWalletLoading = (state) => state.wallet.loading;
export const selectWalletError = (state) => state.wallet.error;

// Export reducer
export default walletSlice.reducer;

