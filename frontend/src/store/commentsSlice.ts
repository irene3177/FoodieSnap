import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit';
import { Comment } from '../types';
import { commentsApi } from '../services/commentsApi';
import { RootState } from './store';

export interface CommentState {
  comments: Record<string, Comment[]>;  // key: recipeId
  loading: boolean;
  error: string | null;
}

const initialState: CommentState = {
  comments: {},
  loading: false,
  error: null
};

const selectCommentsState = (state: RootState) => state.comments.comments;

export const selectCommentsByRecipeId = (recipeId: string) => 
  createSelector(
    [selectCommentsState],
    (commentsState) => commentsState[recipeId] || []
  );

export const fetchRecipeComments = createAsyncThunk(
  'comments/fetchRecipeComments',
  async (recipeId: string, { rejectWithValue }) => {
    const response = await commentsApi.getRecipeComments(recipeId);
    if (response.success && response.data) {
      return { recipeId, comments: response.data };
    }
    return rejectWithValue(response.error || 'Failed to fetch comments');
  }
);

export const createComment = createAsyncThunk(
  'comments/createComment',
  async (
    { recipeId, text, rating }: {
      recipeId: string;
      text: string;
      rating?: number;
    },
    { rejectWithValue, dispatch }
  ) => {
    const response = await commentsApi.createComment({ recipeId, text, rating });
    if (response.success && response.data) {
      // Refresh comments after creating
      dispatch(fetchRecipeComments(recipeId));
      return response.data;
    }
    return rejectWithValue(response.error || 'Failed to create comment');
  }
);

export const updateComment = createAsyncThunk(
  'comments/updateComment',
  async (
    { commentId, text }: { commentId: string; text: string },
    { rejectWithValue, getState, dispatch }
  ) => {
    const response = await commentsApi.updateComment(commentId, text);
    if (response.success && response.data) {
      // Find which recipe this comment belongs to
      const state = getState() as { comments: CommentState };
      let recipeId = '';
      for (const [id, comments] of Object.entries(state.comments.comments)) {
        if (comments.some((c: Comment) => c._id === commentId)) {
          recipeId = id;
          break;
        }
      }
      if (recipeId) {
        dispatch(fetchRecipeComments(recipeId));
      }
      return response.data;
    }
    return rejectWithValue(response.error || 'Failed to update comment');
  }
);

export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async (commentId: string, { rejectWithValue, getState, dispatch }) => {
    const response = await commentsApi.deleteComment(commentId);
    if (response.success) {
      // Find which recipe this comment belongs to
      const state = getState() as { comments: CommentState };
      let recipeId = '';
      for (const [id, comments] of Object.entries(state.comments.comments)) {
        if (comments.some((c: Comment) => c._id === commentId)) {
          recipeId = id;
          break;
        }
      }
      if (recipeId) {
        dispatch(fetchRecipeComments(recipeId));
      }
      return commentId;
    }
    return rejectWithValue(response.error || 'Failed to delete comment');
  }
);

export const toggleLike = createAsyncThunk(
  'comments/toggleLike',
  async (
    { commentId, recipeId }: { commentId: string; recipeId: string },
    { rejectWithValue, dispatch }
  ) => {
    const response = await commentsApi.toggleLike(commentId);
    if (response.success) {
      // Refresh comments to get updated likes
      dispatch(fetchRecipeComments(recipeId));
      return { commentId, ...response.data };
    }
    return rejectWithValue(response.error || 'Failed to toggle like');
  }
);

const commentSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    clearComments: (state) => {
      state.comments = {};
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchRecipeComments
      .addCase(fetchRecipeComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRecipeComments.fulfilled, (state, action) => {
        state.loading = false;
        state.comments[action.payload.recipeId] = action.payload.comments;
      })
      .addCase(fetchRecipeComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // createComment
      .addCase(createComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createComment.fulfilled, (state) => {
        state.loading = false;
        // Comments are refreshed by the thunk
      })
      .addCase(createComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // updateComment
      .addCase(updateComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateComment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // deleteComment
      .addCase(deleteComment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteComment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteComment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // toggleLike
      .addCase(toggleLike.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(toggleLike.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(toggleLike.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export const { clearComments, clearError } = commentSlice.actions;
export default commentSlice.reducer;