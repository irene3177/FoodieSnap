export interface Recipe {
  id: number;
  title: string;
  description: string;
  image: string;
  ingredients: string[];
  category?: string;
  area?: string;
  instructions?: string;
  youtubeLink?: string;
  tags?: string[];
}

// Helper type for creating new recipes (without id)
export type NewRecipe = Omit<Recipe, 'id'>;

// Helper type for recipe IDs
export type RecipeId = Recipe['id'];

export interface RecipeFilters {
  category?: string;
  area?: string;
  searchQuery?: string;
}


// We can also use type alias 
// export type Recipe = {
//   id: number;
//   title: string;
//   description: string;
//   image: string;
//   ingredients: string[];
// };