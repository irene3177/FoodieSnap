import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  rateRecipe,
  getRecipeRating,
  getUserRatings,
  deleteRating,
} from '../controllers/rating.controller';

const router = express.Router();

// Public routes
router.get('/recipe/:recipeId', getRecipeRating);

// Protected routes
router.use(authMiddleware);
router.get('/user', getUserRatings);
router.post('/recipe/:recipeId', rateRecipe);
router.put('/recipe/:recipeId', rateRecipe); // update
router.delete('/recipe/:recipeId', deleteRating); // delete

export default router;