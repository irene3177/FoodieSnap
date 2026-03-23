import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch } from '../../store/store';
import { showToast } from '../../store/toastSlice';
import { recipesApi } from '../../services/recipesApi';
import { NewRecipe } from '../../types';
import './CreateRecipeModal.css';

interface CreateRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateRecipeModal({ isOpen, onClose, onSuccess }: CreateRecipeModalProps) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<NewRecipe>({
    title: '',
    description: '',
    ingredients: [''],
    instructions: [''],
    imageUrl: '',
    cookingTime: 30,
    difficulty: 'medium'
  });

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, '']
    }));
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const updateIngredient = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((item, i) => i === index ? value : item)
    }));
  };

  const addInstruction = () => {
    setFormData(prev => ({
      ...prev,
      instructions: [...prev.instructions, '']
    }));
  };

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const updateInstruction = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.map((item, i) => i === index ? value : item)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate
    if (!formData.title.trim()) {
      dispatch(showToast({ message: 'Title is required', type: 'error' }));
      return;
    }
    
    const validIngredients = formData.ingredients.filter(i => i.trim());
    if (validIngredients.length === 0) {
      dispatch(showToast({ message: 'At least one ingredient is required', type: 'error' }));
      return;
    }
    
    const validInstructions = formData.instructions.filter(i => i.trim());
    if (validInstructions.length === 0) {
      dispatch(showToast({ message: 'At least one instruction is required', type: 'error' }));
      return;
    }

    setLoading(true);

    try {
      const recipeToSend = {
        ...formData,
        ingredients: validIngredients,
        instructions: validInstructions,
        cookingTime: formData.cookingTime || 30
      };

      const response = await recipesApi.createRecipe(recipeToSend);
      
      if (response.success) {
        dispatch(showToast({ message: 'Recipe created successfully!', type: 'success' }));
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          title: '',
          description: '',
          ingredients: [''],
          instructions: [''],
          imageUrl: '',
          cookingTime: 30,
          difficulty: 'medium'
        });
      } else {
        dispatch(showToast({ message: response.error || 'Failed to create recipe', type: 'error' }));
      }
    } catch (error) {
      console.error('Error creating recipe:', error);
      dispatch(showToast({ message: 'Failed to create recipe', type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="create-recipe-modal__overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="create-recipe-modal"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="create-recipe-modal__header">
              <h2>Create New Recipe</h2>
              <button className="create-recipe-modal__close" onClick={onClose}>
                ✕
              </button>
            </div>

            <div className="create-recipe-modal__content">
              <form onSubmit={handleSubmit}>
                {/* Title */}
                <div className="create-recipe-modal__field">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter recipe title"
                    required
                  />
                </div>

                {/* Description */}
                <div className="create-recipe-modal__field">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of your recipe"
                    rows={3}
                  />
                </div>

                {/* Image URL */}
                <div className="create-recipe-modal__field">
                  <label>Image URL</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {/* Cooking Time & Difficulty */}
                <div className="create-recipe-modal__row">
                  <div className="create-recipe-modal__field">
                    <label>Cooking Time (minutes)</label>
                    <input
                      type="number"
                      value={formData.cookingTime}
                      onChange={(e) => setFormData({ ...formData, cookingTime: parseInt(e.target.value) || 0 })}
                      min={1}
                    />
                  </div>
                  <div className="create-recipe-modal__field">
                    <label>Difficulty</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as 'easy' | 'medium' | 'hard' })}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                {/* Ingredients */}
                <div className="create-recipe-modal__section">
                  <label>Ingredients *</label>
                  {formData.ingredients.map((ingredient, index) => (
                    <div key={index} className="create-recipe-modal__array-item">
                      <input
                        type="text"
                        value={ingredient}
                        onChange={(e) => updateIngredient(index, e.target.value)}
                        placeholder={`Ingredient ${index + 1}`}
                      />
                      {formData.ingredients.length > 1 && (
                        <button
                          type="button"
                          className="create-recipe-modal__remove-btn"
                          onClick={() => removeIngredient(index)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="create-recipe-modal__add-btn"
                    onClick={addIngredient}
                  >
                    + Add Ingredient
                  </button>
                </div>

                {/* Instructions */}
                <div className="create-recipe-modal__section">
                  <label>Instructions *</label>
                  {formData.instructions.map((instruction, index) => (
                    <div key={index} className="create-recipe-modal__array-item">
                      <textarea
                        value={instruction}
                        onChange={(e) => updateInstruction(index, e.target.value)}
                        placeholder={`Step ${index + 1}`}
                        rows={2}
                      />
                      {formData.instructions.length > 1 && (
                        <button
                          type="button"
                          className="create-recipe-modal__remove-btn"
                          onClick={() => removeInstruction(index)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="create-recipe-modal__add-btn"
                    onClick={addInstruction}
                  >
                    + Add Step
                  </button>
                </div>

                {/* Actions */}
                <div className="create-recipe-modal__actions">
                  <button
                    type="button"
                    className="create-recipe-modal__cancel"
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="create-recipe-modal__submit"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Recipe'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CreateRecipeModal;