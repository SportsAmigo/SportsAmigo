import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage
import { combineReducers } from '@reduxjs/toolkit';

// Import reducers
import authReducer from './slices/authSlice';
import eventReducer from './slices/eventSlice';
import teamReducer from './slices/teamSlice';
import walletReducer from './slices/walletSlice';
import uiReducer from './slices/uiSlice';

// Persist configuration
const persistConfig = {
    key: 'sportsamigo-root',
    version: 1,
    storage,
    whitelist: ['auth'], // Only persist auth state
    blacklist: ['ui'], // Don't persist UI state
};

// Combine all reducers
const rootReducer = combineReducers({
    auth: authReducer,
    events: eventReducer,
    teams: teamReducer,
    wallet: walletReducer,
    ui: uiReducer,
});

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types for redux-persist
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
            },
        }),
    devTools: process.env.NODE_ENV !== 'production', // Enable Redux DevTools in development
});

// Create persistor
export const persistor = persistStore(store);

// Export types for TypeScript (optional, but good practice)
export default store;

