import { body, query } from 'express-validator';
import { validateParamId } from './common.validation';

// Validation for recipe ID in params
export const validateRecipeId = [validateParamId('id')];

// Validation for user ID in params (getUserRecipes)
export const validateUserId = [validateParamId('userId')];

// Validation for creating a recipe
export const validateCreateRecipe = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Recipe title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  
  body('ingredients')
    .isArray({ min: 1 })
    .withMessage('At least one ingredient is required')
    .custom((value) => {
      const allValid = value.every((item: any) => typeof item === 'string' && item.trim().length > 0);
      if (!allValid) {
        throw new Error('All ingredients must be non-empty strings');
      }
      return true;
    }),
  
  body('instructions')
    .isArray({ min: 1 })
    .withMessage('At least one instruction is required')
    .custom((value) => {
      const allValid = value.every((item: any) => typeof item === 'string' && item.trim().length > 0);
      if (!allValid) {
        throw new Error('All instructions must be non-empty strings');
      }
      return true;
    }),
  
  body('cookingTime')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Cooking time must be between 1 and 1440 minutes'),
  
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  
  body('category')
    .optional()
    .trim(),
  
  body('area')
    .optional()
    .trim(),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('youtubeUrl')
    .optional()
    .isURL()
    .withMessage('YouTube URL must be a valid URL')
];

// Validation for updating a recipe
export const validateUpdateRecipe = [
  validateParamId('id'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  
  body('ingredients')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one ingredient is required'),
  
  body('instructions')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one instruction is required'),
  
  body('cookingTime')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Cooking time must be between 1 and 1440 minutes'),
  
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  
  body('imageUrl')
    .optional()
    .isURL()
    .withMessage('Image URL must be a valid URL'),
  
  body('category')
    .optional()
    .trim(),
  
  body('area')
    .optional()
    .trim(),
  
  body('tags')
    .optional()
    .isArray(),
  
  body('youtubeUrl')
    .optional()
    .isURL()
    .withMessage('YouTube URL must be a valid URL')
];

// Validation for filter recipes (query params)
export const validateFilterRecipes = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Page must be between 1 and 50'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  
  query('maxCookingTime')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max cooking time must be a positive number'),
  
  query('minCookingTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Min cooking time must be a positive number'),
  
  query('minRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Min rating must be between 1 and 5'),
  
  query('category')
    .optional()
    .trim(),
  
  query('area')
    .optional()
    .trim(),
  
  query('source')
    .optional()
    .isIn(['user', 'theMealDB'])
    .withMessage('Source must be user or theMealDB'),
  
  query('sort')
    .optional()
    .isIn(['popular', 'rating', 'newest'])
    .withMessage('Sort must be popular, rating, or newest'),
  
  query('search')
    .optional()
    .trim()
];

// Validation for random recipes (query params)
export const validateRandomRecipes = [
  query('count')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Count must be between 1 and 20'),
  
  query('page')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Page must be between 1 and 50')
];

// Validation for search recipes (query params)
export const validateSearchRecipes = [
  query('q')
    .notEmpty()
    .withMessage('Search query is required')
    .isString()
    .withMessage('Search query must be a string'),
  
  query('page')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Page must be between 1 and 50'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Limit must be between 1 and 20')
];

// Validation for top rated recipes
export const validateTopRated = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
];

