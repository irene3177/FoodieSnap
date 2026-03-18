import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
  getFavorites,
  clearAllFavorites,
  reorderFavorites
} from '../controllers/favorites.controller';

const router = Router();

// All routes in this file require authentication
router.use(authMiddleware);

router.get('/', getFavorites);
router.get('/:recipeId/check', checkFavorite);
router.post('/:recipeId', addToFavorites);
router.put('/reorder', reorderFavorites);
router.delete('/:recipeId', removeFromFavorites);
router.delete('/', clearAllFavorites);

export default router;