import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { ratingApi } from '../services/ratingApi';

export interface RatingStats {
  averageRating: number;
  totalRatings: number;
  distribution?: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface UserRating {
  recipeId: string;
  value: number;
  createdAt: string;
}

export interface RatingState {
  stats: Record<string, RatingStats>;  // key: recipeId
  userRatings: Record<string, number>;  // key: recipeId, value: user's rating
  loading: boolean;
  error: string | null;
}

const initialState: RatingState = {
  stats: {},
  userRatings: {},
  loading: false,
  error: null
};

// Async thunks
export const fetchRecipeRating = createAsyncThunk(
  'ratings/fetchRecipeRating',
  async (recipeId: string, { rejectWithValue }) => {
    const response = await ratingApi.getRecipeRating(recipeId);
    if (response.success && response.data) {
      return { recipeId, stats: response.data };
    }
    return rejectWithValue(response.error || 'Failed to fetch rating');
  }
);

export const fetchUserRatings = createAsyncThunk(
  'ratings/fetchUserRatings',
  async (_, { rejectWithValue }) => {
    const response = await ratingApi.getUserRatings();
    if (response.success && response.data) {
      return response.data;
    }
    return rejectWithValue(response.error || 'Failed to fetch ratings');
  }
);

export const rateRecipe = createAsyncThunk(
  'ratings/rateRecipe',
  async ({ recipeId, value }: { recipeId: string; value: number }, { rejectWithValue }) => {
    const response = await ratingApi.rateRecipe(recipeId, value);
    if (response.success && response.data) {
      return {
        recipeId,
        value,
        stats: response.data.stats
      };
    }
    return rejectWithValue(response.error || 'Failed to rate recipe');
  }
);

export const deleteRating = createAsyncThunk(
  'ratings/deleteRating',
  async (recipeId: string, { rejectWithValue }) => {
    const response = await ratingApi.deleteRating(recipeId);
    if (response.success && response.data) {
      return {
        recipeId,
        stats: response.data.stats
      };
    }
    return rejectWithValue(response.error || 'Failed to delete rating');
  }
);

const ratingSlice = createSlice({
  name: 'ratings',
  initialState,
  reducers: {
    clearRatings: (state) => {
      state.stats = {};
      state.userRatings = {};
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchRecipeRating
      .addCase(fetchRecipeRating.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipeRating.fulfilled, (state, action) => {
        state.loading = false;
        state.stats[action.payload.recipeId] = action.payload.stats;
      })
      .addCase(fetchRecipeRating.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // fetchUserRatings
      .addCase(fetchUserRatings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserRatings.fulfilled, (state, action) => {
        state.loading = false;
        state.userRatings = action.payload;
      })
      .addCase(fetchUserRatings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // rateRecipe
      .addCase(rateRecipe.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rateRecipe.fulfilled, (state, action) => {
        state.loading = false;
        state.userRatings[action.payload.recipeId] = action.payload.value;
        state.stats[action.payload.recipeId] = action.payload.stats;
      })
      .addCase(rateRecipe.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // deleteRating
      .addCase(deleteRating.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteRating.fulfilled, (state, action) => {
        state.loading = false;
        // Delete rating from userRatings
        delete state.userRatings[action.payload.recipeId];
        // Update stats
        state.stats[action.payload.recipeId] = action.payload.stats;
      })
      .addCase(deleteRating.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearRatings, clearError } = ratingSlice.actions;
export default ratingSlice.reducer;