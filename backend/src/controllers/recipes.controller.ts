import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { RecipeModel } from '../models/Recipe.model';
import { UserModel } from '../models/User.model';
import { CommentModel } from '../models/Comment.model';
import { AuthRequest } from '../middleware/auth.middleware';
import {
  getRecipeById,
  getRandomRecipes,
  searchRecipes
 } from '../services/mealDB.service';
import { IRecipeInput, IRecipeFilters } from '../types';

// GET /api/recipes/random - always new from TheMealDB
export const getRandomRecipesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { count = 8, page = 1 } = req.query;
    const userId = (req as AuthRequest).userId;
    
    
    // Всегда получаем свежие из TheMealDB
    const result = await getRandomRecipes(Number(count), Number(page), userId);
    
    res.json({
      success: true,
      data: {
        recipes: result.recipes,
        totalPages: result.totalPages,
        currentPage: result.currentPage,
        totalRecipes: result.totalRecipes
      }
    });
  } catch (error) {
    console.error('❌ Get random recipes error:', error);
    res.status(500).json({ success: false, error: 'Failed to get random recipes' });
  }
};

// GET /api/recipes/search - search only from TheMealDB
export const searchRecipesHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { q, page = 1, limit = 10 } = req.query;
    
    if (!q) {
      res.status(400).json({ success: false, error: 'Search query required' });
      return;
    }

    // Always in TheMealDB
    const result = await searchRecipes(
      q as string,
      Number(page),
      Number(limit)
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Search recipes error:', error);
    res.status(500).json({ success: false, error: 'Failed to search recipes' });
  }
};

// GET /api/recipes/:id - check BD, then TheMealDB
export const getRecipeByIdHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const userId = (req as AuthRequest).userId;

    const isMongoId = mongoose.Types.ObjectId.isValid(id);
    
    let recipe;
    if (isMongoId) {
      // Id from MongoDB
      recipe = await RecipeModel.findById(id)
        .populate('author', 'username avatar')
        .lean();
    } else {
      // ID from TheMealDB
      recipe = await getRecipeById(id, userId);
    }

    if (!recipe) {
      res.status(404).json({ success: false, error: 'Recipe not found' });
      return;
    }

    res.json({ success: true, data: recipe });
  } catch (error) {
    console.error('❌ Get recipe error:', error);
    res.status(500).json({ success: false, error: 'Failed to get recipe' });
  }
};

// GET /api/recipes/top-rated - get top rated recipes (from mongoDB)
export const getTopRatedRecipes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 10 } = req.query;
    
    const recipes = await RecipeModel.find({ rating: { $gt: 0 } })
      .sort({ rating: -1, ratingCount: -1 })
      .limit(Number(limit))
      .populate('author', 'username avatar')
      .lean();

    res.json({ success: true, data: recipes });
  } catch (error) {
    console.error('❌ Get top rated recipes error:', error);
    res.status(500).json({ success: false, error: 'Failed to get top rated recipes' });
  }
};

// Get all recipes with optional filters and sorting
export const getAllRecipes = async (
  req: Request<{}, {}, {}, IRecipeFilters>,
  res: Response
): Promise<void> => {
  try {
    const { difficulty, maxCookingTime, search, sort } = req.query;

    // Build query object based on filters
    let query: any = {};

    if (difficulty) {
      query.difficulty = difficulty;
    }

    if (maxCookingTime) {
      query.cookingTime = { $lte: Number(maxCookingTime) };
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Set sorting options
    let sortOption: any = { createdAt: -1 }; // Default to newest first

    if (sort === 'popular') {
      sortOption = { ratingCount: -1 }; // Sort by most rated
    } else if (sort === 'rating') {
      sortOption = { rating: -1 }; // Sort by highest rating
    }

    const recipes = await RecipeModel.find(query)
      .populate('author', 'username avatar')  
      .sort(sortOption);

      res.json({
        success: true,
        data: recipes
      });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recipes'
    });
  }
};

// Create a new recipe
export const createRecipe = async (
  req: AuthRequest & { body: IRecipeInput },
  res: Response
): Promise<void> => {
  try {
    const recipeData = req.body;
    const authorId = req.userId!;

    const recipe = new RecipeModel({
      ...recipeData,
      author: authorId
    });

    await recipe.save();
    await recipe.populate('author', 'username avatar');

    res.status(201).json({
      success: true,
      data: recipe
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to create recipe'
    });
  }
};

// Update an existing recipe
export const updateRecipe = async (
  req: AuthRequest & { params: { id: string}; body: Partial<IRecipeInput> },
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const updates = req.body;

    const recipe = await RecipeModel.findOneAndUpdate(
      { _id: id, author: userId },
      updates,
      { returnDocument: 'after', runValidators: true }
    ).populate('author', 'username avatar');

    if (!recipe) {
      res.status(404).json({
        success: false,
        error: 'Recipe not found or you are not the author'
      });
      return;
    }

    res.json({
      success: true,
      data: recipe
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to update recipe'
    });
  }
};

// Delete a recipe
export const deleteRecipe = async (
  req: AuthRequest & { params: { id: string } },
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const recipe = await RecipeModel.findOneAndDelete({
      _id: id,
      author: userId
    });

    if (!recipe) {
      res.status(404).json({
        success: false,
        error: 'Recipe not found or you are not the author'
      });
      return;
    }

    // Remove the deleted recipe from all users' favorites
    await UserModel.updateMany(
      { favorites: id },
      { $pull: { favorites: id } }
    );

    // Remove the deleted recipe from all users' saved recipes
    await UserModel.updateMany(
      { savedRecipes: id },
      { $pull: { savedRecipes: id } }
    );

    // Delete all comments associated with the deleted recipe
    await CommentModel.deleteMany({ recipeId: id });

    res.json({
      success: true,
      message: 'Recipe deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete recipe'
    });
  }
};