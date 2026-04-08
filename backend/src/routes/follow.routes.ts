import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validationHandler';
import { validateUserId } from '../validations/follow.validation';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  checkFollowStatus
} from '../controllers/follow.controller';

const router = Router();


// All routes require authentication
router.use(authMiddleware);
router.get('/:userId/followers', validate(validateUserId), getFollowers);
router.get('/:userId/following', validate(validateUserId), getFollowing);

// Follow/Unfollow
router.post('/:userId', validate(validateUserId), followUser);
router.delete('/:userId', validate(validateUserId), unfollowUser);

// Check follow status
router.get('/check/:userId', validate(validateUserId), checkFollowStatus);


export default router;