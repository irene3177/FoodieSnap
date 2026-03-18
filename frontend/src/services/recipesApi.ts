import axios from 'axios';
import { Recipe } from '../types';
import { config } from '../config'; 

const apiClient = axios.create({
  baseURL: `${config.apiUrl}/recipes`,
  timeout: config.timeout,
  withCredentials: true
});

// API methods
export const recipesApi = {
  // Search recipe by name
  searchRecipes: async (query: string, page: number = 1): Promise<{
    recipes: Recipe[];
    total: number;
    page: number;
    pages: number;
  }> => {
    try {
      const response = await apiClient.get('/search', {
        params: { q: query, page, limit: 10 }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error searching recipes:', error);
      throw new Error('Failed to search recipes. Please try again later.');
    }
  },

  // Get random recipes
  getRandomRecipes: async (count = 8, page: number = 1): Promise<{
    recipes: Recipe[];
    totalPages: number;
    currentPage: number;
    totalRecipes: number;
  }> => {
    try {
      const response = await apiClient.get('/random', {
        params: { count, page }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching random recipes:', error);
      throw new Error('Failed to fetch random recipes');
    }
  },

  // Get recipe by ID
  getRecipeById: async (id: string): Promise<Recipe | null> => {
    try {
      const response = await apiClient.get(`/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching recipe by ID:', error);
      return null;
    }
  },
/*
  // Get all categories
  getCategories: async () => {
    try {
      const response = await apiClient.get<CategoriesResponse>('/categories.php');
      return response.data.categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories.');
    }
  },
*/

  // Get top rated recipes
  getTopRatedRecipes: async (limit = 10): Promise<Recipe[]> => {
    try {
      const response = await apiClient.get('/top-rated', {
        params: { limit }
      });
      return response.data.data;
    } catch (error) {
      console.error('Error fetching top rated recipes:', error);
      throw new Error('Failed to fetch top rated recipes');
    }
  },

  // TODO: add on backend and change here
  // Filter by category
  /*
  filterByCategory: async (category: string): Promise<Recipe[]> => {
    try {
      const response = await apiClient.get<SearchResponse>('/filter.php', {
        params: { c: category },
      });

      if (!response.data.meals) {
        return [];
      }

      // Filter endpoint returns minimal data, we need to fetch details for each
      // For now, return basic info
      return response.data.meals.map(meal => ({
        id: parseInt(meal.idMeal),
        title: meal.strMeal,
        description: '',
        image: meal.strMealThumb,
        ingredients: [],
        category: category,
      }));
    } catch (error) {
      console.error('Error filtering by category:', error);
      throw new Error('Failed to filter recipes by category.');
    }
  }
    */
};