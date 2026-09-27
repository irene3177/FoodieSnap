import RecipeFormModal from '../RecipeFormModal/RecipeFormModal';
import { Recipe } from '../../types';

interface EditRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe | null;
  onSuccess: () => void;
}

function EditRecipeModal({ isOpen, onClose, recipe, onSuccess }: EditRecipeModalProps) {
  return (
    <RecipeFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
      recipe={recipe}
    />
  );
}

export default EditRecipeModal;