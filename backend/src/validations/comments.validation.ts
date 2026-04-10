import { body } from 'express-validator';
import { validateParamId, validateBodyId } from './common.validation';

// Validation for creating a comment
export const validateCreateComment = [
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters'),
  
  validateBodyId('recipeId'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5')
];

// Validation for updating a comment
export const validateUpdateComment = [
  validateParamId('id'),
  
  body('text')
    .trim()
    .notEmpty()
    .withMessage('Comment text is required')
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters')
];

// Validation for comment ID in params
export const validateCommentId = [
  validateParamId('id')
];

// Validation for recipe ID in params
export const validateRecipeId = [
  validateParamId('recipeId')
];
