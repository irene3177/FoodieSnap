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