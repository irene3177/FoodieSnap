import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch } from '../../store/store';
import { showToast } from '../../store/toastSlice';
import { recipesApi } from '../../services/recipesApi';
import { useScrollLock } from '../../hooks/useScrollLock';
import { NewRecipe, Recipe } from '../../types';
import { MdClose, MdMenuBook } from 'react-icons/md';
import { RiEdit2Fill } from 'react-icons/ri';
import { BasicInfoSection } from './BasicInfoSection';
import { MediaSection } from './MediaSection';
import { PreparationSection } from './PreparationSection';
import { IngredientsSection } from './IngredientsSection';
import { InstructionsSection } from './InstructionsSection';
import { Difficulty } from './PreparationSection';

interface RecipeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  recipe?: Recipe | null;
}

function RecipeFormModal({ isOpen, onClose, onSuccess, recipe }: RecipeFormModalProps) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [ingredientInput, setIngredientInput] = useState('');
  const ingredientInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!recipe;

  useScrollLock(isOpen);

  const [formData, setFormData] = useState<NewRecipe>({
    title: '',
    description: '',
    ingredients: [],
    instructions: [''],
    imageUrl: '',
    cookingTime: 30,
    difficulty: 'medium'
  });

  // Fill out the form in Edit Mode
  useEffect(() => {
    if (recipe && isOpen) {
      setFormData({
        title: recipe.title || '',
        description: recipe.description || '',
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [''],
        imageUrl: recipe.imageUrl || '',
        cookingTime: recipe.cookingTime || 30,
        difficulty: recipe.difficulty || 'medium'
      });
    }
  }, [recipe, isOpen]);

  // Clear fields after close
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        title: '',
        description: '',
        ingredients: [],
        instructions: [''],
        imageUrl: '',
        cookingTime: 30,
        difficulty: 'medium'
      });
      setIngredientInput('');
    }
  }, [isOpen]);

  // === HANDLERS ===
  const handleTitleChange = (value: string) => {
    setFormData(prev => ({ ...prev, title: value }));
  };

  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }));
  };

  const handleImageUrlChange = (value: string) => {
    setFormData(prev => ({ ...prev, imageUrl: value }));
  };

  const handleCookingTimeChange = (value: number) => {
    setFormData(prev => ({ ...prev, cookingTime: value }));
  };

  const handleDifficultyChange = (value: Difficulty) => {
    setFormData(prev => ({ ...prev, difficulty: value }));
  };

  // === INGREDIENTS ===
  const addIngredient = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !formData.ingredients.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, trimmed]
      }));
      setIngredientInput('');
    }
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const handleIngredientKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addIngredient(ingredientInput);
    }
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

  // === SUBMIT ===
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

      let response;
      if (isEditMode && recipe) {
        response = await recipesApi.updateRecipe(recipe._id, recipeToSend);
      } else {
        response = await recipesApi.createRecipe(recipeToSend);
      }

      
      if (response.success) {
        dispatch(showToast({
          message: isEditMode ? 'Recipe updated successfully!' : 'Recipe created successfully!',
          type: 'success'
        }));
        onSuccess();
        onClose();
      } else {
        dispatch(showToast({
          message: response.error || (isEditMode ? 'Failed to update recipe' : 'Failed to create recipe'),
          type: 'error'
        }));
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      dispatch(showToast({
        message: isEditMode ? 'Failed to update recipe' : 'Failed to create recipe',
        type: 'error'
      }));
    } finally {
      setLoading(false);
    }
  };

  const title = isEditMode ? 'Edit Recipe' : 'Create New Recipe';
  const submitText = loading 
    ? (isEditMode ? 'Saving...' : 'Creating...')
    : (isEditMode ? 'Save Changes' : 'Create Recipe');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="
              bg-primary rounded-2xl
              w-full max-w-2xl
              max-h-[90vh]
              flex flex-col
              overflow-hidden
              shadow-2xl
            "
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-6 py-5 border-b flex-shrink-0">
              <div className="flex items-center gap-3">
                {isEditMode ? (
                  <RiEdit2Fill className="text-accent text-3xl" />
                ) : (
                  <MdMenuBook className="text-accent text-3xl" />
                )}
                <h2 className="text-3xl font-semibold text-secondary m-0 cursor-default">{title}</h2>
              </div>
              <button className="
                  btn-close
                  "
                  onClick={onClose}>
                <MdClose className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-[clamp(1.5rem,4vw,2.5rem)] scrollbar-thin space-y-6">
              <form onSubmit={handleSubmit}>

                {/*-- Section 1: Basic Info --*/}
                <BasicInfoSection
                  title={formData.title}
                  description={formData.description}
                  onTitleChange={handleTitleChange}
                  onDescriptionChange={handleDescriptionChange}
                />

                {/* Grid for Media & Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter gap-4 mb-8">
                  {/* Section 2: Media */}
                  <MediaSection
                    imageUrl={formData.imageUrl}
                    onImageUrlChange={handleImageUrlChange}
                  />
                  {/*  Section 3: Time & Difficulty  */}
                  <PreparationSection
                    cookingTime={formData.cookingTime || 30}
                    difficulty={formData.difficulty as Difficulty}
                    onCookingTimeChange={handleCookingTimeChange}
                    onDifficultyChange={handleDifficultyChange}
                  />
                </div>

                {/* Section 4: Ingredients */}
                <IngredientsSection
                  ref={ingredientInputRef}
                  ingredients={formData.ingredients}
                  ingredientInput={ingredientInput}
                  onIngredientInputChange={setIngredientInput}
                  onAddIngredient={addIngredient}
                  onRemoveIngredient={removeIngredient}
                  onIngredientKeyDown={handleIngredientKeyDown}
                />

                {/* Section 5: Instructions */}
                <InstructionsSection
                  instructions={formData.instructions}
                  onAddInstruction={addInstruction}
                  onRemoveInstruction={removeInstruction}
                  onUpdateInstruction={updateInstruction}
                />
                
                {/* Actions */}
                <div className="flex gap-3 justify-end mt-6 pt-4">
                  <button
                    type="button"
                    className="
                      btn-secondary text-sm
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                    onClick={onClose}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="
                      btn-primary text-sm
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                    disabled={loading}
                  >
                    {submitText}
                  </button>
                </div>
              </form>
            </main>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RecipeFormModal;