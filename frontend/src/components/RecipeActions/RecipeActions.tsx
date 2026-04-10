import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch } from '../../store/store';
import { recipesApi } from '../../services/recipesApi';
import { showToast } from '../../store/toastSlice';
import { Recipe } from '../../types';
import './RecipeActions.css';

interface RecipeActionsProps {
  recipe: Recipe;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipeId: string) => void;
  isOwner?: boolean;
}

function RecipeActions({ recipe, onEdit, onDelete, isOwner = false }: RecipeActionsProps) {
  const dispatch = useAppDispatch();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOwner) return null;

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onEdit?.(recipe);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    
    const response = await recipesApi.deleteRecipe(recipe._id);
    if (response.success) {
      dispatch(showToast({
        message: 'Recipe deleted successfully',
        type: 'success'
      }));
      onDelete?.(recipe._id);
    } else {
      dispatch(showToast({
        message: 'Failed to delete recipe',
        type: 'error'
      }));
    }
    setIsDeleting(false);
    setShowConfirm(false);
  };

  return (
    <>
      <div className="recipe-actions" onClick={(e) => e.stopPropagation()}>
        <motion.button
          className="recipe-actions__btn recipe-actions__btn--edit"
          onClick={handleEdit}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Edit recipe"
        >
          ✏️
        </motion.button>
        <motion.button
          className="recipe-actions__btn recipe-actions__btn--delete"
          onClick={handleDeleteClick}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Delete recipe"
        >
          🗑️
        </motion.button>
      </div>

      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="recipe-actions__modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowConfirm(false)}
          >
            <motion.div
              className="recipe-actions__modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Delete Recipe?</h3>
              <p>Are you sure you want to delete "{recipe.title}"?</p>
              <p className="recipe-actions__warning">This action cannot be undone.</p>
              <div className="recipe-actions__modal-buttons">
                <button
                  className="recipe-actions__modal-cancel"
                  onClick={() => setShowConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  className="recipe-actions__modal-confirm"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default RecipeActions;