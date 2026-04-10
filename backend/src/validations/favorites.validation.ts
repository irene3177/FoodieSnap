import { body } from 'express-validator';
import { isValidObjectId } from '../utils/validation';
import { validateParamId } from './common.validation';

// Validation for reorder favorites
export const validateReorderFavorites = [
  body('reorderedIds')
    .isArray()
    .withMessage('reorderedIds must be an array')
    .notEmpty()
    .withMessage('reorderedIds cannot be empty')
    .custom((value) => {
      const allValid = value.every((id: string) => isValidObjectId(id));
      if (!allValid) {
        throw new Error('All IDs in reorderedIds must be valid ObjectId format');
      }
      return true;
    })
];

// Validation for check favorite (только ID в params)
export const validateCheckFavorite = [
  validateParamId('recipeId')
];

// Validation for add to favorites
export const validateAddToFavorites = [
  validateParamId('recipeId')
];

// Validation for remove from favorites
export const validateRemoveFromFavorites = [
  validateParamId('recipeId')
];