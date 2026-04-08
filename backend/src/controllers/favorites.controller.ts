import { NextFunction, Response } from 'express';
import { UserModel } from '../models/User.model';
import { RecipeModel } from '../models/Recipe.model';
import { AuthRequest } from '../types';
import { IFavoriteResponse } from '../types';
import NotFoundError from '../errors/notFoundError';

// GET /api/favorites
export const getFavorites = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
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
      return next(NotFoundError('User not found'));
    }
  
    res.json({
      success: true,
      data: user.favorites
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/favorites/:recipeId
export const addToFavorites = async (
  req: AuthRequest & { params: { recipeId: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { recipeId } = req.params;
    const userId = req.userId!;
  
    const recipe = await RecipeModel.findById(recipeId);
    if (!recipe) {
      return next(NotFoundError('Recipe not found'));
    }
  
    // Add recipe to user's favorites
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { favorites: recipeId } },
      { returnDocument: 'after' }
    ).populate('favorites');
  
    if (!user) {
      return next(NotFoundError('User not found'));
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
    next(error);
  }
};

// DELETE /api/favorites/:recipeId
export const removeFromFavorites = async (
  req: AuthRequest & { params: { recipeId: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { recipeId } = req.params;
    const userId = req.userId!;
  
    const recipe = await RecipeModel.findById(recipeId);
    if (!recipe) {
      return next(NotFoundError('Recipe not found'));
    }
  
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { favorites: recipeId } },
      { returnDocument: 'after' }
    );
  
    if (!user) {
      return next(NotFoundError('User not found'));
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
    next(error);
  }
};

// GET /api/favorites/:recipeId/check
export const checkFavorite = async (
  req: AuthRequest & { params: { recipeId: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { recipeId } = req.params;
    const userId = req.userId!;
  
    const recipe = await RecipeModel.findById(recipeId);
    if (!recipe) {
      return next(NotFoundError('Recipe not found'));
    }
  
    const user = await UserModel.findById(userId);
    if (!user) {
      return next(NotFoundError('User not found'));
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
    next(error);
  }
};

// DELETE /api/favorites
export const clearAllFavorites = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
  
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { favorites: [] } },
      { returnDocument: 'after' }
    );
  
    if (!user) {
      return next(NotFoundError('User not found'));
    }
  
    res.json({
      success: true,
      data: {
        message: 'All favorites cleared successfully',
        favoritesCount: 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/favorites/reorder
export const reorderFavorites = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    const { reorderedIds } = req.body; // Expect an array of IDs
  
    const user = await UserModel.findByIdAndUpdate(
      userId,
      { $set: { favorites: reorderedIds } },
      { returnDocument: 'after' }
    ).populate('favorites');
  
    if (!user) {
      return next(NotFoundError('User not found'));
    }
  
    res.json({
      success: true,
      data: {
        message: 'Favorites reordered successfully',
        favorites: user.favorites
      }
    });
  } catch (error) {
    next(error);
  }
};