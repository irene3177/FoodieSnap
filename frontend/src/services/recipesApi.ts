import  { get, post, put, del } from '../utils/apiClient';
import {
  Recipe,
  NewRecipe,
  SearchRecipesResponse,
  RandomRecipesResponse,
  FilterRecipesResponse,
  RecipesFilters,
  ApiResponse
} from '../types';

export const recipesApi = {
  // Get random recipes (TheMealDB)
  getRandomRecipes: async (
    count = 8,
    page: number = 1
  ): Promise<ApiResponse<RandomRecipesResponse>> => {
    return get<RandomRecipesResponse>('/recipes/random', {
      count,
      page
    });
  },

  // Search recipe by name (TheMealDB)
  searchRecipesByName: async (
    query: string,
    page: number = 1
  ): Promise<ApiResponse<SearchRecipesResponse>> => {
    return get<SearchRecipesResponse>('/recipes/search', {
      q: query,
      page,
      limit: 10
    });
  },

  // Get recipes with filters and sorting (MongoDB)
  filterRecipes: async (
    filters?: RecipesFilters,
    page: number = 1,
    limit: number = 12
  ): Promise<ApiResponse<FilterRecipesResponse>> => {
    return get<FilterRecipesResponse>('/recipes/filter', {
      ...filters,
      page,
      limit
    });
  },

  // Get recipe by ID
  getRecipeById: async (id: string): Promise<ApiResponse<Recipe>> => {
    return get<Recipe>(`/recipes/${id}`);
  },
  
  // Get top rated recipes
  getTopRatedRecipes: async (limit = 10): Promise<ApiResponse<Recipe[]>> => {
    return get<Recipe[]>('/recipes/top-rated', { limit });
  },
  
  // Get user's recipes
  getUserRecipes: async (userId: string): Promise<ApiResponse<Recipe[]>> => {
    return get<Recipe[]>(`/recipes/user/${userId}`);
  },
  
  // Create recipe
  createRecipe: async (recipeData: NewRecipe): Promise<ApiResponse<Recipe>> => {
    return post<Recipe>('/recipes', recipeData);
  },

  // Update recipe
  updateRecipe: async (id: string, recipeData: Partial<NewRecipe>): Promise<ApiResponse<Recipe>> => {
    return put<Recipe>(`/recipes/${id}`, recipeData);
  },

  // Delete recipe
  deleteRecipe: async (id: string): Promise<ApiResponse<{ message: string }>> => {
    return del<{ message: string }>(`/recipes/${id}`);
  }
};