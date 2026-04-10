import { NextFunction, Request, Response } from 'express';
import { CommentModel } from '../models/Comment.model';
import { AuthRequest } from '../types';
import { validateNumber } from '../utils/validation';
import { ICommentInput, ICommentUpdateInput } from '../types';
import NotFoundError from '../errors/notFoundError';

// GET /api/comments/recipe/:recipeId 
export const getRecipeComments = async (
  req: Request<{ recipeId: string }>,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { recipeId } = req.params;
  
    const comments = await CommentModel
      .find({ recipeId })
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/comments
export const createComment = async (
  req: AuthRequest & { body: ICommentInput},
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { text, recipeId, rating } = req.body;
    const userId = req.userId!;
    const user = req.user!;

    const validatedRating = rating ? validateNumber(rating, 0, 1, 5) : undefined;
  
    const comment = new CommentModel({
      text,
      recipeId,
      userId,
      userName: user.username,
      userAvatar: user.avatar,
      rating: validatedRating,
      likes: 0,
      likedBy: []
    });
  
    await comment.save();
  
    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/comments/:id
export const updateComment = async (
  req: AuthRequest & { params: { id: string }; body: ICommentUpdateInput },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const updates = req.body;

    const comment = await CommentModel.findOneAndUpdate(
      { _id: id, userId },
      {
        ...updates,
        isEdited: true,
      },
      { returnDocument: 'after', runValidators: true }
    );
  
    if (!comment) {
      return next(NotFoundError('Comment not found'));
    }
  
    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/comments/:id/like
export const toggleLike = async (
  req: AuthRequest & { params: { id: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const comment = await CommentModel.findById(id);
  
    if (!comment) {
      return next(NotFoundError('Comment not found'));
    }
  
    const hasLiked = comment.likedBy.includes(userId as any) || false;
  
    if (hasLiked) {
      comment.likedBy = comment.likedBy.filter(
        id => id.toString() !== userId
      );
      comment.likes -= 1;
    } else {
      comment.likedBy.push(userId as any);
      comment.likes += 1;
    }
  
    await comment.save();
  
    res.json({
      success: true,
      data: {
        likes: comment.likes,
        likedBy: comment.likedBy,
        hasLiked: !hasLiked
      }
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/comments/:id
export const deleteComment = async (
  req: AuthRequest & { params: { id: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
  
    const comment = await CommentModel.findOneAndDelete({ _id: id, userId });
  
    if (!comment) {
      return next(NotFoundError('Comment not found'));
    }
  
    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};