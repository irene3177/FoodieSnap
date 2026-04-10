import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ratingApi } from '../../../services/ratingApi';
import * as apiClient from '../../../utils/apiClient';
import { RatingStats } from '../../../store/ratingSlice';
import { RatingResponse, DeleteRatingResponse } from '../../../types';

// Mock apiClient
vi.mock('../../../utils/apiClient', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

describe('ratingApi', () => {
  const mockRecipeId = 'recipe123';
  const mockRatingValue = 5;

  const mockRatingStats: RatingStats = {
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

  const mockUserRatings: Record<string, number> = {
    [mockRecipeId]: 5,
    'recipe789': 4,
    'recipe101': 3,
  };

  const mockRatingResponse: RatingResponse = {
    recipeId: mockRecipeId,
    value: mockRatingValue,
    stats: mockRatingStats,
  };

  const mockDeleteRatingResponse: DeleteRatingResponse = {
    recipeId: mockRecipeId,
    stats: mockRatingStats,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRecipeRating', () => {
    it('should get rating stats for a recipe', async () => {
      const mockResponse = { success: true, data: mockRatingStats };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await ratingApi.getRecipeRating(mockRecipeId);

      expect(apiClient.get).toHaveBeenCalledWith(`/ratings/recipe/${mockRecipeId}`);
      expect(result).toEqual(mockResponse);
    });

    it('should handle error when getting rating stats', async () => {
      const mockError = { success: false, error: 'Recipe not found' };
      vi.mocked(apiClient.get).mockResolvedValue(mockError);

      const result = await ratingApi.getRecipeRating(mockRecipeId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Recipe not found');
    });
  });

  describe('getUserRatings', () => {
    it('should get all ratings by current user', async () => {
      const mockResponse = { success: true, data: mockUserRatings };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await ratingApi.getUserRatings();

      expect(apiClient.get).toHaveBeenCalledWith('/ratings/user');
      expect(result).toEqual(mockResponse);
    });

    it('should handle empty user ratings', async () => {
      const mockResponse = { success: true, data: {} };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await ratingApi.getUserRatings();

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });
  });

  describe('rateRecipe', () => {
    it('should rate a recipe', async () => {
      const mockResponse = { success: true, data: mockRatingResponse };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await ratingApi.rateRecipe(mockRecipeId, mockRatingValue);

      expect(apiClient.post).toHaveBeenCalledWith(`/ratings/recipe/${mockRecipeId}`, { value: mockRatingValue });
      expect(result).toEqual(mockResponse);
    });

    it('should handle invalid rating value', async () => {
      const invalidRating = 6;
      const mockError = { success: false, error: 'Rating must be between 1 and 5' };
      vi.mocked(apiClient.post).mockResolvedValue(mockError);

      const result = await ratingApi.rateRecipe(mockRecipeId, invalidRating);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rating must be between 1 and 5');
    });
  });

  describe('updateRating', () => {
    it('should update a rating', async () => {
      const updatedRating = 4;
      const updatedRatingResponse = { ...mockRatingResponse, value: updatedRating };
      const mockResponse = { success: true, data: updatedRatingResponse };
      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const result = await ratingApi.updateRating(mockRecipeId, updatedRating);

      expect(apiClient.put).toHaveBeenCalledWith(`/ratings/recipe/${mockRecipeId}`, { value: updatedRating });
      expect(result).toEqual(mockResponse);
    });

    it('should handle error when updating rating', async () => {
      const mockError = { success: false, error: 'Rating not found' };
      vi.mocked(apiClient.put).mockResolvedValue(mockError);

      const result = await ratingApi.updateRating(mockRecipeId, mockRatingValue);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rating not found');
    });
  });

  describe('deleteRating', () => {
    it('should delete a rating', async () => {
      const mockResponse = { success: true, data: mockDeleteRatingResponse };
      vi.mocked(apiClient.del).mockResolvedValue(mockResponse);

      const result = await ratingApi.deleteRating(mockRecipeId);

      expect(apiClient.del).toHaveBeenCalledWith(`/ratings/recipe/${mockRecipeId}`);
      expect(result).toEqual(mockResponse);
    });

    it('should handle error when deleting rating', async () => {
      const mockError = { success: false, error: 'Rating not found' };
      vi.mocked(apiClient.del).mockResolvedValue(mockError);

      const result = await ratingApi.deleteRating(mockRecipeId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Rating not found');
    });
  });
});