import { useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Recipe } from '../../types/recipe.types';
import RecipeCard from '../RecipeCard/RecipeCard';
import './SortableRecipeCard.css';

interface SortableRecipeCardProps {
  recipe: Recipe;
}

function SortableRecipeCard({ recipe }: SortableRecipeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: recipe.id });

  useEffect(() => {
    if (!isDragging && cardRef.current) {
      cardRef.current.blur();
    }
  }, [isDragging]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const setRefs = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    if (cardRef) {
      (cardRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  return (
    <div
    ref={setRefs}
    style={style}
    className="sortable-card"
    {...attributes}
    {...listeners}
    tabIndex={0}
    >
      <RecipeCard recipe={recipe} />
    </div>
  );
}

export default SortableRecipeCard;