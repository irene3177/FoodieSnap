export interface Recipe {
  _id: string;
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  imageUrl: string;
  youtubeUrl?: string;
  category?: string;
  area?: string;
  tags?: string[];
  cookingTime?: number;
  difficulty: 'easy' | 'medium' | 'hard';
  author?: {
    _id: string;
    username: string;
    avatar?: string;
  };
  rating: number;
  ratingCount: number;
  source: 'user' | 'theMealDB';
  sourceId?: string;
  createdAt: string;
  updatedAt: string;
}

// Helper type for creating new recipes (without _id)
export type NewRecipe = Omit<Recipe, '_id' | 'createdAt' | 'updatedAt' | 'rating' | 'ratingCount' | 'source'> & {
  source?: 'user';
};

// Helper type for recipes from TheMealDB
export interface MealDBRecipe extends Omit<Recipe, '_id' | 'source'> {
  source: 'theMealDB';
  sourceId: string;
}

// Helper type for recipe IDs
export type RecipeId = Recipe['_id'];
export type MealDBId = string;

export interface RecipeFilters {
  difficulty?: 'easy' | 'medium' | 'hard';
  maxCookingTime?: number;
  search?: string;
  sort?: 'newest' | 'popular' | 'rating';
  category?: string;
  area?: string;
}

export interface SearchRecipesResponse {
  recipes: Recipe[];
  total: number;
  page: number;
  pages: number;
}

export interface RandomRecipesResponse {
  recipes: Recipe[];
  totalPages: number;
  currentPage: number;
  totalRecipes: number;
}