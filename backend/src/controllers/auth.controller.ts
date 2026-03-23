import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { IApiResponse } from '../types';
import { deleteOldAvatarIfLocal } from '../middleware/upload.middleware';
import { config } from '../config';
 

const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    config.jwtSecret as string,
    { expiresIn: config.jwtExpire || '7d' } as any
  );
};

const setTokenCookie = (res: Response, token: string): void => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    path: '/',
    domain: 'localhost'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (
  req: Request,
  res: Response<IApiResponse<any>>
): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await UserModel.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        error: 'User already exists'
      });
      return;
    }

    // Create new user
    const user = new UserModel({
      username,
      email,
      password,
      avatar: 'https://picsum.photos/200/200'
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
    console.error('❌ Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (
  req: Request,
  res: Response<IApiResponse<any>>
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await UserModel.findOne({ email });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
      return;
    }

    // Generate token
    const token = generateToken(user._id.toString());
    
    // Set token in cookie
    setTokenCookie(res, token);

    // Return token and user data
    res.json({
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
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (
  req: AuthRequest,
  res: Response<IApiResponse<any>>
): Promise<void> => {
  try {
    const user = await UserModel.findById(req.userId)
      .select('-password');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve profile'
    });
  }
};

// @desc Update user profile
// @route PUT /api/auth/profile
// @access Private
export const updateProfile = async (
  req: AuthRequest,
  res: Response<IApiResponse<any>>
): Promise<void> => {
  let oldAvatarUrl: string | undefined;

  try {
    const { username, bio, avatar } = req.body;

    const user = await UserModel.findById(req.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Store old avatar URL before updating
    oldAvatarUrl = user.avatar;

    // Update fields if provided
    if (username) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (avatar) user.avatar = avatar;

    await user.save();

    if (oldAvatarUrl && avatar !== oldAvatarUrl) {
      deleteOldAvatarIfLocal(oldAvatarUrl);
    }

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
    console.error('❌ Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
};

// @desc Update user avatar
// @route POST /api/auth/avatar
// @access Private
export const updateAvatar = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  let oldAvatarUrl: string | undefined;
  
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
      return;
    }

    const userId = req.userId!;
    const user = await UserModel.findById(userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
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
    console.error('❌ Update avatar error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update avatar'
    });
  }
}; 

// @desc Change user password
// @route PUT /api/auth/password
// @access Private
export const changePassword = async (
  req: AuthRequest,
  res: Response<IApiResponse<any>>
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await UserModel.findById(req.userId);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Check current password
    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: 'Current password is incorrect'
      });
      return;
    }

    // Update to new password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('❌ Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
};

// @desc Logout user
// @route POST /api/auth/logout
// @access Private
export const logout = async (
  _req: AuthRequest,
  res: Response<IApiResponse<null>>
): Promise<void> => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  });
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};