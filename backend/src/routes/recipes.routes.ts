import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validationHandler';
import {
  filterRecipesHandler,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  searchRecipesHandler,
  getRandomRecipesHandler,
  getUserRecipes,
  getRecipeByIdHandler,
  getTopRatedRecipes
} from '../controllers/recipes.controller';
import {
  validateCreateRecipe,
  validateRecipeId,
  validateUserId,
  validateUpdateRecipe,
  validateFilterRecipes,
  validateRandomRecipes,
  validateSearchRecipes,
  validateTopRated
} from '../validations/recipes.validation';

const router = Router();

// Public routes
router.get('/random', validate(validateRandomRecipes), getRandomRecipesHandler);  // From TheMealDB
router.get('/search', validate(validateSearchRecipes), searchRecipesHandler);  // From TheMealDB
router.get('/filter', validate(validateFilterRecipes), filterRecipesHandler);  // From mongoDB
router.get('/top-rated', validate(validateTopRated), getTopRatedRecipes);  // From mongoDB
router.get('/', validate(validateFilterRecipes), filterRecipesHandler);  // From mongoDB

router.get('/user/:userId', validate(validateUserId), getUserRecipes);
router.get('/:id', validate(validateRecipeId), getRecipeByIdHandler);
// Protected routes
router.use(authMiddleware);
router.post('/', validate(validateCreateRecipe), createRecipe);
router.put('/:id', validate(validateUpdateRecipe), updateRecipe);
router.delete('/:id', validate(validateRecipeId), deleteRecipe);

export default router;
