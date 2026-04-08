import { Router } from 'express';
import {
  getRecipeComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLike
} from '../controllers/comments.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validationHandler';
import {
  validateCreateComment,
  validateUpdateComment,
  validateCommentId,
  validateRecipeId
} from '../validations/comments.validation';



const router = Router();

router.get('/recipe/:recipeId', validate(validateRecipeId), getRecipeComments);

// Protected routes
router.use(authMiddleware);
router.post('/', validate(validateCreateComment), createComment);
router.put('/:id', validate(validateUpdateComment), updateComment);
router.post('/:id/like', validate(validateCommentId), toggleLike);
router.delete('/:id', validate(validateCommentId), deleteComment);

export default router;