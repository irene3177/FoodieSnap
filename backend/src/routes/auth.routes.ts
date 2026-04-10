import { Router } from 'express';
import { uploadAvatar } from '../middleware/upload.middleware';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  updateAvatar,
  changePassword,
  deleteUser
} from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validationHandler';
import {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation
} from '../validations/auth.validation';


const router = Router();

// Public routes
router.post('/register',authLimiter, validate(registerValidation), register);
router.post('/login', authLimiter, validate(loginValidation), login);
router.post('/logout', logout);

// Protected routes (require authentication)
router.use(authMiddleware);
router.get('/me', getMe);
router.put('/profile', validate(updateProfileValidation), updateProfile);
router.post('/avatar', uploadAvatar, updateAvatar);
router.put('/password', validate(changePasswordValidation), changePassword);
router.delete('/user', deleteUser)

export default router;