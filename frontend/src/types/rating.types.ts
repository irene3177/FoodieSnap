import { RatingStats } from '../store/ratingSlice';
export interface Rating {
  recipeId: string;
  userRating: number;   // 1-5 stars
  averageRating: number;
  totalRatings: number;
  timestamp: number;
}

export interface RatingResponse {
  recipeId: string;
  value: number;
  stats: RatingStats;
}

export interface DeleteRatingResponse {
  recipeId: string;
  stats: RatingStats;
}