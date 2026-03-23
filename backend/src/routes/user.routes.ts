import express from 'express';
import {
  getUserById,
  getCreatedRecipes,
  getFavorites,
  getUsers
} from '../controllers/user.controller';

const router = express.Router();

// Public routes
router.get('/', getUsers);
router.get('/:userId', getUserById);
router.get('/:userId/favorites', getFavorites);
router.get('/:userId/recipes', getCreatedRecipes);

// Private routes

export default router;