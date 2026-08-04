import RecipeFormModal from '../RecipeFormModal/RecipeFormModal';

interface CreateRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateRecipeModal({ isOpen, onClose, onSuccess }: CreateRecipeModalProps) {
  return (
    <RecipeFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

export default CreateRecipeModal;