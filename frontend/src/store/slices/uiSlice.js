import { createSlice } from '@reduxjs/toolkit';

// Initial state
const initialState = {
    sidebarOpen: false,
    modalOpen: false,
    modalContent: null,
    toasts: [],
    globalLoading: false,
};

// UI slice
const uiSlice = createSlice({
    name: 'ui',
    initialState,
    reducers: {
        toggleSidebar: (state) => {
            state.sidebarOpen = !state.sidebarOpen;
        },
        openSidebar: (state) => {
            state.sidebarOpen = true;
        },
        closeSidebar: (state) => {
            state.sidebarOpen = false;
        },
        openModal: (state, action) => {
            state.modalOpen = true;
            state.modalContent = action.payload;
        },
        closeModal: (state) => {
            state.modalOpen = false;
            state.modalContent = null;
        },
        addToast: (state, action) => {
            const toast = {
                id: Date.now(),
                message: action.payload.message,
                type: action.payload.type || 'info', // success, error, warning, info
                duration: action.payload.duration || 3000,
            };
            state.toasts.push(toast);
        },
        removeToast: (state, action) => {
            state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
        },
        clearToasts: (state) => {
            state.toasts = [];
        },
        setGlobalLoading: (state, action) => {
            state.globalLoading = action.payload;
        },
    },
});

// Export actions
export const {
    toggleSidebar,
    openSidebar,
    closeSidebar,
    openModal,
    closeModal,
    addToast,
    removeToast,
    clearToasts,
    setGlobalLoading,
} = uiSlice.actions;

// Export selectors
export const selectSidebarOpen = (state) => state.ui.sidebarOpen;
export const selectModalOpen = (state) => state.ui.modalOpen;
export const selectModalContent = (state) => state.ui.modalContent;
export const selectToasts = (state) => state.ui.toasts;
export const selectGlobalLoading = (state) => state.ui.globalLoading;

// Export reducer
export default uiSlice.reducer;

