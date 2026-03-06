import { Request, Response } from 'express';
import { CommentModel } from '../models/Comment.model';
import { AuthRequest } from '../middleware/auth.middleware';
import { ICommentInput, ICommentUpdateInput, IApiResponse } from '../types';

export const getRecipeComments = async (
  req: Request<{ recipeId: string }>,
  res: Response<IApiResponse<any>>
): Promise<void> => {
  try {
    const { recipeId } = req.params;

    const comments = await CommentModel
      .find({ recipeId })
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      data: comments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch comments'
    });
  }
};

export const createComment = async (
  req: AuthRequest & { body: ICommentInput},
  res: Response<IApiResponse<any>>
): Promise<void> => {
  try {
    const { text, recipeId, rating } = req.body;
    const userId = req.userId!;
    const user = req.user!;

    const comment = new CommentModel({
      text,
      recipeId,
      userId,
      userName: user.username,
      userAvatar: user.avatar,
      rating: rating || undefined,
      likedBy: []
    });

    await comment.save();

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to create comment'
    });
  }
};

export const updateComment = async (
  req: AuthRequest & { params: { id: string }; body: ICommentUpdateInput },
  res: Response<IApiResponse<any>>
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
      { new: true, runValidators: true }
    );

    if (!comment) {
      res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
      return;
    }

    res.json({
      success: true,
      data: comment
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Failed to update comment'
    });
  }
};

export const toggleLike = async (
  req: AuthRequest & { params: { id: string } },
  res: Response<IApiResponse<any>>
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const comment = await CommentModel.findById(id);

    if (!comment) {
      res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
      return;
    }

    const hasLiked = comment.likedBy.includes(userId as any);

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
    res.status(400).json({
      success: false,
      error: 'Failed to toggle like'
    });
  }
};

export const deleteComment = async (
  req: AuthRequest & { params: { id: string } },
  res: Response<IApiResponse<null>>
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const comment = await CommentModel.findOneAndDelete({ _id: id, userId });

    if (!comment) {
      res.status(404).json({
        success: false,
        error: 'Comment not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
};