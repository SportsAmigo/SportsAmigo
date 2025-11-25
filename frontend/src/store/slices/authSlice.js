import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';

// Initial state
const initialState = {
    user: null,
    authenticated: false,
    loading: false,
    error: null,
    loginLoading: false,
    signupLoading: false,
    checkingAuth: true,
};

// Async thunks

/**
 * Check authentication status
 */
export const checkAuthStatus = createAsyncThunk(
    'auth/checkAuthStatus',
    async (_, { rejectWithValue }) => {
        try {
            const response = await authService.checkSession();
            if (response.success && response.authenticated) {
                return { user: response.user, authenticated: true };
            }
            return { user: null, authenticated: false };
        } catch (error) {
            return rejectWithValue(error.message || 'Failed to check authentication');
        }
    }
);

/**
 * Login user
 */
export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async ({ email, password, role }, { rejectWithValue }) => {
        try {
            const response = await authService.login(email, password, role);
            if (response.success) {
                return {
                    user: response.user,
                    message: 'Login successful'
                };
            }
            return rejectWithValue({
                message: response.message || 'Login failed',
                errors: response.errors || {}
            });
        } catch (error) {
            return rejectWithValue({
                message: error.message || 'Login failed',
                errors: error.errors || {}
            });
        }
    }
);

/**
 * Signup user
 */
export const signupUser = createAsyncThunk(
    'auth/signupUser',
    async (userData, { rejectWithValue }) => {
        try {
            const response = await authService.signup(userData);
            if (response.success) {
                return {
                    message: response.message || 'Registration successful! Please login with your credentials.'
                };
            }
            return rejectWithValue({
                message: response.message || 'Signup failed',
                errors: response.errors || {}
            });
        } catch (error) {
            return rejectWithValue({
                message: error.message || 'Signup failed',
                errors: error.errors || {}
            });
        }
    }
);

/**
 * Logout user
 */
export const logoutUser = createAsyncThunk(
    'auth/logoutUser',
    async (_, { rejectWithValue }) => {
        try {
            await authService.logout();
            return { message: 'Logout successful' };
        } catch (error) {
            // Still clear state even if API call fails
            return { message: 'Logged out' };
        }
    }
);

// Auth slice
const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Synchronous actions
        updateUserData: (state, action) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
        clearError: (state) => {
            state.error = null;
        },
        resetAuthState: (state) => {
            state.user = null;
            state.authenticated = false;
            state.loading = false;
            state.error = null;
            state.loginLoading = false;
            state.signupLoading = false;
        },
    },
    extraReducers: (builder) => {
        builder
            // Check Auth Status
            .addCase(checkAuthStatus.pending, (state) => {
                state.checkingAuth = true;
                state.error = null;
            })
            .addCase(checkAuthStatus.fulfilled, (state, action) => {
                state.checkingAuth = false;
                state.user = action.payload.user;
                state.authenticated = action.payload.authenticated;
                state.error = null;
            })
            .addCase(checkAuthStatus.rejected, (state, action) => {
                state.checkingAuth = false;
                state.user = null;
                state.authenticated = false;
                state.error = action.payload;
            })

            // Login User
            .addCase(loginUser.pending, (state) => {
                state.loginLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.loginLoading = false;
                state.user = action.payload.user;
                state.authenticated = true;
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loginLoading = false;
                state.user = null;
                state.authenticated = false;
                state.error = action.payload;
            })

            // Signup User
            .addCase(signupUser.pending, (state) => {
                state.signupLoading = true;
                state.error = null;
            })
            .addCase(signupUser.fulfilled, (state) => {
                state.signupLoading = false;
                state.error = null;
            })
            .addCase(signupUser.rejected, (state, action) => {
                state.signupLoading = false;
                state.error = action.payload;
            })

            // Logout User
            .addCase(logoutUser.pending, (state) => {
                state.loading = true;
            })
            .addCase(logoutUser.fulfilled, (state) => {
                state.loading = false;
                state.user = null;
                state.authenticated = false;
                state.error = null;
            })
            .addCase(logoutUser.rejected, (state) => {
                // Clear state even on error
                state.loading = false;
                state.user = null;
                state.authenticated = false;
                state.error = null;
            });
    },
});

// Export actions
export const { updateUserData, clearError, resetAuthState } = authSlice.actions;

// Export selectors
export const selectUser = (state) => state.auth.user;
export const selectAuthenticated = (state) => state.auth.authenticated;
export const selectAuthLoading = (state) => state.auth.loading;
export const selectLoginLoading = (state) => state.auth.loginLoading;
export const selectSignupLoading = (state) => state.auth.signupLoading;
export const selectCheckingAuth = (state) => state.auth.checkingAuth;
export const selectAuthError = (state) => state.auth.error;

// Export reducer
export default authSlice.reducer;

