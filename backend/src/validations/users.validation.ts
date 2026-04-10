import { query } from 'express-validator';
import { validateParamId } from './common.validation';

// Validation for user ID in params
export const validateUserId = [validateParamId('userId')];

// Validation for get users (query params)
export const validateGetUsers = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Page must be between 1 and 100'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('search')
    .optional()
    .trim()
    .isString()
    .withMessage('Search query must be a string'),
  
  query('sortBy')
    .optional()
    .isIn(['username', 'createdAt'])
    .withMessage('SortBy must be username or createdAt'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('SortOrder must be asc or desc')
];