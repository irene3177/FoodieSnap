import express from 'express';
import {
  getUserById,
  getCreatedRecipes,
  getFavorites,
  getUsers
} from '../controllers/user.controller';
import { optionalAuth } from '../middleware/optionalAuth';
import { validate } from '../middleware/validationHandler';
import { validateUserId, validateGetUsers } from '../validations/users.validation'; 

const router = express.Router();

// Public routes
router.get('/', validate(validateGetUsers), getUsers);
router.get('/:userId', validate(validateUserId), optionalAuth, getUserById);
router.get('/:userId/favorites', validate(validateUserId), getFavorites);
router.get('/:userId/recipes', validate(validateUserId), getCreatedRecipes);

// Private routes

export default router;