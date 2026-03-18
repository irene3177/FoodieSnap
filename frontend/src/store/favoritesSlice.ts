import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Recipe } from '../types';
import { favoritesApi } from '../services/favoritesApi';

interface FavoritesState {
  items: Recipe[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: FavoritesState = {
  items: [],
  loading: false,
  error: null,
  initialized: false
};

// Async thunks
export const fetchFavorites = createAsyncThunk(
  'favorites/fetchFavorites',
  async(_, { rejectWithValue }) => {
    const response = await favoritesApi.getFavorites();
    if (response.success && response.data) {
      return response.data;
    }
    return rejectWithValue(response.error || 'Failed to fetch favorites');
  }
);

export const addToFavorites = createAsyncThunk(
  'favorites/addToFavorites',
  async (recipe: Recipe, { rejectWithValue, dispatch }) => {
    const response = await favoritesApi.addFavorite(recipe._id);
    if (response.success) {
      dispatch(fetchFavorites());
      return recipe;
    }
    return rejectWithValue(response.error || 'Failed to add to favorites');
  }
);

export const removeFromFavorites = createAsyncThunk(
  'favorites/removeFromFavorites',
  async (recipeId: string, { rejectWithValue, dispatch }) => {
    const response = await favoritesApi.removeFavorite(recipeId);
    if (response.success) {
      dispatch(fetchFavorites());
      return recipeId;
    }
    return rejectWithValue(response.error || 'Failed to remove from favorites');
  }
);

export const reorderFavorites = createAsyncThunk(
  'favorites/reorderFavorites',
  async (reorderedItems: Recipe[], { rejectWithValue, dispatch }) => {
    const reorderedIds = reorderedItems.map(recipe => recipe._id);

    const response = await favoritesApi.reorderFavorites(reorderedIds);

    if (response.success && response.data) {
      dispatch(setFavoritesOrder(reorderedItems));
      return response.data.favorites;
    }
    return rejectWithValue(response.error || 'Failed to reorder favorites');
  }
);

export const clearAllFavorites = createAsyncThunk(
  'favorites/clearAllFavorites',
  async (_, { rejectWithValue, dispatch }) => {
    const response = await favoritesApi.clearAllFavorites();
    if (response.success) {
      dispatch(clearFavorites());
      return response.data;
    }
    return rejectWithValue(response.error || 'Failed to clear favorites');
  }
);

const favoritesSlice = createSlice({
  name: 'favorites',
  initialState,
  reducers: {
    clearFavorites: (state) => {
      state.items = [];
      state.initialized = false;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setFavoritesOrder: (state, action: PayloadAction<Recipe[]>) => {
      state.items = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchFavorites
      .addCase(fetchFavorites.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.initialized = true;
      })
      .addCase(fetchFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.initialized = true;
      })

      // addToFavorites
      .addCase(addToFavorites.pending, (state) => {
        state.loading = true;
      })
      .addCase(addToFavorites.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addToFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // removeFromFavorites
      .addCase(removeFromFavorites.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeFromFavorites.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(removeFromFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // reorderFavorites
      .addCase(reorderFavorites.pending, (state) => {
        state.loading = true;
      })
      .addCase(reorderFavorites.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(reorderFavorites.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearFavorites, setError, setFavoritesOrder } = favoritesSlice.actions;
export default favoritesSlice.reducer;