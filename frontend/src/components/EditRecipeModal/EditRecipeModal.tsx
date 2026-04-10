import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch } from '../../store/store';
import { recipesApi } from '../../services/recipesApi';
import { showToast } from '../../store/toastSlice';
import { Recipe } from '../../types';
import './EditRecipeModal.css';

interface EditRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe | null;
  onSuccess: () => void;
}

function EditRecipeModal({ isOpen, onClose, recipe, onSuccess }: EditRecipeModalProps) {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [cookingTime, setCookingTime] = useState<number>(30);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title);
      setDescription(recipe.description);
      setIngredients(recipe.ingredients.length ? recipe.ingredients : ['']);
      setInstructions(recipe.instructions.length ? recipe.instructions : ['']);
      setDifficulty(recipe.difficulty);
      setCookingTime(recipe.cookingTime || 30);
      setImageUrl(recipe.imageUrl);
    }
  }, [recipe]);

  const handleIngredientChange = (index: number, value: string) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, '']);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleInstructionChange = (index: number, value: string) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim() || ingredients.length === 0 || instructions.length === 0) {
      dispatch(showToast({ message: 'Please fill all required fields', type: 'error' }));
      return;
    }

    setLoading(true);
    
    const updateData = {
      title: title.trim(),
      description: description.trim(),
      ingredients: ingredients.filter(i => i.trim()),
      instructions: instructions.filter(i => i.trim()),
      difficulty,
      cookingTime,
      imageUrl,
    };

    const response = await recipesApi.updateRecipe(recipe!._id, updateData);
    
    if (response.success) {
      dispatch(showToast({ message: 'Recipe updated successfully!', type: 'success' }));
      onSuccess();
      onClose();
    } else {
      dispatch(showToast({ message: response.error || 'Failed to update recipe', type: 'error' }));
    }
    
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="edit-recipe-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="edit-recipe-modal"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="edit-recipe-modal-header">
              <h2>Edit Recipe</h2>
              <button className="edit-recipe-modal-close" onClick={onClose}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="edit-recipe-modal-form">
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <div className="form-group">
                <label>Ingredients *</label>
                {ingredients.map((ingredient, index) => (
                  <div key={index} className="array-input">
                    <input
                      type="text"
                      value={ingredient}
                      onChange={(e) => handleIngredientChange(index, e.target.value)}
                      placeholder={`Ingredient ${index + 1}`}
                    />
                    {ingredients.length > 1 && (
                      <button type="button" onClick={() => removeIngredient(index)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addIngredient} className="add-btn">
                  + Add Ingredient
                </button>
              </div>

              <div className="form-group">
                <label>Instructions *</label>
                {instructions.map((instruction, index) => (
                  <div key={index} className="array-input">
                    <textarea
                      value={instruction}
                      onChange={(e) => handleInstructionChange(index, e.target.value)}
                      placeholder={`Step ${index + 1}`}
                      rows={2}
                    />
                    {instructions.length > 1 && (
                      <button type="button" onClick={() => removeInstruction(index)}>✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addInstruction} className="add-btn">
                  + Add Step
                </button>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Cooking Time (minutes)</label>
                  <input
                    type="number"
                    value={cookingTime}
                    onChange={(e) => setCookingTime(Number(e.target.value))}
                    min={1}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="edit-recipe-modal-actions">
                <button type="button" onClick={onClose} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default EditRecipeModal;