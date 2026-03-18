import { Router } from 'express';
import {
  getRecipeComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLike
} from '../controllers/comments.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validateComment } from '../middleware/validation.middleware';


const router = Router();

router.get('/recipe/:recipeId', getRecipeComments);

// Protected routes
router.post('/', authMiddleware, validateComment, createComment);
router.put('/:id', authMiddleware, validateComment, updateComment);
router.delete('/:id', authMiddleware, deleteComment);
router.post('/:id/like', authMiddleware, toggleLike);

export default router;