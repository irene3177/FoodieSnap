import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  addToFavorites,
  removeFromFavorites,
  checkFavorite,
  getFavorites
} from '../controllers/favorite.controller';

const router = Router();

// All routes in this file require authentication
router.use(authMiddleware);

router.get('/', getFavorites);
router.get('/:recipeId/check', checkFavorite);
router.post('/:recipeId', addToFavorites);
router.delete('/:recipeId', removeFromFavorites);

export default router;