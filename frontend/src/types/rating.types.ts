export interface Rating {
  recipeId: string;
  userRating: number;   // 1-5 stars
  averageRating: number;
  totalRatings: number;
  timestamp: number;
}
