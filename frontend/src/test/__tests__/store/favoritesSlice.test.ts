import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import favoritesReducer, {
  fetchFavorites,
  addToFavorites,
  removeFromFavorites,
  reorderFavorites,
  clearAllFavorites,
  clearFavorites,
  setError,
  setFavoritesOrder,
} from '../../../store/favoritesSlice';
import { favoritesApi } from '../../../services/favoritesApi';
import { Recipe } from '../../../types';

// Mock favoritesApi
vi.mock('../../../services/favoritesApi', () => ({
  favoritesApi: {
    getFavorites: vi.fn(),
    addFavorite: vi.fn(),
    removeFavorite: vi.fn(),
    reorderFavorites: vi.fn(),
    clearAllFavorites: vi.fn(),
  },
}));

interface RootState {
  favorites: ReturnType<typeof favoritesReducer>;
}

describe('favoritesSlice', () => {
  const mockRecipe: Recipe = {
    _id: 'recipe123',
    title: 'Test Recipe',
    description: 'Test description',
    ingredients: ['ingredient1'],
    instructions: ['step1'],
    difficulty: 'medium',
    imageUrl: 'image.jpg',
    author: {
      _id: 'user123',
      username: 'testuser',
      avatar: 'avatar.jpg',
    },
    rating: 4.5,
    ratingCount: 10,
    source: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockRecipes: Recipe[] = [mockRecipe];

  let store: ReturnType<typeof configureStore<RootState>>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({
      reducer: { favorites: favoritesReducer },
    });
  });

  it('should return initial state', () => {
    const state = store.getState().favorites;
    expect(state.items).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.initialized).toBe(false);
  });

  it('should clear favorites', () => {
    store.dispatch(setFavoritesOrder(mockRecipes));
    expect(store.getState().favorites.items).toEqual(mockRecipes);
    
    store.dispatch(clearFavorites());
    expect(store.getState().favorites.items).toEqual([]);
    expect(store.getState().favorites.initialized).toBe(false);
  });

  it('should set error', () => {
    store.dispatch(setError('Something went wrong'));
    expect(store.getState().favorites.error).toBe('Something went wrong');
    
    store.dispatch(setError(null));
    expect(store.getState().favorites.error).toBeNull();
  });

  it('should set favorites order', () => {
    store.dispatch(setFavoritesOrder(mockRecipes));
    expect(store.getState().favorites.items).toEqual(mockRecipes);
  });

  describe('fetchFavorites', () => {
    it('should handle fetch fulfilled', async () => {
      const mockResponse = { success: true, data: mockRecipes };
      vi.mocked(favoritesApi.getFavorites).mockResolvedValue(mockResponse);

      await store.dispatch(fetchFavorites());
      
      const state = store.getState().favorites;
      expect(state.loading).toBe(false);
      expect(state.items).toEqual(mockRecipes);
      expect(state.initialized).toBe(true);
    });

    it('should handle fetch rejected', async () => {
      const mockResponse = { success: false, error: 'Failed to fetch' };
      vi.mocked(favoritesApi.getFavorites).mockResolvedValue(mockResponse);

      await store.dispatch(fetchFavorites());
      
      const state = store.getState().favorites;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to fetch');
      expect(state.initialized).toBe(true);
    });
  });

  describe('addToFavorites', () => {
    it('should handle add to favorites fulfilled', async () => {
      const mockResponse = { success: true, data: { recipeId: mockRecipe._id, isFavorite: true, favoritesCount: 1 } };
      vi.mocked(favoritesApi.addFavorite).mockResolvedValue(mockResponse);
      vi.mocked(favoritesApi.getFavorites).mockResolvedValue({ success: true, data: mockRecipes });

      await store.dispatch(addToFavorites(mockRecipe));
      
      const state = store.getState().favorites;
      expect(state.loading).toBe(false);
    });

    it('should handle add to favorites rejected', async () => {
      const mockResponse = { success: false, error: 'Failed to add' };
      vi.mocked(favoritesApi.addFavorite).mockResolvedValue(mockResponse);

      await store.dispatch(addToFavorites(mockRecipe));
      
      const state = store.getState().favorites;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to add');
    });
  });

  describe('removeFromFavorites', () => {
    it('should handle remove from favorites fulfilled', async () => {
      const mockResponse = { success: true, data: { recipeId: mockRecipe._id, isFavorite: false, favoritesCount: 0 } };
      vi.mocked(favoritesApi.removeFavorite).mockResolvedValue(mockResponse);
      vi.mocked(favoritesApi.getFavorites).mockResolvedValue({ success: true, data: [] });

      await store.dispatch(removeFromFavorites(mockRecipe._id));
      
      const state = store.getState().favorites;
      expect(state.loading).toBe(false);
    });

    it('should handle remove from favorites rejected', async () => {
      const mockResponse = { success: false, error: 'Failed to remove' };
      vi.mocked(favoritesApi.removeFavorite).mockResolvedValue(mockResponse);

      await store.dispatch(removeFromFavorites(mockRecipe._id));
      
      const state = store.getState().favorites;
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to remove');
    });
  });

  describe('reorderFavorites', () => {
    it('should handle reorder favorites fulfilled', async () => {
      const mockResponse = { success: true, data: { message: 'Reordered', favorites: mockRecipes } };
      vi.mocked(favoritesApi.reorderFavorites).mockResolvedValue(mockResponse);

      await store.dispatch(reorderFavorites(mockRecipes));
      
      const state = store.getState().favorites;
      expect(state.loading).toBe(false);
      expect(state.items).toEqual(mockRecipes);
    });
  });

  describe('clearAllFavorites', () => {
    it('should handle clear all favorites fulfilled', async () => {
      const mockResponse = { success: true, data: { message: 'Cleared', favoritesCount: 0 } };
      vi.mocked(favoritesApi.clearAllFavorites).mockResolvedValue(mockResponse);

      await store.dispatch(clearAllFavorites());
      
      const state = store.getState().favorites;
      expect(state.loading).toBe(false);
    });
  });
});