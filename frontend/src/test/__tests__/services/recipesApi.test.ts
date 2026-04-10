import { describe, it, expect, beforeEach, vi } from 'vitest';
import { recipesApi } from '../../../services/recipesApi';
import * as apiClient from '../../../utils/apiClient';
import {
  Recipe,
  NewRecipe,
  SearchRecipesResponse,
  RandomRecipesResponse,
  FilterRecipesResponse,
  RecipesFilters,
} from '../../../types';

// Mock apiClient
vi.mock('../../../utils/apiClient', () => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  del: vi.fn(),
}));

describe('recipesApi', () => {
  const mockRecipeId = 'recipe123';
  const mockUserId = 'user456';

  const mockRecipe: Recipe = {
    _id: mockRecipeId,
    title: 'Test Recipe',
    description: 'Test description',
    ingredients: ['ingredient1', 'ingredient2'],
    instructions: ['step1', 'step2'],
    difficulty: 'medium',
    imageUrl: 'image.jpg',
    author: {
      _id: mockUserId,
      username: 'testuser',
      avatar: 'avatar.jpg',
    },
    rating: 4.5,
    ratingCount: 10,
    source: 'user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockRandomRecipesResponse: RandomRecipesResponse = {
    recipes: [mockRecipe],
    totalPages: 5,
    currentPage: 1,
    totalRecipes: 8,
  };

  const mockSearchRecipesResponse: SearchRecipesResponse = {
    recipes: [mockRecipe],
    total: 1,
    page: 1,
    pages: 1,
  };

  const mockFilterRecipesResponse: FilterRecipesResponse = {
    recipes: [mockRecipe],
    pagination: {
      total: 1,
      page: 1,
      limit: 12,
      pages: 1,
    },
  };

  const mockNewRecipe: NewRecipe = {
    title: 'New Recipe',
    description: 'New description',
    ingredients: ['ingredient1'],
    instructions: ['step1'],
    difficulty: 'easy',
    imageUrl: 'image.jpg',
    source: 'user',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRandomRecipes', () => {
    it('should get random recipes with default params', async () => {
      const mockResponse = { success: true, data: mockRandomRecipesResponse };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await recipesApi.getRandomRecipes();

      expect(apiClient.get).toHaveBeenCalledWith('/recipes/random', {
        count: 8,
        page: 1,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should get random recipes with custom params', async () => {
      const mockResponse = { success: true, data: mockRandomRecipesResponse };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await recipesApi.getRandomRecipes(12, 2);

      expect(apiClient.get).toHaveBeenCalledWith('/recipes/random', {
        count: 12,
        page: 2,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('searchRecipesByName', () => {
    it('should search recipes by name', async () => {
      const query = 'pasta';
      const mockResponse = { success: true, data: mockSearchRecipesResponse };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await recipesApi.searchRecipesByName(query);

      expect(apiClient.get).toHaveBeenCalledWith('/recipes/search', {
        q: query,
        page: 1,
        limit: 10,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should search recipes with custom page', async () => {
      const query = 'pasta';
      const page = 2;
      const mockResponse = { success: true, data: mockSearchRecipesResponse };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await recipesApi.searchRecipesByName(query, page);

      expect(apiClient.get).toHaveBeenCalledWith('/recipes/search', {
        q: query,
        page: 2,
        limit: 10,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('filterRecipes', () => {
    it('should filter recipes with default params', async () => {
      const mockResponse = { success: true, data: mockFilterRecipesResponse };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await recipesApi.filterRecipes();

      expect(apiClient.get).toHaveBeenCalledWith('/recipes/filter', {
        page: 1,
        limit: 12,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should filter recipes with filters', async () => {
      const filters: RecipesFilters = {
        difficulty: 'medium',
        maxCookingTime: 30,
        category: 'Italian',
      };
      const mockResponse = { success: true, data: mockFilterRecipesResponse };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await recipesApi.filterRecipes(filters, 2, 20);

      expect(apiClient.get).toHaveBeenCalledWith('/recipes/filter', {
        ...filters,
        page: 2,
        limit: 20,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getRecipeById', () => {
    it('should get recipe by id', async () => {
      const mockResponse = { success: true, data: mockRecipe };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await recipesApi.getRecipeById(mockRecipeId);

      expect(apiClient.get).toHaveBeenCalledWith(`/recipes/${mockRecipeId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getTopRatedRecipes', () => {
    it('should get top rated recipes with default limit', async () => {
      const mockResponse = { success: true, data: [mockRecipe] };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await recipesApi.getTopRatedRecipes();

      expect(apiClient.get).toHaveBeenCalledWith('/recipes/top-rated', { limit: 10 });
      expect(result).toEqual(mockResponse);
    });

    it('should get top rated recipes with custom limit', async () => {
      const mockResponse = { success: true, data: [mockRecipe] };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await recipesApi.getTopRatedRecipes(5);

      expect(apiClient.get).toHaveBeenCalledWith('/recipes/top-rated', { limit: 5 });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getUserRecipes', () => {
    it('should get user recipes', async () => {
      const mockResponse = { success: true, data: [mockRecipe] };
      vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

      const result = await recipesApi.getUserRecipes(mockUserId);

      expect(apiClient.get).toHaveBeenCalledWith(`/recipes/user/${mockUserId}`);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('createRecipe', () => {
    it('should create a new recipe', async () => {
      const mockResponse = { success: true, data: mockRecipe };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const result = await recipesApi.createRecipe(mockNewRecipe);

      expect(apiClient.post).toHaveBeenCalledWith('/recipes', mockNewRecipe);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('updateRecipe', () => {
    it('should update a recipe', async () => {
      const updateData = { title: 'Updated Title' };
      const updatedRecipe = { ...mockRecipe, title: 'Updated Title' };
      const mockResponse = { success: true, data: updatedRecipe };
      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const result = await recipesApi.updateRecipe(mockRecipeId, updateData);

      expect(apiClient.put).toHaveBeenCalledWith(`/recipes/${mockRecipeId}`, updateData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteRecipe', () => {
    it('should delete a recipe', async () => {
      const mockResponse = { success: true, data: { message: 'Recipe deleted successfully' } };
      vi.mocked(apiClient.del).mockResolvedValue(mockResponse);

      const result = await recipesApi.deleteRecipe(mockRecipeId);

      expect(apiClient.del).toHaveBeenCalledWith(`/recipes/${mockRecipeId}`);
      expect(result).toEqual(mockResponse);
    });
  });
});