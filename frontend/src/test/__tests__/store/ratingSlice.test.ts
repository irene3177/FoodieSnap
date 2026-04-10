import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import ratingReducer, {
  fetchRecipeRating,
  fetchUserRatings,
  rateRecipe,
  deleteRating,
  clearRatings,
  clearError
} from '../../../store/ratingSlice';
import { ratingApi } from '../../../services/ratingApi';

// Mock ratingApi
vi.mock('../../../services/ratingApi', () => ({
  ratingApi: {
    getRecipeRating: vi.fn(),
    getUserRatings: vi.fn(),
    rateRecipe: vi.fn(),
    deleteRating: vi.fn(),
  },
}));

interface RootState {
  ratings: ReturnType<typeof ratingReducer>;
}

describe('ratingSlice', () => {
  const mockRecipeId = 'recipe123';
  
  const mockRatingStats = {
    averageRating: 4.5,
    totalRatings: 10,
    distribution: {
      1: 1,
      2: 0,
      3: 2,
      4: 3,
      5: 4,
    },
  };

  const mockUserRatings = {
    [mockRecipeId]: 5,
    'recipe456': 4,
  };

  let store: ReturnType<typeof configureStore<RootState>>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({
      reducer: { ratings: ratingReducer },
    });
  });

  it('should return initial state', () => {
    const state = store.getState().ratings;
    expect(state.stats).toEqual({});
    expect(state.userRatings).toEqual({});
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should clear ratings', () => {
    // First add some data
    store.dispatch({ type: fetchRecipeRating.fulfilled.type, payload: { recipeId: mockRecipeId, stats: mockRatingStats } });
    expect(store.getState().ratings.stats).not.toEqual({});
    
    // Then clear
    store.dispatch(clearRatings());
    expect(store.getState().ratings.stats).toEqual({});
    expect(store.getState().ratings.userRatings).toEqual({});
  });

  it('should clear error', () => {
    // First set an error
    store.dispatch({ type: fetchRecipeRating.rejected.type, payload: 'Some error' });
    expect(store.getState().ratings.error).toBe('Some error');
    
    // Then clear
    store.dispatch(clearError());
    expect(store.getState().ratings.error).toBeNull();
  });

  describe('fetchRecipeRating', () => {
    it('should handle fetch fulfilled', async () => {
      const mockResponse = { success: true, data: mockRatingStats };
      vi.mocked(ratingApi.getRecipeRating).mockResolvedValue(mockResponse);

      await store.dispatch(fetchRecipeRating(mockRecipeId));
      
      const state = store.getState().ratings;
      expect(state.loading).toBe(false);
      expect(state.stats[mockRecipeId]).toEqual(mockRatingStats);
    });

    it('should handle fetch rejected', async () => {
      const mockResponse = { success: false, error: 'Failed to fetch' };
      vi.mocked(ratingApi.getRecipeRating).mockResolvedValue(mockResponse);

      await store.dispatch(fetchRecipeRating(mockRecipeId));
      
      const state = store.getState().ratings;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to fetch');
    });
  });

  describe('fetchUserRatings', () => {
    it('should handle fetch user ratings fulfilled', async () => {
      const mockResponse = { success: true, data: mockUserRatings };
      vi.mocked(ratingApi.getUserRatings).mockResolvedValue(mockResponse);

      await store.dispatch(fetchUserRatings());
      
      const state = store.getState().ratings;
      expect(state.loading).toBe(false);
      expect(state.userRatings).toEqual(mockUserRatings);
    });

    it('should handle fetch user ratings rejected', async () => {
      const mockResponse = { success: false, error: 'Failed to fetch ratings' };
      vi.mocked(ratingApi.getUserRatings).mockResolvedValue(mockResponse);

      await store.dispatch(fetchUserRatings());
      
      const state = store.getState().ratings;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to fetch ratings');
    });
  });

  describe('rateRecipe', () => {
    it('should handle rate recipe fulfilled', async () => {
      const mockResponse = { 
        success: true, 
        data: { 
          recipeId: mockRecipeId, 
          value: 5, 
          stats: mockRatingStats 
        } 
      };
      vi.mocked(ratingApi.rateRecipe).mockResolvedValue(mockResponse);

      await store.dispatch(rateRecipe({ recipeId: mockRecipeId, value: 5 }));
      
      const state = store.getState().ratings;
      expect(state.loading).toBe(false);
      expect(state.userRatings[mockRecipeId]).toBe(5);
      expect(state.stats[mockRecipeId]).toEqual(mockRatingStats);
    });

    it('should handle rate recipe rejected', async () => {
      const mockResponse = { success: false, error: 'Failed to rate' };
      vi.mocked(ratingApi.rateRecipe).mockResolvedValue(mockResponse);

      await store.dispatch(rateRecipe({ recipeId: mockRecipeId, value: 5 }));
      
      const state = store.getState().ratings;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to rate');
    });
  });

  describe('deleteRating', () => {
    it('should handle delete rating fulfilled', async () => {
      // First add a user rating
      store.dispatch({ type: fetchUserRatings.fulfilled.type, payload: mockUserRatings });
      store.dispatch({ type: fetchRecipeRating.fulfilled.type, payload: { recipeId: mockRecipeId, stats: mockRatingStats } });
      
      const mockResponse = { 
        success: true, 
        data: { 
          recipeId: mockRecipeId, 
          stats: { averageRating: 0, totalRatings: 0 } 
        } 
      };
      vi.mocked(ratingApi.deleteRating).mockResolvedValue(mockResponse);

      await store.dispatch(deleteRating(mockRecipeId));
      
      const state = store.getState().ratings;
      expect(state.loading).toBe(false);
      expect(state.userRatings[mockRecipeId]).toBeUndefined();
    });

    it('should handle delete rating rejected', async () => {
      const mockResponse = { success: false, error: 'Failed to delete' };
      vi.mocked(ratingApi.deleteRating).mockResolvedValue(mockResponse);

      await store.dispatch(deleteRating(mockRecipeId));
      
      const state = store.getState().ratings;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to delete');
    });
  });
});