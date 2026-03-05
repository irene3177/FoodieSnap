import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useComments } from '../../context/CommentContext';
import { Comment } from '../../types/comment.types';
import RatingStars from '../RatingStars/RatingStars';
import './CommentSection.css';

interface CommentSectionProps {
  recipeId: number;
  recipeTitle: string;
}

function CommentSection({ recipeId }: CommentSectionProps) {
  const { getCommentsForRecipe, addComment, editComment, deleteComment, likeComment } = useComments();
  const [newComment, setNewComment] = useState('');
  const [commentRating, setCommentRating] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showRating, setShowRating] = useState(false);

  const comments = getCommentsForRecipe(recipeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      addComment(recipeId, newComment.trim(), commentRating || undefined);
      setNewComment('');
      setCommentRating(0);
      setShowRating(false);
    }
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const handleSaveEdit = (commentId: string) => {
    if (editText.trim()) {
      editComment(recipeId, commentId, editText.trim());
      setEditingId(null);
      setEditText('');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="comment-section">
      <h3 className="comment-section__title">
        Comments ({comments.length})
      </h3>

      {/* Add comment form */}
      <form className="comment-section__form" onSubmit={handleSubmit}>
        <div className="comment-section__form-header">
          <img 
            src="https://via.placeholder.com/32" 
            alt="User avatar" 
            className="comment-section__avatar"
          />
          <div className="comment-section__form-fields">
            <textarea
              className="comment-section__input"
              placeholder="Share your thoughts about this recipe..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={2}
            />
            
            {showRating && (
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
                disabled={!newComment.trim()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Post Comment
              </motion.button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments list */}
      <div className="comment-section__list">
        <AnimatePresence>
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              className="comment-section__item"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              layout
            >
              <div className="comment-section__item-header">
                <img 
                  src={comment.userAvatar || 'https://via.placeholder.com/32'} 
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

              {editingId === comment.id ? (
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
                      onClick={() => handleSaveEdit(comment.id)}
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
                      className="comment-section__like"
                      onClick={() => likeComment(recipeId, comment.id)}
                    >
                      ❤️ {comment.likes > 0 && comment.likes}
                    </button>
                    
                    <div className="comment-section__item-actions">
                      <button
                        className="comment-section__item-action"
                        onClick={() => handleEdit(comment)}
                      >
                        Edit
                      </button>
                      <button
                        className="comment-section__item-action comment-section__item-action--delete"
                        onClick={() => deleteComment(recipeId, comment.id)}
                      >
                        Delete
                      </button>
                    </div>
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