import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validationHandler';
import {
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
  getFavorites,
  clearAllFavorites,
  reorderFavorites
} from '../controllers/favorites.controller';
import {
  validateReorderFavorites,
  validateCheckFavorite,
  validateAddToFavorites,
  validateRemoveFromFavorites
} from '../validations/favorites.validation';

const router = Router();

// All routes in this file require authentication
router.use(authMiddleware);

router.get('/', getFavorites);
router.get('/:recipeId/check', validate(validateCheckFavorite), checkFavorite);
router.post('/:recipeId', validate(validateAddToFavorites), addToFavorites);
router.put('/reorder', validate(validateReorderFavorites), reorderFavorites);
router.delete('/:recipeId', validate(validateRemoveFromFavorites), removeFromFavorites);
router.delete('/', clearAllFavorites);

export default router;