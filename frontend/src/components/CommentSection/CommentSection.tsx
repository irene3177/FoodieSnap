import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { selectCommentsByRecipeId } from '../../store/commentsSlice';
import { useAppDispatch, useAppSelector } from '../../store/store';
import {
  fetchRecipeComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLike
} from '../../store/commentsSlice';
import RatingStars from '../RatingStars/RatingStars';
import { Comment } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { showToast } from '../../store/toastSlice';
import './CommentSection.css';

interface CommentSectionProps {
  recipeId: string;
  recipeTitle: string;
}

function CommentSection({ recipeId }: CommentSectionProps) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [commentRating, setCommentRating] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showRating, setShowRating] = useState(false);

  const selectComments = useMemo(() => selectCommentsByRecipeId(recipeId), [recipeId]);

  const comments = useAppSelector(selectComments);
  const loading = useAppSelector(state => state.comments.loading);

  useEffect(() => {
    dispatch(fetchRecipeComments(recipeId));
  }, [dispatch, recipeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      dispatch(showToast({
        message: 'Please log in to leave a comment',
        type: 'error'
      }));
      return;
    }

    if (newComment.trim()) {
      await dispatch(createComment({
        recipeId,
        text: newComment.trim(),
        rating: commentRating || undefined
      }));
      setNewComment('');
      setCommentRating(0);
      setShowRating(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment._id);
    setEditText(comment.text);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (editText.trim()) {
      await dispatch(updateComment({
        commentId,
        text: editText.trim()
      }));
      setEditingId(null);
      setEditText('');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      await dispatch(deleteComment(commentId));
    }
  };

  const handleLike = async (commentId: string) => {
    if (!user) {
      dispatch(showToast({
        message: 'Please log in to like a comment',
        type: 'error'
      }));
      return;
    }
    await dispatch(toggleLike({ commentId, recipeId }));
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  // Get user initial from username
  const userInitial = user?.username?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="comment-section">
      <h3 className="comment-section__title">
        Comments ({comments.length})
      </h3>

      {/* Add comment form */}
      <form className="comment-section__form" onSubmit={handleSubmit}>
        <div className="comment-section__form-header">
          <div className="comment-section__avatar">
            {user?.avatar ? (
              <img 
                src={user?.avatar}
                alt="User avatar"
              />
            ) : (
              <span>{userInitial}</span>
            )}
          </div>
          <div className="comment-section__form-fields">
            <textarea
              className="comment-section__input"
              placeholder={user ? "Share your thoughts..." : "Please log in to leave a comment"}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              disabled={!user}
            />
            
            {showRating && user && (
              <motion.div 
                className="comment-section__rating"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <span>Rate this recipe:</span>
                <RatingStars 
                  recipeId={recipeId} 
                  size="small" 
                  interactive={true}
                  showCount={false}
                />
              </motion.div>
            )}

            {user && (
              <div className="comment-section__form-actions">
                <button
                  type="button"
                  className="comment-section__rating-toggle"
                  onClick={() => setShowRating(!showRating)}
                >
                  {showRating ? '− Remove rating' : '+ Add rating'}
                </button>
                <motion.button
                  type="submit"
                  className="comment-section__submit"
                  disabled={!newComment.trim() || loading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Post Comment
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Comments list */}
      <div className="comment-section__list">
        <AnimatePresence>
          {comments.map((comment) => (
            <motion.div
              key={comment._id}
              className="comment-section__item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              layout
            >
              <div className="comment-section__item-header">
                <img 
                  src={comment.userAvatar || 'https://picsum.photos/32/32'} 
                  alt={comment.userName}
                  className="comment-section__avatar"
                />
                <div className="comment-section__item-info">
                  <span className="comment-section__user-name">{comment.userName}</span>
                  <span className="comment-section__timestamp">
                    {formatDate(comment.createdAt)}
                    {comment.isEdited && ' (edited)'}
                  </span>
                </div>
              </div>

              {editingId === comment._id ? (
                <div className="comment-section__edit-form">
                  <textarea
                    className="comment-section__edit-input"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    autoFocus
                  />
                  <div className="comment-section__edit-actions">
                    <button
                      className="comment-section__edit-save"
                      onClick={() => handleSaveEdit(comment._id)}
                    >
                      Save
                    </button>
                    <button
                      className="comment-section__edit-cancel"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="comment-section__text">{comment.text}</p>
                  
                  <div className="comment-section__item-footer">
                    <button
                      className={`comment-section__like ${comment.likedBy?.includes(user?._id || '') ? 'comment-section__like--liked' : ''}`}
                      onClick={() => handleLike(comment._id)}
                    >
                      ❤️ {comment.likes > 0 && comment.likes}
                    </button>


                    {user?._id === comment.userId && (
                      <div className="comment-section__item-actions">
                        <button
                          className="comment-section__item-action"
                          onClick={() => handleEdit(comment)}
                        >
                          Edit
                        </button>
                        <button
                          className="comment-section__item-action comment-section__item-action--delete"
                          onClick={() => handleDelete(comment._id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CommentSection;