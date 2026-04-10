import { describe, it, expect, beforeEach, vi } from 'vitest';
import { favoritesApi } from '../../../services/favoritesApi';
import * as apiClient from '../../../utils/apiClient';
import { 
  FavoriteActionResponse, 
  CheckFavoriteData, 
  ReorderResponse, 
  ClearAllResponse,
  Recipe 
} from '../../../types';

// Mock apiClient
vi.mock('../../../utils/apiClient', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

describe('favoritesApi', () => {
  const mockRecipeId = 'recipe123';
  const mockRecipe: Recipe = {
    _id: mockRecipeId,
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

  const mockFavoriteActionResponse: FavoriteActionResponse = {
    recipeId: mockRecipeId,
    isFavorite: true,
    favoritesCount: 5,
  };

  const mockCheckFavoriteData: CheckFavoriteData = {
    recipeId: mockRecipeId,
    isFavorite: true,
    favoritesCount: 5,
  };

  const mockReorderResponse: ReorderResponse = {
    message: 'Favorites reordered successfully',
    favorites: [mockRecipe],
  };

  const mockClearAllResponse: ClearAllResponse = {
    message: 'All favorites cleared',
    favoritesCount: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFavorites', () => {
    it('should get all favorites', async () => {
      const mockResponse = { success: true, data: [mockRecipe] };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await favoritesApi.getFavorites();

      expect(apiClient.get).toHaveBeenCalledWith('/favorites');
      expect(result).toEqual(mockResponse);
    });

    it('should handle error when getting favorites', async () => {
      const mockError = { success: false, error: 'Failed to fetch favorites' };
      vi.mocked(apiClient.get).mockResolvedValue(mockError);

      const result = await favoritesApi.getFavorites();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch favorites');
    });
  });

  describe('addFavorite', () => {
    it('should add recipe to favorites', async () => {
      const mockResponse = { success: true, data: mockFavoriteActionResponse };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await favoritesApi.addFavorite(mockRecipeId);

      expect(apiClient.post).toHaveBeenCalledWith(`/favorites/${mockRecipeId}`);
      expect(result).toEqual(mockResponse);
    });

    it('should handle error when adding favorite', async () => {
      const mockError = { success: false, error: 'Recipe not found' };
      vi.mocked(apiClient.post).mockResolvedValue(mockError);

      const result = await favoritesApi.addFavorite(mockRecipeId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Recipe not found');
    });
  });

  describe('removeFavorite', () => {
    it('should remove recipe from favorites', async () => {
      const mockResponse = { success: true, data: mockFavoriteActionResponse };
      vi.mocked(apiClient.del).mockResolvedValue(mockResponse);

      const result = await favoritesApi.removeFavorite(mockRecipeId);

      expect(apiClient.del).toHaveBeenCalledWith(`/favorites/${mockRecipeId}`);
      expect(result).toEqual(mockResponse);
    });

    it('should handle error when removing favorite', async () => {
      const mockError = { success: false, error: 'Favorite not found' };
      vi.mocked(apiClient.del).mockResolvedValue(mockError);

      const result = await favoritesApi.removeFavorite(mockRecipeId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Favorite not found');
    });
  });

  describe('checkFavorite', () => {
    it('should check if recipe is favorite', async () => {
      const mockResponse = { success: true, data: mockCheckFavoriteData };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await favoritesApi.checkFavorite(mockRecipeId);

      expect(apiClient.get).toHaveBeenCalledWith(`/favorites/${mockRecipeId}/check`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('clearAllFavorites', () => {
    it('should clear all favorites', async () => {
      const mockResponse = { success: true, data: mockClearAllResponse };
      vi.mocked(apiClient.del).mockResolvedValue(mockResponse);

      const result = await favoritesApi.clearAllFavorites();

      expect(apiClient.del).toHaveBeenCalledWith('/favorites');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('reorderFavorites', () => {
    it('should reorder favorites with string ids', async () => {
      const reorderedIds = ['recipe1', 'recipe2', 'recipe3'];
      const mockResponse = { success: true, data: mockReorderResponse };
      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const result = await favoritesApi.reorderFavorites(reorderedIds);

      expect(apiClient.put).toHaveBeenCalledWith('/favorites/reorder', { reorderedIds });
      expect(result).toEqual(mockResponse);
    });

    it('should reorder favorites with number ids', async () => {
      const reorderedIds = [1, 2, 3];
      const mockResponse = { success: true, data: mockReorderResponse };
      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const result = await favoritesApi.reorderFavorites(reorderedIds);

      expect(apiClient.put).toHaveBeenCalledWith('/favorites/reorder', { reorderedIds });
      expect(result).toEqual(mockResponse);
    });

    it('should handle error when reordering favorites', async () => {
      const reorderedIds = ['recipe1', 'recipe2'];
      const mockError = { success: false, error: 'Invalid order' };
      vi.mocked(apiClient.put).mockResolvedValue(mockError);

      const result = await favoritesApi.reorderFavorites(reorderedIds);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid order');
    });
  });
});