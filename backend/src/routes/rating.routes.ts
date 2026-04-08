import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validationHandler';
import {
  rateRecipe,
  getRecipeRating,
  getUserRatings,
  deleteRating,
} from '../controllers/rating.controller';
import {
  validateRateRecipe,
  validateRecipeId
} from '../validations/rating.validation';

const router = express.Router();

// Public routes
router.get('/recipe/:recipeId', validate(validateRecipeId), getRecipeRating);

// Protected routes
router.use(authMiddleware);
router.get('/user', getUserRatings);
router.post('/recipe/:recipeId',validate(validateRateRecipe), rateRecipe);
router.put('/recipe/:recipeId',validate(validateRateRecipe), rateRecipe);
router.delete('/recipe/:recipeId', validate(validateRecipeId), deleteRating);

export default router;