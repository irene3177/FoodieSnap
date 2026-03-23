import { Request, Response } from 'express';
import { UserModel } from '../models/User.model';
import { IUserResponse, IUserListItem } from '../types';

// @desc    Get user by ID
// @route   GET /api/users/:userId
// @access  Public
export const getUserById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const user = await UserModel.findById(userId).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: user.toJSON() as unknown as IUserResponse // fix this later
    });
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user'
    });
  }
};

// @desc    Get user's recipes (public)
// @route   GET /api/users/:userId/saved
// @access  Public
export const getCreatedRecipes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await UserModel.findById(userId)
      .select('createdRecipes')
      .populate('createdRecipes');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        createdRecipes: user.createdRecipes || []
      }
    });
  } catch (error) {
    console.error('❌ Get created recipes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get created recipes'
    });
  }
};

// @desc    Get user's favorites (public)
// @route   GET /api/users/:userId/favorites
// @access  Public
export const getFavorites = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;

    const user = await UserModel.findById(userId)
      .select('favorites username')
      .populate('favorites'); // если есть модель Recipe

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        userId: user._id,
        username: user.username,
        favorites: user.favorites || []
      }
    });
  } catch (error) {
    console.error('❌ Get favorites error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get favorites'
    });
  }
};

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || 'username';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        username: { $regex: search, $options: 'i' } // case-insensitive search
      };
    }

    const users = await UserModel.find(query)
      .select('username avatar bio savedRecipes')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

      // Total count for pagination
      const total = await UserModel.countDocuments(query);

      const formattedUsers: IUserListItem[] = users.map(user => ({
        _id: user._id.toString(),
        username: user.username,
        avatar: user.avatar,
        bio: user.bio,
        recipeCount: user.createdRecipes?.length || 0
      }));

      res.json({
      success: true,
      data: {
        users: formattedUsers,
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    });
  }
};