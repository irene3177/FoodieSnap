export interface Rating {
  recipeId: number;
  userRating: number;   // 1-5 stars
  averageRating: number;
  totalRatings: number;
  timestamp: number;
}

export interface RatingState {
  ratings: Record<number, Rating>;  // key: recipeId
  userRatings: Record<number, number>; // key: recipeId, value: user's rating
}

export type RatingAction =
  | { type: 'SET_RATING'; payload: { recipeId:number; rating: number } }
  | { type: 'LOAD_RATINGS'; payload: Record<number, Rating> }
  | { type: 'CLEAR_RATINGS' };

export interface RatingContextType {
  ratings: Record<number, Rating>;
  userRatings: Record<number, number>;
  rateRecipe: (recipeId: number, rating: number) => void;
  getRecipeRating: (recipeId: number) => { average: number; total: number; userRating: number };
  clearRatings: () => void;
}