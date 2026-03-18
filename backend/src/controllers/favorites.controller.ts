import { Response } from 'express';
import { UserModel } from '../models/User.model';
import { RecipeModel } from '../models/Recipe.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { IFavoriteResponse } from '../types';

const ensureRecipeExists = async (recipeId: string, res: Response) => {
  const recipe = await RecipeModel.findById(recipeId);
    
    if (!recipe) {
      res.status(404).json({
        success: false,
        error: 'Recipe not found'
      });
      return null;
    }

    return recipe;
};

// Add a recipe to the user's favorites
export const addToFavorites = async (
  req: AuthRequest & { params: { recipeId: string } },
  res: Response
): Promise<void> => {
  try {
    const { recipeId } = req.params;
    const userId = req.userId!;

    const recipe = ensureRecipeExists(recipeId, res);
    if(!recipe) return;

    // Add recipe to user's favorites
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { favorites: recipeId } },
      { returnDocument: 'after' }
    ).populate('favorites');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    const response: IFavoriteResponse = {
      recipeId,
      isFavorite: true,
      favoritesCount: user.favorites?.length || 0
    };

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add to favorites'
    });
  }
};

// Remove a recipe from the user's favorites
export const removeFromFavorites = async (
  req: AuthRequest & { params: { recipeId: string } },
  res: Response
): Promise<void> => {
  try {
    const { recipeId } = req.params;
    const userId = req.userId!;

    const recipe = ensureRecipeExists(recipeId, res);
    if(!recipe) return;

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { favorites: recipeId } },
      { returnDocument: 'after' }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    const response: IFavoriteResponse = {
      recipeId,
      isFavorite: false,
      favoritesCount: user.favorites?.length || 0
    };

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to remove from favorites'
    });
  }
};

// Check if a recipe is in the user's favorites
export const checkFavorite = async (
  req: AuthRequest & { params: { recipeId: string } },
  res: Response
): Promise<void> => {
  try {
    const { recipeId } = req.params;
    const userId = req.userId!;

    const recipe = ensureRecipeExists(recipeId, res);
    if(!recipe) return;

    const user = await UserModel.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    const isFavorite = user.favorites?.some(
      id => id.toString() === recipeId
    ) || false;

    res.json({
      success: true,
      data: {
        recipeId,
        isFavorite,
        favoritesCount: user.favorites?.length || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check favorite status'
    });
  }
};

// Get all favorite recipes for the user
export const getFavorites = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;

    const user = await UserModel.findById(userId)
      .populate({
        path: 'favorites',
        populate: {
          path: 'author',
          select: 'username avatar'
        }
      });

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: user.favorites
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch favorites'
    });
  }
};

// Clear all favorites for the user
export const clearAllFavorites = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { favorites: [] } },
      { returnDocument: 'after' }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        message: 'All favorites cleared successfully',
        favoritesCount: 0
      }
    });
  } catch (error) {
    console.error('❌ Clear all favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear favorites'
    });
  }
};

// Reorder favorites
export const reorderFavorites = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { reorderedIds } = req.body; // Expect an array of IDs

    if (!Array.isArray(reorderedIds)) {
      res.status(400).json({
        success: false,
        error: 'reorderedIds must be an array'
      });
      return;
    }

    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { favorites: reorderedIds } },
      { returnDocument: 'after' }
    ).populate('favorites');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        message: 'Favorites reordered successfully',
        favorites: user.favorites
      }
    });
  } catch (error) {
    console.error('❌ Reorder favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder favorites'
    });
  }
};