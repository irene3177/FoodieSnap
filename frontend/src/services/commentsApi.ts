import { get, post, del, put } from '../utils/apiClient';
import {
  ApiResponse,
  Comment,
  LikeResponse,
  CreateCommentData
} from '../types';

export const commentsApi = {
  // Get comments for a recipe
  getRecipeComments: async (recipeId: string): Promise<ApiResponse<Comment[]>> => {
    return get<Comment[]>(`/comments/recipe/${recipeId}`);
  },

  // Create a new comment
  createComment: async (
    data: CreateCommentData
  ): Promise<ApiResponse<Comment>> => {
    return post<Comment>('/comments', data);
  },

  // Update a comment
  updateComment: async (
    commentId: string,
    text: string
  ): Promise<ApiResponse<Comment>> => {
    return put<Comment>(`/comments/${commentId}`, { text });
  },

  // Delete a comment
  deleteComment: async (commentId: string): Promise<ApiResponse<null>> => {
    return del<null>(`/comments/${commentId}`);
  },

  // Toggle like on a comment
  toggleLike: async (commentId: string): Promise<ApiResponse<LikeResponse>> => {
    return post<LikeResponse>(`/comments/${commentId}/like`);
  }
};
