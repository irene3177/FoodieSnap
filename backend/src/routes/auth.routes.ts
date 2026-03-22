import { Router } from 'express';
import { body } from 'express-validator';
import { uploadAvatar } from '../middleware/upload.middleware';
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  updateAvatar,
  changePassword
} from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Validation rules
const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscore'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
];

// Validation for login
const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Validation for profile update
const validateProfile = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscore'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Bio must be less than 200 characters'),
  
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL')
];

// Validation for password change
const validatePassword = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters')
];

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);

// Protected routes (require authentication)
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, validateProfile, updateProfile);
router.post('/avatar', authMiddleware, uploadAvatar, updateAvatar);
router.put('/password', authMiddleware, validatePassword, changePassword);

export default router;