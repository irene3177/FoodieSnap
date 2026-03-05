import axios from 'axios';
import { 
  Recipe, 
  RecipeApiResponse, 
  SearchResponse, 
  CategoriesResponse, 
  Meal
} from '../types/api.types';

const apiClient = axios.create({
  baseURL: 'https://www.themealdb.com/api/json/v1/1',
  timeout: 10000,
});

const transformMealToRecipe = (meal: Meal): Recipe => ({
  id: parseInt(meal.idMeal),
  title: meal.strMeal,
  description: meal.strInstructions?.substring(0, 150) + '...' || 'No description available',
  image: meal.strMealThumb,
  ingredients: extractIngredients(meal),
  category: meal.strCategory,
  area: meal.strArea,
  instructions: meal.strInstructions,
  youtubeLink: meal.strYoutube,
  tags: meal.strTags ? meal.strTags.split(',') : [],
});

// Helper function to extract ingredients from meal object
const extractIngredients = (meal: Meal): string[] => {
  const ingredients: string[] = [];

  // TheMealDB has ingredients from strIngredient1 to strIngredient20
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}` as keyof Meal];
    const measure = meal[`strMeasure${i}` as keyof Meal];

    if (ingredient && ingredient.trim()) {
      ingredients.push(`${measure ? measure.trim() : ''} ${ingredient.trim()}`.trim());
    }
  }

  return ingredients;
};

// API methods
export const recipeApi = {
  // Search recipe by name
  searchRecipes: async (query: string): Promise<Recipe[]> => {
    try {
      const response = await apiClient.get<SearchResponse>('/search.php', {
        params: { s: query },
      });

      if (!response.data.meals) {
        return [];
      }
      return response.data.meals.map(transformMealToRecipe);
    } catch (error) {
      console.error('Error searching recipes:', error);
      throw new Error('Failed to search recipes. Please try again later.');
    }
  },

  // Get random recipe
  getRandomRecipe: async (): Promise<Recipe> => {
    try {
      const response = await apiClient.get<RecipeApiResponse>('/random.php');
      
      if (!response.data.meals || response.data.meals.length === 0) {
        throw new Error('No recipes found.');
      }
      
      return transformMealToRecipe(response.data.meals[0]);
    } catch(error) {
      console.error('Error fetching random recipe:', error);
      throw new Error('Failed to fetch random recipe.');
    }
  },

  // Get recipe by ID
  getRecipeById: async (id: string): Promise<Recipe | null> => {
    try {
      const response = await apiClient.get<RecipeApiResponse>('/lookup.php', {
        params: { i: id },
      });

      if (!response.data.meals || response.data.meals.length === 0) {
        return null;
      }

      return transformMealToRecipe(response.data.meals[0]);
    } catch (error) {
      console.error('Error fetching recipe by ID:', error);
      throw new Error('Failed to fetch recipe details.');
    }
  },

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

  // Filter by category
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
};