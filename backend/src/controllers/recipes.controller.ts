import mongoose from 'mongoose';
import { NextFunction, Request, Response } from 'express';
import { RecipeModel } from '../models/Recipe.model';
import { UserModel } from '../models/User.model';
import { CommentModel } from '../models/Comment.model';
import { AuthRequest } from '../types';
import {
  getRecipeById,
  getRandomRecipes,
  searchRecipes
 } from '../services/mealDB.service';
 import { validateNumber } from '../utils/validation';
import { IRecipeInput, IRecipeFilters } from '../types';
import NotFoundError from '../errors/notFoundError';
import BadRequestError from '../errors/badRequestError';

const getParamAsString = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

// GET /api/recipes/random - always from TheMealDB
export const getRandomRecipesHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const count = validateNumber(req.query.count, 8, 1, 20);
    const page = validateNumber(req.query.page, 1, 1, 50);
     
    // Всегда получаем свежие из TheMealDB
    const result = await getRandomRecipes(count, page);
    
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
    next(error);
  }
};

// GET /api/recipes/search - search only from TheMealDB
export const searchRecipesHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string') {
      return next(BadRequestError('Search query required'));
    }
  
    const page = validateNumber(req.query.page, 1, 1, 50);
    const limit = validateNumber(req.query.limit, 10, 1, 20);
  
    // Always in TheMealDB
    const result = await searchRecipes(
      q,
      page,
      limit
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/recipes/:id - check DB, then TheMealDB
export const getRecipeByIdHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = getParamAsString(req.params.id);
  
    const isMongoId = mongoose.Types.ObjectId.isValid(id);
    
    let recipe;
    if (isMongoId) {
      // Id from MongoDB
      recipe = await RecipeModel.findById(id)
        .populate('author', 'username avatar')
        .lean();
    } else {
      // ID from TheMealDB
      recipe = await getRecipeById(id);
    }
  
    if (!recipe) {
      return next(NotFoundError('Recipe not found'));
    }
  
    res.json({ success: true, data: recipe });
  } catch (error) {
    next(error);
  }
};

// GET /api/recipes/top-rated - get top rated recipes (from mongoDB)
export const getTopRatedRecipes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = validateNumber(req.query.limit, 10, 1, 50);
    
    const recipes = await RecipeModel.find({ rating: { $gt: 0 } })
      .sort({ rating: -1, ratingCount: -1 })
      .limit(limit)
      .populate('author', 'username avatar')
      .lean();
  
    res.json({ success: true, data: recipes });
  } catch (error) {
    next(error);
  }
};


// GET /api/recipes/user/:userId - get all recipes by a specific user
export const getUserRecipes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getParamAsString(req.params.userId);

    const recipes = await RecipeModel.find({ author: userId })
    .populate('author', 'username avatar')
    .sort({ createdAt: -1 })
    .lean();
    
    res.json({
      success: true,
      data: recipes
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/recipes - Create a new recipe
export const createRecipe = async (
  req: AuthRequest & { body: IRecipeInput },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const recipeData = req.body;
    const authorId = req.userId!;
    
    const recipe = new RecipeModel({
      ...recipeData,
      author: authorId,
      source: 'user'
    });
    
    await recipe.save();
    
    // Add recipe to user's createdRecipes
    await UserModel.findByIdAndUpdate(
      authorId,
      { $push: { createdRecipes: recipe._id } }
    );
    
    await recipe.populate('author', 'username avatar');
    
    res.status(201).json({
      success: true,
      data: recipe
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/recipes/:id - Update an existing recipe
export const updateRecipe = async (
  req: AuthRequest & { params: { id: string}; body: Partial<IRecipeInput> },
  res: Response,
  next: NextFunction
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
      return next(NotFoundError('Recipe not found or you are not the author'));
    }
    
    res.json({
      success: true,
      data: recipe
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/recipes/:id - Delete recipe
export const deleteRecipe = async (
  req: AuthRequest & { params: { id: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    
    const recipe = await RecipeModel.findOneAndDelete({
      _id: id,
      author: userId
    });
    
    if (!recipe) {
      return next(NotFoundError('Recipe not found or you are not the author'));
    }
    
    // Remove from user's createdRecipes
    await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { createdRecipes: id } }
    );
    
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
    next(error);
  }
};

// GET /api/recipes/filter - Get recipes with optional filters and sorting
export const filterRecipesHandler = async (
  req: Request<{}, {}, {}, IRecipeFilters>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      // Main filters
      difficulty,
      maxCookingTime,
      minCookingTime,
      search,
      sort,
      minRating,
      category,
      area,
  
      //  filters
      source,
      tags,
      ingredients,
      hasVideo,
      hasImage,
      minRatingCount,
      exactMatch
    } = req.query;
    const page = validateNumber(req.query.page, 1, 1, 50);
    const limit = validateNumber(req.query.limit, 12, 1, 50);
    const skip = (page - 1) * limit;
    
  
    // Build query object based on filters
    let query: any = {};
  
    // ====== Basic filters ======
    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;
    if (area) query.area = area;
    if (source) query.source = source;
  
    // ======  Ingredients ======
    if (ingredients) {
      const ingredientsArray = Array.isArray(ingredients) ? ingredients : [ingredients];
      query.ingredients = { $all: ingredientsArray };
    }
  
    // ====== Tags filter (array) ======
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      query.tags = { $in: tagsArray };
    }
  
    // ====== Number filters ======
    if (maxCookingTime) {
      query.cookingTime = { ...query.cookingTime, $lte: Number(maxCookingTime) };
    }
    if (minCookingTime) {
      query.cookingTime = { ...query.cookingTime, $gte: Number(minCookingTime) };
    }
    if (minRating) {
      query.rating = { ...query.rating, $gte: Number(minRating) };
    }
    if (minRatingCount) {
      query.ratingCount = { $gte: Number(minRatingCount) };
    }
  
    // ====== Boolean filters ======
    if (hasVideo !== undefined) {
      if (hasVideo) {
        query.youtubeUrl = { $ne: '', $exists: true };
      } else {
        query.youtubeUrl = { $in: ['', null] };
      }  
    } 
    if (hasImage !== undefined) {
      if (hasImage) {
        query.imageUrl = { $ne: '', $exists: true };
      } else if (!hasImage) {
        query.imageUrl = { $in: ['', null] };
      }
    }
    // ====== Search by text ======
    if (search) {
      if (exactMatch) {
        query.title = { $regex: search, $options: 'i' };
      } else {
        query.$text = { $search: search };
      }
    }
    // ====== Sorting ======
    let sortOption: any = { createdAt: -1 }; // Default to newest first
    
    switch (sort) {
      case 'popular':
        sortOption = { ratingCount: -1 };
        break;
      case 'rating':
        sortOption = { rating: -1 };
        break;
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }
  
    // ====== Execute query ======
    const [recipes, total] = await Promise.all([
      RecipeModel.find(query)
        .populate('author', 'username avatar')  
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
        RecipeModel.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: {
        recipes,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};