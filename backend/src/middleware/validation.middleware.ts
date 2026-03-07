import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

export const validateComment = [
  body('text')
    .isString()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Comment must be between 1 and 500 characters'),

  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),

    (req: Request, res: Response, next: NextFunction) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: errors.array()
        });
        return;
      }
      next();
    }
];

// Validation for creating a recipe
export const validateRecipeCreate = [
  body('title')
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('ingredients')
    .isArray({ min: 1 })
    .withMessage('At least one ingredient is required'),
  
  body('ingredients.*')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Ingredient cannot be empty'),
  
  body('instructions')
    .isArray({ min: 1 })
    .withMessage('At least one instruction step is required'),
  
  body('instructions.*')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Instruction step cannot be empty'),
  
  body('cookingTime')
    .optional()
    .isInt({ min: 1, max: 10080 }) // Max 7 days in minutes
    .withMessage('Cooking time must be between 1 and 10080 minutes'),
  
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
      return;
    }
    next();
  }
];

// Validation for updating a recipe (all fields optional)
export const validateRecipeUpdate = [
  body('title')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  
  body('ingredients')
    .optional()
    .isArray({ min: 1 })
    .withMessage('If provided, at least one ingredient is required'),
  
  body('ingredients.*')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Ingredient cannot be empty'),
  
  body('instructions')
    .optional()
    .isArray({ min: 1 })
    .withMessage('If provided, at least one instruction step is required'),
  
  body('instructions.*')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Instruction step cannot be empty'),
  
  body('cookingTime')
    .optional()
    .isInt({ min: 1, max: 480 })
    .withMessage('Cooking time must be between 1 and 480 minutes'),
  
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),

  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
      return;
    }
    next();
  }
];
