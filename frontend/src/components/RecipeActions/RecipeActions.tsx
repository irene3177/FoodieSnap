import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch } from '../../store/store';
import { recipesApi } from '../../services/recipesApi';
import { showToast } from '../../store/toastSlice';
import { Recipe } from '../../types';
import { RiEdit2Fill, RiDeleteBin6Line } from 'react-icons/ri';
// import './RecipeActions.css';

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
      <div
        className="absolute top-3 left-3 flex gap-2 z-10
          opacity-0 group-hover:opacity-100 transition-opacity
          duration-200 md:opacity-100"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.button
          title="Edit Recipe"
          className="w-10 h-10 rounded-full border-none
            bg-secondary bg-opacity-15 text-muted shadow-md 
            flex items-center justify-center cursor-pointer"
          onClick={handleEdit}
          whileTap={{ scale: 0.95 }}
          aria-label="Edit recipe"
        >
          <RiEdit2Fill className="hover:scale-110 hover:text-accent transition-all duration-500" />
        </motion.button>
        <motion.button
          title="Delete Recipe"
          className="w-10 h-10 rounded-full border-none
            bg-secondary bg-opacity-15 text-muted shadow-md 
            flex items-center justify-center cursor-pointer"
          onClick={handleDeleteClick}
          whileTap={{ scale: 0.95 }}
          aria-label="Delete recipe"
        >
          <RiDeleteBin6Line className="hover:scale-110 hover:text-accent transition-all duration-500" />
        </motion.button>
      </div>

      {createPortal(
        <AnimatePresence>
          {showConfirm && (
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowConfirm(false)}
            >
              <motion.div
                className="bg-primary rounded-2xl p-6 max-w-md w-full shadow-2xl"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-3xl text-secondary mb-3">Delete Recipe?</h3>
                <p className="text-secondary mb-2">
                  Are you sure you want to delete <span className="font-semibold text-primary">"{recipe.title}"</span>?</p>
                <p className="text-heart-hover text-sm mt-2">This action cannot be undone.</p>
                <div className="flex gap-3 mt-6 justify-end">
                  <button
                    className="btn-secondary"
                    onClick={() => setShowConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

export default RecipeActions;