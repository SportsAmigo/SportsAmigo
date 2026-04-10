import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Initial state
const initialState = {
    events: [],
    currentEvent: null,
    myEvents: [],
    loading: false,
    error: null,
    createLoading: false,
    updateLoading: false,
    deleteLoading: false,
};

// Async thunks

/**
 * Fetch all events
 */
export const fetchEvents = createAsyncThunk(
    'events/fetchEvents',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/events');
            return response.data.events || [];
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch events');
        }
    }
);

/**
 * Fetch event by ID
 */
export const fetchEventById = createAsyncThunk(
    'events/fetchEventById',
    async (eventId, { rejectWithValue }) => {
        try {
            const response = await api.get(`/events/${eventId}`);
            return response.data.event || null;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch event');
        }
    }
);

/**
 * Fetch organizer's events
 */
export const fetchMyEvents = createAsyncThunk(
    'events/fetchMyEvents',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/organizer/my-events');
            return response.data.events || [];
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch your events');
        }
    }
);

/**
 * Create new event
 */
export const createEvent = createAsyncThunk(
    'events/createEvent',
    async (eventData, { rejectWithValue }) => {
        try {
            const response = await api.post('/organizer/create-event', eventData);
            return response.data.event;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create event');
        }
    }
);

/**
 * Update event
 */
export const updateEvent = createAsyncThunk(
    'events/updateEvent',
    async ({ eventId, eventData }, { rejectWithValue }) => {
        try {
            const response = await api.put(`/organizer/events/${eventId}`, eventData);
            return response.data.event;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update event');
        }
    }
);

/**
 * Delete event
 */
export const deleteEvent = createAsyncThunk(
    'events/deleteEvent',
    async (eventId, { rejectWithValue }) => {
        try {
            await api.delete(`/organizer/events/${eventId}`);
            return eventId;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to delete event');
        }
    }
);

/**
 * Register for event 
 */
export const registerForEvent = createAsyncThunk(
    'events/registerForEvent',
    async (eventId, { rejectWithValue }) => {
        try {
            const response = await api.post(`/player/events/${eventId}/register`);
            return { eventId, message: response.data.message };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to register for event');
        }
    }
);

// Event slice
const eventSlice = createSlice({
    name: 'events',
    initialState,
    reducers: {
        clearCurrentEvent: (state) => {
            state.currentEvent = null;
        },
        clearEventError: (state) => {
            state.error = null;
        },
        resetEventState: (state) => {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Events
            .addCase(fetchEvents.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEvents.fulfilled, (state, action) => {
                state.loading = false;
                state.events = action.payload;
                state.error = null;
            })
            .addCase(fetchEvents.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch Event By ID
            .addCase(fetchEventById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchEventById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentEvent = action.payload;
                state.error = null;
            })
            .addCase(fetchEventById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch My Events
            .addCase(fetchMyEvents.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyEvents.fulfilled, (state, action) => {
                state.loading = false;
                state.myEvents = action.payload;
                state.error = null;
            })
            .addCase(fetchMyEvents.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create Event
            .addCase(createEvent.pending, (state) => {
                state.createLoading = true;
                state.error = null;
            })
            .addCase(createEvent.fulfilled, (state, action) => {
                state.createLoading = false;
                state.myEvents.push(action.payload);
                state.events.push(action.payload);
                state.error = null;
            })
            .addCase(createEvent.rejected, (state, action) => {
                state.createLoading = false;
                state.error = action.payload;
            })

            // Update Event
            .addCase(updateEvent.pending, (state) => {
                state.updateLoading = true;
                state.error = null;
            })
            .addCase(updateEvent.fulfilled, (state, action) => {
                state.updateLoading = false;
                const index = state.myEvents.findIndex(e => e._id === action.payload._id);
                if (index !== -1) {
                    state.myEvents[index] = action.payload;
                }
                const eventIndex = state.events.findIndex(e => e._id === action.payload._id);
                if (eventIndex !== -1) {
                    state.events[eventIndex] = action.payload;
                }
                if (state.currentEvent?._id === action.payload._id) {
                    state.currentEvent = action.payload;
                }
                state.error = null;
            })
            .addCase(updateEvent.rejected, (state, action) => {
                state.updateLoading = false;
                state.error = action.payload;
            })

            // Delete Event
            .addCase(deleteEvent.pending, (state) => {
                state.deleteLoading = true;
                state.error = null;
            })
            .addCase(deleteEvent.fulfilled, (state, action) => {
                state.deleteLoading = false;
                state.myEvents = state.myEvents.filter(e => e._id !== action.payload);
                state.events = state.events.filter(e => e._id !== action.payload);
                state.error = null;
            })
            .addCase(deleteEvent.rejected, (state, action) => {
                state.deleteLoading = false;
                state.error = action.payload;
            })

            // Register for Event
            .addCase(registerForEvent.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(registerForEvent.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(registerForEvent.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

// Export actions
export const { clearCurrentEvent, clearEventError, resetEventState } = eventSlice.actions;

// Export selectors
export const selectAllEvents = (state) => state.events.events;
export const selectCurrentEvent = (state) => state.events.currentEvent;
export const selectMyEvents = (state) => state.events.myEvents;
export const selectEventLoading = (state) => state.events.loading;
export const selectCreateLoading = (state) => state.events.createLoading;
export const selectUpdateLoading = (state) => state.events.updateLoading;
export const selectDeleteLoading = (state) => state.events.deleteLoading;
export const selectEventError = (state) => state.events.error;

// Export reducer
export default eventSlice.reducer;

