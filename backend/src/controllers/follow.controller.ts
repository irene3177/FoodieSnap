import { NextFunction, Response } from 'express';
import { AuthRequest } from '../types';
import { UserModel } from '../models/User.model';
import NotFoundError from '../errors/notFoundError';
import BadRequestError from '../errors/badRequestError';
import ConflictError from '../errors/conflictError';

const getParamAsString = (param: string | string[]): string => {
  return Array.isArray(param) ? param[0] : param;
};

// POST /api/follow/:userId - Follow a user
export const followUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUserId = req.userId!;  // auth user (who is following)
    const userId = getParamAsString(req.params.userId); // user to follow

    // Cannot follow yourself
    if (currentUserId === userId) {
      return next(BadRequestError('You cannot follow yourself'));
    }

    // Check if user to follow exists
    const userToFollow = await UserModel.findById(userId);
    if (!userToFollow) {
      return next(NotFoundError('User not found'));
    }

    // Check if already following
    const currentUser = await UserModel.findById(currentUserId);
    if (currentUser?.following?.includes(userId as any)) {
      return next(ConflictError('Already following this user'));
    }

    // Add to following and followers
    const updatedCurrentUser = await UserModel.findByIdAndUpdate(
      currentUserId,
      { $addToSet: { following: userId } },
      { returnDocument: 'after' }
    );

    // Update target user's followers list (who is being followed)
    const updatedTargetUser = await UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { followers: currentUserId } },
      { returnDocument: 'after' }
    );

    res.json({
      success: true,
      data: {
        userId,
        isFollowing: true,
        followersCount: updatedTargetUser?.followers?.length || 0,
        followingCount: updatedCurrentUser?.following?.length || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/follow/:userId - Unfollow a user
export const unfollowUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUserId = req.userId!; // auth user (who is unfollowing)
    const userId = getParamAsString(req.params.userId); // user to unfollow

    // Cannot unfollow yourself
    if (currentUserId === userId) {
      return next(BadRequestError('You cannot unfollow yourself'));
    }

    // Check if user exists
    const userToUnfollow = await UserModel.findById(userId);
    if (!userToUnfollow) {
      return next(NotFoundError('User not found'));
    }

    // Remove from following and followers
    const updatedCurrentUser = await UserModel.findByIdAndUpdate(
      currentUserId,
      { $pull: { following: userId } },
      { returnDocument: 'after' }
    );

    const updatedTargetUser = await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { followers: currentUserId } },
      { returnDocument: 'after' }
    );

    res.json({
      success: true,
      data: {
        userId,
        isFollowing: false,
        followersCount: updatedTargetUser?.followers?.length || 0,
        followingCount: updatedCurrentUser?.following?.length || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/follow/:userId/followers - Get user's followers
export const getFollowers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUserId = req.userId!;
    const { userId } = req.params;

    const user = await UserModel.findById(userId)
      .populate('followers', 'username avatar bio');

    if (!user) {
      return next(NotFoundError('User not found'));
    }

    // Get current user's following list to check follow status
    let currentUserFollowing: string[] = [];
    if (currentUserId) {
      const currentUser = await UserModel.findById(currentUserId);
      currentUserFollowing = currentUser?.following?.map(id => id.toString()) || [];
    }

    const followersWithFollowStatus = user.followers?.map((follower: any) => ({
      _id: follower._id,
      username: follower.username,
      avatar: follower.avatar,
      bio: follower.bio,
      isFollowing: currentUserFollowing.includes(follower._id.toString())
    }));

    res.json({
      success: true,
      data: followersWithFollowStatus
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/follow/:userId/following - Get users that a user follows
export const getFollowing = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { userId } = req.params;
    const currentUserId = req.userId!;

    const user = await UserModel.findById(userId)
      .populate('following', 'username avatar bio');

    if (!user) {
      return next(NotFoundError('User not found'));
    }
    const isViewingOwn = currentUserId === userId;

    // Get current user's following list to check follow status
    let currentUserFollowing: string[] = [];
    if (currentUserId && !isViewingOwn) {
      const currentUser = await UserModel.findById(currentUserId);
      currentUserFollowing = currentUser?.following?.map(id => id.toString()) || [];
    }

    const followingWithFollowStatus = user.following?.map((followedUser: any) => ({
      _id: followedUser._id,
      username: followedUser.username,
      avatar: followedUser.avatar,
      bio: followedUser.bio,
      isFollowing: isViewingOwn
        ? true
        : currentUserFollowing.includes(followedUser._id.toString())
    }));

    res.json({
      success: true,
      data: followingWithFollowStatus
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/follow/check/:userId - Check if current user follows another user
export const checkFollowStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const currentUserId = req.userId!;
    const userId = getParamAsString(req.params.userId);

    const currentUser = await UserModel.findById(currentUserId);
    const isFollowing = currentUser?.following?.includes(userId as any) || false;

    res.json({
      success: true,
      data: {
        isFollowing
      }
    });
  } catch (error) {
    next(error);
  }
};