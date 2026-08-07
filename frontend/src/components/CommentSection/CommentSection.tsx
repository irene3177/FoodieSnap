import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TextareaAutosize from 'react-textarea-autosize';
import { selectCommentsByRecipeId } from '../../store/commentsSlice';
import { useAppDispatch, useAppSelector } from '../../store/store';
import {
  fetchRecipeComments,
  createComment,
  updateComment,
  deleteComment,
  toggleLike
} from '../../store/commentsSlice';
import Avatar from '../Avatar';
import RatingStars from '../RatingStars/RatingStars';
import { Comment } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { showToast } from '../../store/toastSlice';
import { MdEdit, MdDelete, MdFavorite, MdFavoriteBorder } from 'react-icons/md';
import { Link } from 'react-router-dom';

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

  const isLiked = (comment: Comment) => {
    console.log(comment.userId);
    return comment.likedBy?.includes(user?._id || '');
  };


  return (
    <div className="mt-12 pt-8 border-t-2">
      <h3 className="text-2xl text-secondary mb-6">
        Comments <span className="text-lg text-muted">({comments.length})</span>
      </h3>

      {/* Add comment form */}
      <form className="mb-8 bg-secondary rounded-xl p-6 border" onSubmit={handleSubmit}>
        <div className="flex gap-4 flex-col sm:flex-row">
          {/* Avatar */}
          <Avatar to="/me" src={user?.avatar} username={user?.username} size="lg" border />
          <div className="flex-1 space-y-3">
            <TextareaAutosize
              className="input
                resize-none min-h-[60px]
                disabled:opacity-60 overflow-hidden scrollbar-hide"
              placeholder={user ? "Share your thoughts..." : "Please log in to leave a comment"}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
              disabled={!user}
            />
            
            {showRating && user && (
              <motion.div 
                className="flex flex-wrap items-center gap-4 rounded-lg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <span className="text-sm text-secondary">Rate this recipe:</span>
                <RatingStars 
                  recipeId={recipeId} 
                  size="small" 
                  interactive={true}
                  showCount={false}
                />
              </motion.div>
            )}

            {user && (
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <button
                  type="button"
                  className="text-sm text-accent hover:text-accent-hover transition-colors bg-transparent border-none cursor-pointer"
                  onClick={() => setShowRating(!showRating)}
                >
                  {showRating ? '- Remove rating' : '+ Add rating'}
                </button>
                <button
                  type="submit"
                  className="btn-primary text-sm"
                  disabled={!newComment.trim() || loading}
                >
                  Post Comment
                </button>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {comments.map((comment) => (
            <motion.div
              key={comment._id}
              className="bg-secondary rounded-xl p-5 border"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              layout
            >
              <div className="flex gap-3 mb-3">
                <Avatar
                  src={comment.userAvatar}
                  username={comment.userName}
                  to={`/user/${comment.userId}`}
                  size="md"
                  border
                />
                <div className="flex flex-col">
                  <Link
                    to={`/user/${comment.userId}`}
                    className="font-semibold text-primary text-sm flex-shrink-0 transition-all duration-700"
                  >{comment.userName}</Link>
                  <span className="text-xs text-muted cursor-default">
                    {formatDate(comment.createdAt)}
                    {comment.isEdited && ' (edited)'}
                  </span>
                </div>
              </div>

              {editingId === comment._id ? (
                <div className="space-y-3">
                  <TextareaAutosize
                    className="input
                      resize-none min-h-[60px]
                      disabled:opacity-60 overflow-hidden scrollbar-hide"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      className="btn-secondary"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn-primary text-sm"
                      onClick={() => handleSaveEdit(comment._id)}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-primary leading-relaxed my-3 whitespace-pre-wrap text-sm">{comment.text}</p>
                  
                  <div className="flex justify-between items-center mt-2">
                    <button
                      className="
                        flex items-center gap-1.5 text-sm
                        bg-transparent border-none cursor-pointer
                        hover:scale-105
                        transition-all duration-700"
                      onClick={() => handleLike(comment._id)}
                    >
                      {isLiked(comment) ? (
                        <MdFavorite className="text-heart hover:text-heart-hover" />
                      ) : (
                        <MdFavoriteBorder className="text-muted hover:text-heart-hover" />
                      )} 
                      {comment.likes > 0 ? (
                        <span className="text-xs">{comment.likes}</span>
                      ) : (
                        <span className="text-xs">Like comment</span>
                      )}
                    </button>


                    {user?._id === comment.userId && (
                      <div className="flex gap-3">
                        <button
                          title="Edit comment"
                          className="text-muted hover:text-accent transition-colors bg-transparent border-none cursor-pointer flex items-center"
                          onClick={() => handleEdit(comment)}
                          aria-label="Edit comment"
                        >
                          <MdEdit className="text-lg" />
                        </button>
                        <button
                          title="Delete comment"
                          className="text-muted hover:text-accent transition-colors bg-transparent border-none cursor-pointer flex items-center"
                          onClick={() => handleDelete(comment._id)}
                          aria-label="Delete comment"
                        >
                          <MdDelete className="text-lg" />
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