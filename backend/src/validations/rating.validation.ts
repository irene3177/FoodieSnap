import { body } from 'express-validator';
import { validateParamId } from './common.validation';

// Validation for recipe ID in params
export const validateRecipeId = [
  validateParamId('recipeId')
];

// Validation for rating a recipe (POST/PUT)
export const validateRateRecipe= [
  validateParamId('recipeId'),
  body('value')
    .notEmpty()
    .withMessage('Rating value is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
];

