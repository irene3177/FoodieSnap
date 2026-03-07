import { Router } from 'express';
import {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe
} from '../controllers/recipe.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateRecipeCreate, validateRecipeUpdate } from '../middleware/validation.middleware';

const router = Router();

// Public routes
router.get('/', getAllRecipes);
router.get('/:id', getRecipeById);

// Protected routes
router.post('/', authMiddleware, validateRecipeCreate, createRecipe);
router.put('/:id', authMiddleware, validateRecipeUpdate, updateRecipe);
router.delete('/:id', authMiddleware, deleteRecipe);

export default router;
