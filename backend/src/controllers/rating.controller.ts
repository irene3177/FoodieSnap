import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../types';
import { RatingModel } from '../models/Rating.model';
import { RecipeModel } from '../models/Recipe.model';
import NotFoundError from '../errors/notFoundError';

const getParamAsString = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

// Calculate rating stats from all ratings
const calculateNewAverage = (allRatings: any[]) => {
  const totalRatings = allRatings.length;
  const averageRating = totalRatings > 0
    ? allRatings.reduce((acc, r) => acc + r.value, 0) / totalRatings
    : 0;

  return {
    totalRatings,
    averageRating
  };
};

const getDistribution = (allRatings: any[]) => {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  allRatings.forEach(r => {
    distribution[r.value as 1|2|3|4|5]++;
  });

  return distribution;
};

// Update recipe with new rating
const updateRecipeRating = async (
  recipeId: string,
  stats: { averageRating: number; totalRatings: number }
) => {
  await RecipeModel.findByIdAndUpdate(recipeId, {
    rating: stats.averageRating,
    ratingCount: stats.totalRatings
  });
};

// GET /api/ratings/recipe/:recipeId - Get rating stats for a recipe
export const getRecipeRating = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const recipeId = getParamAsString(req.params.recipeId);

    const recipe = await RecipeModel.findById(recipeId);
    if (!recipe) {
      return next(NotFoundError('Recipe not found'));
    }
  
    const allRatings = await RatingModel.find({ recipeId });
    
    const distribution = getDistribution(allRatings);
  
    res.json({
      success: true,
      data: {
        averageRating: recipe.rating || 0,
        totalRatings: recipe.ratingCount || 0,
        distribution
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/ratings/user - Get all ratings by current user
export const getUserRatings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
  
    const ratings = await RatingModel.find({ userId });
    
    const userRatings = ratings.reduce((acc, r) => ({
      ...acc,
      [r.recipeId.toString()]: r.value
    }), {});
  
    res.json({
      success: true,
      data: userRatings
    });
  } catch (error) {
    next(error);
  }
};

// POST || PUT /api/ratings/recipe/:recipeId
export const rateRecipe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const recipeId = getParamAsString(req.params.recipeId);
    const userId = req.userId!;
    const { value } = req.body;
  
    // Check if the recipe exists
    const recipe = await RecipeModel.findById(recipeId);
    if (!recipe) {
      return next(NotFoundError('Recipe not found'));
    }
  
    // Check if the user has already rated this recipe
    const existingRating = await RatingModel.findOne({
      recipeId,
      userId
    });
  
    if (existingRating) {
      // Update existing rating
      existingRating.value = value;
      await existingRating.save();
    } else {
      // Create new rating
      await RatingModel.create({
        recipeId,
        userId,
        value
      });
    }
  
    // Calculate new average rating
    const allRatings = await RatingModel.find({ recipeId });
    const { totalRatings, averageRating } = calculateNewAverage(allRatings);
  
    // Update recipe with new rating stats
    await updateRecipeRating(recipeId, {
      totalRatings,
      averageRating
    });
  
    // Get distribution
    const distribution = getDistribution(allRatings);
  
    res.json({
      success: true,
      data: {
        recipeId,
        value,
        stats: {
          averageRating,
          totalRatings,
          distribution
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/ratings/recipe/:recipeId
export const deleteRating = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const recipeId = getParamAsString(req.params.recipeId);
    const userId = req.userId!;

    // Delete rating
    await RatingModel.findOneAndDelete({
      recipeId,
      userId
    });
  
    // Calculate new average rating
    const allRatings = await RatingModel.find({ recipeId });
    const { totalRatings, averageRating } = calculateNewAverage(allRatings);
  
    // Update recipe with new rating stats
    await updateRecipeRating(recipeId, {
      totalRatings,
      averageRating
    });
  
    // Get distribution
    const distribution = getDistribution(allRatings);
  
    res.json({
      success: true,
      data: {
        recipeId,
        stats: {
          averageRating,
          totalRatings,
          distribution
        }
      }
    });
  } catch (error) {
    next(error);
  }
};