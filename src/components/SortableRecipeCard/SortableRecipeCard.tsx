import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Recipe } from '../../types/recipe.types';
import RecipeCard from '../RecipeCard/RecipeCard';
import './SortableRecipeCard.css';

interface SortableRecipeCardProps {
  recipe: Recipe;
}

function SortableRecipeCard({ recipe }: SortableRecipeCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: recipe.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div
    ref={setNodeRef}
    style={style}
    className="sortable-card"
    {...attributes}
    {...listeners}
    >
      <RecipeCard recipe={recipe} />
    </div>
  );
}

export default SortableRecipeCard;