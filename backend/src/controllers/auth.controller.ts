import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.model';
import { RecipeModel } from '../models/Recipe.model';
import { CommentModel } from '../models/Comment.model';
import { AuthRequest } from '../types';
import { deleteOldAvatarIfLocal } from '../middleware/upload.middleware';
import { config } from '../config';
import ConflictError from '../errors/conflictError';
import UnauthorizedError from '../errors/unauthorizedError';
import NotFoundError from '../errors/notFoundError';
import BadRequestError from '../errors/badRequestError';
 

const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    config.jwtSecret as string,
    { expiresIn: config.jwtExpire || '7d' } as any
  );
};

const setTokenCookie = (res: Response, token: string): void => {
  res.cookie('token', token, {
    ...config.cookieOptions
  });
};

// POST /api/auth/register
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, email, password } = req.body;
  
    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }]
    });
  
    if (existingUser) {
      return next(ConflictError('User already exists'));
    }
  
    // Create new user
    const user = new UserModel({
      username,
      email,
      password
    });
  
    await user.save();
  
    // Generate token
    const token = generateToken(user._id.toString());
  
    // Set token in cookie
   setTokenCookie(res, token);
  
    // Return token and user data
    res.status(201).json({
      success: true,
      data: {
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
  
    // Find user by email
    const user = await UserModel.findOne({ email }).select('+password');
    if (!user) {
      return next(UnauthorizedError('Invalid credentials'));
    }
  
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(UnauthorizedError('Invalid credentials'));
    }
  
    // Generate token
    const token = generateToken(user._id.toString());
    
    // Set token in cookie
    setTokenCookie(res, token);

    const { password: _, ...userWithoutPassword } = user.toObject();

    // Return token and user data
    res.json({
      success: true,
      data: {
        user: {
          _id: userWithoutPassword._id,
          username: userWithoutPassword.username,
          email: userWithoutPassword.email,
          avatar: userWithoutPassword.avatar,
          bio: userWithoutPassword.bio
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me
export const getMe = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await UserModel.findById(req.userId)
      .select('-password');
  
    if (!user) {
      return next(NotFoundError('User not found'));
    }
  
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/auth/profile
export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { username, bio } = req.body;
  
    const user = await UserModel.findById(req.userId);
  
    if (!user) {
      return next(NotFoundError('User not found'));
    }
  
    // Update fields if provided
    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
  
    await user.save();
  
    res.json({
      success: true,
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/avatar
export const updateAvatar = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let oldAvatarUrl: string | undefined;
    
    if (!req.file) {
      return next(BadRequestError('No file uploaded'));
    }
  
    const userId = req.userId!;
    const user = await UserModel.findById(userId);
  
    if (!user) {
      return next(NotFoundError('User not found'));
    }
  
    oldAvatarUrl = user.avatar;
  
    // Construct the URL for the uploaded avatar
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;
  
    // Update user avatar
    user.avatar = avatarUrl;
    await user.save();
  
    if (oldAvatarUrl) {
      deleteOldAvatarIfLocal(oldAvatarUrl);
    }
  
    res.json({
      success: true,
      data: {
        avatar: avatarUrl
      }
    });
  } catch (error) {
    next(error);
  }
}; 

// PUT /api/auth/password
export const changePassword = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
  
    const user = await UserModel.findById(req.userId).select('+password');
  
    if (!user) {
      return next(NotFoundError('User not found'));
    }
  
    // Check current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return next(UnauthorizedError('Current password is incorrect'));
    }
  
    // Update to new password
    user.password = newPassword;
    await user.save();
  
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/auth/user
export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.userId!;
    
    // Find user
    const user = await UserModel.findById(userId);
    
    if (!user) {
      return next(NotFoundError('User not found'));
    }
    
    // Delete user's avatar if it's local
    if (user.avatar && user.avatar.includes('/uploads/')) {
      deleteOldAvatarIfLocal(user.avatar);
    }
    
    // Delete all user's recipes
    await RecipeModel.deleteMany({ author: userId });
    
    // Delete all user's comments
    await CommentModel.deleteMany({ userId: userId });
    
    // Remove user from favorites and createdRecipes of other users
    await UserModel.updateMany(
      { favorites: userId },
      { $pull: { favorites: userId } }
    );
    
    await UserModel.updateMany(
      { createdRecipes: userId },
      { $pull: { createdRecipes: userId } }
    );
    
    // Delete the user
    await UserModel.findByIdAndDelete(userId);
    
    // Clear token cookie
    res.clearCookie('token', {
      httpOnly: config.cookieOptions.httpOnly,
      secure: config.cookieOptions.secure,
      sameSite: config.cookieOptions.sameSite,
      expires: config.cookieOptions.expires,
      path: config.cookieOptions.path,
      domain: config.cookieOptions.domain
    });
    
    res.json({
      success: true,
      message: 'User account deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout
export const logout = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    res.clearCookie('token', {
      httpOnly: config.cookieOptions.httpOnly,
      secure: config.cookieOptions.secure,
      sameSite: config.cookieOptions.sameSite,
      expires: config.cookieOptions.expires,
      path: config.cookieOptions.path,
      domain: config.cookieOptions.domain
    });
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};