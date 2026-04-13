import { NextFunction, Request, Response } from 'express';
import { AuthRequest } from '../types';
import { UserModel } from '../models/User.model';
import { IUserListItem } from '../types';
import { validateNumber } from '../utils/validation';
import NotFoundError from '../errors/notFoundError';
import BadRequestError from '../errors/badRequestError';

const getParamAsString = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

// GET /api/users/:userId
export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getParamAsString(req.params.userId);
    const currentUserId = req.userId;

    const user = await UserModel.findById(userId).select('-password');

    if (!user) {
      return next(NotFoundError('User not found'));
    }

    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
      const currentUser = await UserModel.findById(currentUserId);
      isFollowing = currentUser?.following?.some(id => id.toString() === userId) || false;
    }

    const userData = user.toJSON();

    res.json({
      success: true,
      data: {
        ...userData,
        isFollowing,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
        recipeCount: user.createdRecipes?.length || 0
      }
    });
  } catch (error) {
    next(error);
  }
};


// GET /api/users/:userId/saved
export const getCreatedRecipes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getParamAsString(req.params.userId);

    const user = await UserModel.findById(userId)
      .select('createdRecipes')
      .populate('createdRecipes');

    if (!user) {
      return next(NotFoundError('User not found'));
    }

    res.json({
      success: true,
      data: {
        createdRecipes: user.createdRecipes || []
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/users/:userId/favorites
export const getFavorites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = getParamAsString(req.params.userId);

    const user = await UserModel.findById(userId)
      .select('favorites username')
      .populate('favorites');

    if (!user) {
      return next(NotFoundError('User not found'));
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
    next(error);
  }
};

// GET /api/users
export const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = validateNumber(req.query.page, 1, 1, 100);
    const limit = validateNumber(req.query.limit, 10, 1, 50);
    const search = req.query.search as string;
    const sortBy = (req.query.sortBy as string) || 'username';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    const currentUserId = req.user?._id;

    // White list for sortBy to prevent injection
    const allowedSortFields = ['username', 'createdAt'];
    if (!allowedSortFields.includes(sortBy)) {
      return next(BadRequestError('Invalid sort field'));
    }

    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        username: { $regex: search, $options: 'i' } // case-insensitive search
      };
    }

    const users = await UserModel.find(query)
      .select('username avatar bio createdRecipes')
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
        recipeCount: user.createdRecipes?.length || 0,
        isFollowing: user.followers?.includes(currentUserId) || false
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
    next(error);
  }
};