import { useEffect, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Recipe } from '../../types';
import RecipeCard from '../RecipeCard/RecipeCard';

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
    isDragging
  } = useSortable({ id: recipe._id, transition: {
      duration: 150,
      easing: 'ease-out'
    } });

  useEffect(() => {
    if (!isDragging && cardRef.current) {
      cardRef.current.blur();
    }
  }, [isDragging]);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: 'transform 150ms ease-out',
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
    className="relative h-full cursor-grab transition-all duration-200 active:cursor-grabbing 
        hover:[&_.recipe-card]:shadow-theme-lg hover:[&_.recipe-card]:-translate-y-0.5
        focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2
        will-change-transform"
    {...attributes}
    {...listeners}
    tabIndex={0}
    >
      <RecipeCard recipe={recipe} />
    </div>
  );
}

export default SortableRecipeCard;