import { Router } from 'express';
import {
  getAllRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  searchRecipesHandler,
  getRandomRecipesHandler,
  getUserRecipes,
  getRecipeByIdHandler,
  getTopRatedRecipes
} from '../controllers/recipes.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRecipeCreate, validateRecipeUpdate } from '../middleware/validation.middleware';

const router = Router();

// Public routes
router.get('/random', getRandomRecipesHandler);
router.get('/search', searchRecipesHandler);
router.get('/top-rated', getTopRatedRecipes);
router.get('/', getAllRecipes);

router.get('/user/:userId', getUserRecipes);
router.get('/:id', getRecipeByIdHandler);
// Protected routes
router.post('/', authMiddleware, validateRecipeCreate, createRecipe);
router.put('/:id', authMiddleware, validateRecipeUpdate, updateRecipe);
router.delete('/:id', authMiddleware, deleteRecipe);

export default router;
