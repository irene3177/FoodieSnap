import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { recipesApi } from '../services/recipesApi';

interface FiltersState {
  categories: string[];
  tags: string[];
  areas: string[];
  loading: boolean;
  error: string | null;
  initialized: boolean;
}

const initialState: FiltersState = {
  categories: [],
  tags: [],
  areas: [],
  loading: false,
  error: null,
  initialized: false
};

export const fetchFiltersData = createAsyncThunk(
  'filters/fetchData',
  async () => {
    const [categoriesRes, tagsRes, areasRes] = await Promise.all([
      recipesApi.getCategories(),
      recipesApi.getTags(),
      recipesApi.getAreas()
    ]);

    return {
      categories: categoriesRes.data || [],
      tags: tagsRes.data || [],
      areas: areasRes.data || []
    };
  }
);

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFiltersData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFiltersData.fulfilled, (state, action) => {
        state.categories = action.payload.categories;
        state.tags = action.payload.tags;
        state.areas = action.payload.areas;
        state.loading = false;
        state.initialized = true;
      })
      .addCase(fetchFiltersData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load filters';
      });
  }
});

export default filtersSlice.reducer;