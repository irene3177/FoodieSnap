import axios from 'axios';
import { config } from '../config';
import { RecipeModel } from '../models/Recipe.model';
import { TheMealDBMeal, TheMealDBResponse } from '../types/mealDB.types';

// Helper functions
const extractIngredients = (meal: TheMealDBMeal): string[] => {
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}` as keyof TheMealDBMeal];
    const measure = meal[`strMeasure${i}` as keyof TheMealDBMeal];
    
    if (ingredient && ingredient.trim()) {
      ingredients.push(`${measure ? measure.trim() : ''} ${ingredient.trim()}`.trim());
    }
  }
  return ingredients;
};


const mapToRecipeModel = (meal: TheMealDBMeal, userId?: string) => ({
  title: meal.strMeal,
  description: meal.strInstructions?.substring(0, 200)?.replace(/\r?\n|\r/g, ' ') + '...' || '',
  ingredients: extractIngredients(meal),
  instructions: meal.strInstructions
    ?.split('\n')
    .map(step => step.replace(/\r/g, '').trim())
    .filter(step => step.length > 0) || [],
  imageUrl: meal.strMealThumb,
  youtubeUrl: meal.strYoutube,
  category: meal.strCategory,
  area: meal.strArea,
  tags: meal.strTags?.split(',').map(tag => tag.trim()) || [],
  cookingTime: 30,
  difficulty: 'medium' as const,
  author: userId,
  source: 'theMealDB' as const,
  sourceId: meal.idMeal,
  rating: 0,
  ratingCount: 0
});

// Main service
export const fetchFromMealDB = async <T>(endpoint: string, params: any = {}): Promise<T | null> => {
  try {
    const response = await axios.get(`${config.mealdbApiUrl}${endpoint}`, { params });
    return response.data;
  } catch (error) {
    console.error('❌ MealDB API error:', error);
    return null;
  }
};

export const findOrCreateRecipe = async (mealId: string, userId?: string) => {
  // First looking up in our BD
  let recipe = await RecipeModel.findOne({
    source: 'theMealDB',
    sourceId: mealId
  });

  if (!recipe) {
    // If there is no, go to TheMealDB
    const data = await fetchFromMealDB<TheMealDBResponse>('/lookup.php', { i: mealId });
    const meal = data?.meals?.[0];
    
    if (!meal) {
      throw new Error('Recipe not found in TheMealDB');
    }

    // Create a new one
    const recipeData = mapToRecipeModel(meal, userId);
    recipe = await RecipeModel.create(recipeData);
    console.log(`✅ Created recipe: ${recipe.title} (${recipe._id})`);
  }

  return recipe;
};

export const getRecipeById = async (mealId: string, userId?: string) => {
  // First check in the DB
  let recipe = await RecipeModel.findOne({
    source: 'theMealDB',
    sourceId: mealId
  });

  if (!recipe) {
    // Then check TheMealDB
    const data = await fetchFromMealDB<TheMealDBResponse>('/lookup.php', { i: mealId });
    const meal = data?.meals?.[0];
    
    if (!meal) {
      throw new Error('Recipe not found in TheMealDB');
    }

    // Save the result in our DB
    const recipeData = mapToRecipeModel(meal, userId);
    recipe = await RecipeModel.create(recipeData);
    console.log(`✅ Created new recipe: ${recipe.title}`);
  }

  return recipe;
};

export const searchRecipes = async (
  query: string,
  page: number = 1,
  limit: number = 10
) => {
  // TheMealDB
  const data = await fetchFromMealDB<TheMealDBResponse>('/search.php', { s: query });
  const meals = data?.meals || [];
  
  const recipes = [];
  
  for (const meal of meals) {
    // Check if we already have it 
    let recipe = await RecipeModel.findOne({ sourceId: meal.idMeal });
    
    if (!recipe) {
      // Create
      const recipeData = mapToRecipeModel(meal);
      recipe = await RecipeModel.create(recipeData);
      console.log(`✅ Created new recipe from search: ${recipe.title}`);
    }
    
    recipes.push(recipe);
  }

  const startIndex = (page - 1) * limit;
  const paginatedRecipes = recipes.slice(startIndex, startIndex + limit);

  return {
    recipes: paginatedRecipes,
    total: recipes.length,
    page,
    pages: Math.ceil(recipes.length / limit)
  };
};

export const getRandomRecipes = async (
  count: number = 10,
  page: number = 1,
  userId?: string
) => {
  const recipes = [];
  
  for (let i = 0; i < count; i++) {
    // TheMealDB
    const data = await fetchFromMealDB<TheMealDBResponse>('/random.php');
    const meal = data?.meals?.[0];
    
    if (meal) {
      // Check if we already have it 
      let recipe = await RecipeModel.findOne({ sourceId: meal.idMeal });
      
      if (!recipe) {
        // Create
        const recipeData = mapToRecipeModel(meal, userId);
        recipe = await RecipeModel.create(recipeData);
      }
      
      recipes.push(recipe);
    }
  }

  return {
    recipes,
    totalPages: 999,
    currentPage: page,
    totalRecipes: 999
  };
};