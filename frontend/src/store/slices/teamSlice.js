import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Initial state
const initialState = {
    teams: [],
    myTeams: [],
    currentTeam: null,
    loading: false,
    error: null,
    createLoading: false,
};

// Async thunks

/**
 * Fetch all teams
 */
export const fetchTeams = createAsyncThunk(
    'teams/fetchTeams',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/teams');
            return response.data.teams || [];
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch teams');
        }
    }
);

/**
 * Fetch manager's teams
 */
export const fetchMyTeams = createAsyncThunk(
    'teams/fetchMyTeams',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/manager/my-teams');
            return response.data.teams || [];
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch your teams');
        }
    }
);

/**
 * Create new team
 */
export const createTeam = createAsyncThunk(
    'teams/createTeam',
    async (teamData, { rejectWithValue }) => {
        try {
            const response = await api.post('/manager/create-team', teamData);
            return response.data.team;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to create team');
        }
    }
);

/**
 * Join team (Player)
 */
export const joinTeam = createAsyncThunk(
    'teams/joinTeam',
    async (teamId, { rejectWithValue }) => {
        try {
            const response = await api.post(`/player/teams/${teamId}/join`);
            return { teamId, message: response.data.message };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to join team');
        }
    }
);

/**
 * Leave team (Player)
 */
export const leaveTeam = createAsyncThunk(
    'teams/leaveTeam',
    async (teamId, { rejectWithValue }) => {
        try {
            const response = await api.post(`/player/teams/${teamId}/leave`);
            return { teamId, message: response.data.message };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Failed to leave team');
        }
    }
);

// Team slice
const teamSlice = createSlice({
    name: 'teams',
    initialState,
    reducers: {
        clearCurrentTeam: (state) => {
            state.currentTeam = null;
        },
        clearTeamError: (state) => {
            state.error = null;
        },
        resetTeamState: (state) => {
            return initialState;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Teams
            .addCase(fetchTeams.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTeams.fulfilled, (state, action) => {
                state.loading = false;
                state.teams = action.payload;
                state.error = null;
            })
            .addCase(fetchTeams.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch My Teams
            .addCase(fetchMyTeams.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMyTeams.fulfilled, (state, action) => {
                state.loading = false;
                state.myTeams = action.payload;
                state.error = null;
            })
            .addCase(fetchMyTeams.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Create Team
            .addCase(createTeam.pending, (state) => {
                state.createLoading = true;
                state.error = null;
            })
            .addCase(createTeam.fulfilled, (state, action) => {
                state.createLoading = false;
                state.myTeams.push(action.payload);
                state.teams.push(action.payload);
                state.error = null;
            })
            .addCase(createTeam.rejected, (state, action) => {
                state.createLoading = false;
                state.error = action.payload;
            })

            // Join Team
            .addCase(joinTeam.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(joinTeam.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(joinTeam.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Leave Team
            .addCase(leaveTeam.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(leaveTeam.fulfilled, (state) => {
                state.loading = false;
                state.error = null;
            })
            .addCase(leaveTeam.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

// Export actions
export const { clearCurrentTeam, clearTeamError, resetTeamState } = teamSlice.actions;

// Export selectors
export const selectAllTeams = (state) => state.teams.teams;
export const selectMyTeams = (state) => state.teams.myTeams;
export const selectCurrentTeam = (state) => state.teams.currentTeam;
export const selectTeamLoading = (state) => state.teams.loading;
export const selectCreateTeamLoading = (state) => state.teams.createLoading;
export const selectTeamError = (state) => state.teams.error;

// Export reducer
export default teamSlice.reducer;

