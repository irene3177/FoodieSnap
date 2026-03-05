import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Comment,
  CommentState,
  CommentAction,
  CommentContextType
} from '../types/comment.types';

const initialState: CommentState = {
  comments: {},
  loading: false,
  error: null
};

const commentReducer = (state: CommentState, action: CommentAction): CommentState => {
  switch (action.type) {
    case 'ADD_COMMENT': {
      const { recipeId, comment } = action.payload;
      const recipeComments = state.comments[recipeId] || [];

      return {
        ...state,
        comments: {
          ...state.comments,
          [recipeId]: [comment, ...recipeComments] // Newest first
        }
      };
    }
    case 'EDIT_COMMENT' : {
      const { recipeId, commentId, text } = action.payload;
      const recipeComments = state.comments[recipeId] || [];

      const updatedComments = recipeComments.map(comment => 
        comment.id === commentId
          ? { ...comment, text, isEdited: true, updatedAt: Date.now() }
          : comment
      );

      return {
        ...state,
        comments: {
          ...state.comments,
          [recipeId]: updatedComments
        }
      };
    }

    case 'DELETE_COMMENT': {
      const { recipeId, commentId } = action.payload;
      const recipeComments = state.comments[recipeId] || [];

      const filteredComments = recipeComments.filter(
        comment => comment.id !== commentId
      );

      return {
        ...state,
        comments: {
          ...state.comments,
          [recipeId]: filteredComments
        }
      };
    }

    case 'LIKE_COMMENT': {
      const { recipeId, commentId } = action.payload;
      const recipeComments = state.comments[recipeId] || [];

      const updatedComments = recipeComments.map(comment => 
        comment.id === commentId
          ? { ...comment, likes: (comment.likes || 0) + 1 }
          : comment
      );

      return {
        ...state,
        comments: {
          ...state.comments,
          [recipeId]: updatedComments
        }
      };
    }

    case 'SET_COMMENTS' : 
      return {
        ...state,
        comments: {
          ...state.comments,
          [action.payload.recipeId]: action.payload.comments
        },
        loading: false
      };

    case 'SET_LOADING' :
      return {
        ...state,
        loading: action.payload
      };

    case 'SET_ERROR' :
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    default:
      return state;
  }
};

const CommentContext = createContext<CommentContextType | undefined>(undefined);

interface CommentProviderProps {
  children: ReactNode;
}

// Mock user data (later then this would come from auth)
const MOCK_USER = {
  id: 'user-1',
  name: 'Foodie User',
  avatar: 'https://via.placeholder.com/32'
};

export const CommentProvider: React.FC<CommentProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(commentReducer, initialState);

  // Load comments from localStorage on mount
  useEffect(() => {
    const loadComments = () => {
      try {
        const savedComments = localStorage.getItem('recipe-comments');
        if (savedComments) {
          const parsed = JSON.parse(savedComments);
          Object.entries(parsed).forEach(([recipeId, comments]) => {
            dispatch({
              type: 'SET_COMMENTS',
              payload: {
                recipeId: parseInt(recipeId),
                comments: comments as Comment[]
              }
            });
          });
        }
      } catch (error) {
        console.error('Failed to load comments:', error);
      }
    };

    loadComments();
  },[]);

  // Save comments to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('recipe-comments', JSON.stringify(state.comments));
    } catch (error) {
      console.error('Failed to save comments:', error);
    }
  }, [state.comments]);

  const addComment = (recipeId: number, text: string, rating?: number) => {
    const newComment: Comment = {
      id: uuidv4(),
      recipeId,
      userId: MOCK_USER.id,
      userName: MOCK_USER.name,
      userAvatar: MOCK_USER.avatar,
      text,
      rating,
      createdAt: Date.now(),
      likes: 0,
      isEdited: false
    };

    dispatch({
      type: 'ADD_COMMENT',
      payload: { recipeId, comment: newComment }
    });
  };

  const editComment = (recipeId: number, commentId: string, text: string) => {
    dispatch({
      type: 'EDIT_COMMENT',
      payload: { recipeId, commentId, text }
    });
  };

  const deleteComment = (recipeId: number, commentId: string) => {
    dispatch({
      type: 'DELETE_COMMENT',
      payload: { recipeId, commentId }
    });
  };

  const likeComment = (recipeId: number, commentId: string) => {
    dispatch({
      type: 'LIKE_COMMENT',
      payload: { recipeId, commentId }
    });
  };

  const getCommentsForRecipe = (recipeId: number): Comment[] => {
    return state.comments[recipeId] || [];
  };

  const value: CommentContextType = {
    comments: state.comments,
    loading: state.loading,
    error: state.error,
    addComment,
    editComment,
    deleteComment,
    likeComment,
    getCommentsForRecipe
  };

  return (
    <CommentContext.Provider value={value}>
      {children}
    </CommentContext.Provider>
  );
 };

 export const useComments = (): CommentContextType => {
  const context = useContext(CommentContext);
  if (context === undefined) {
    throw new Error('useComments must be used within a CommentProvider');
  }
  return context;
 };