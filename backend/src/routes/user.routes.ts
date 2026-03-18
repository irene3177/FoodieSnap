import express from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import {
  getUserById,
  getSavedRecipes,
  getFavorites,
  getUsers
} from '../controllers/user.controller';

const router = express.Router();

// Public routes
router.get('/', getUsers);
router.get('/:userId', getUserById);
router.get('/:userId/favorites', getFavorites);

// Private routes
router.get('/:userId/saved', authMiddleware, getSavedRecipes);

export default router;