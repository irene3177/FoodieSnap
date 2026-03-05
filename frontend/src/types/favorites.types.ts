import { Recipe } from "./recipe.types";

export interface FavoritesState {
  favorites: Recipe[];
  loading: boolean;
  error: string | null;
}

// Action types for reducer
export type FavoritesAction = 
  | { type: 'ADD_FAVORITE'; payload: Recipe }
  | { type: 'REMOVE_FAVORITE'; payload: number }
  | { type: 'SET_FAVORITES'; payload: Recipe[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_FAVORITES' }
  | { type: 'REORDER_FAVORITES'; payload: Recipe[] };

// Context type
export interface FavoritesContextType {
  state: FavoritesState;
  addFavorite: (recipe: Recipe) => void;
  removeFavorite: (recipeId: number) => void;
  isFavorite: (recipeId: number) => boolean;
  clearFavorites: () => void;
  reorderFavorites: (reorderedFavorites: Recipe[]) => void;
}