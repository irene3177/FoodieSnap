import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAccessTime } from 'react-icons/md';
import { Recipe } from '../../types';
import FavoriteButton from '../FavoriteButton/FavoriteButton';
import RatingStars from '../RatingStars/RatingStars';
import RecipeActions from '../RecipeActions/RecipeActions';

interface RecipeCardProps {
  recipe: Recipe;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipeId: string) => void;
  isOwner?: boolean;
  aspectRatio?: 'auto' | 'portrait' | 'square' | 'landscape';
}

function RecipeCard({ recipe, onEdit, onDelete, isOwner = false, aspectRatio = 'auto' }: RecipeCardProps) {
  const navigate = useNavigate();
  const [imageAspect, setImageAspect] = useState<'portrait' | 'square' | 'landscape'>('square');

  useEffect(() => {
    if (aspectRatio === 'auto') {
      const img = new Image();
      img.src = recipe.imageUrl;
      img.onload = () => {
        const ratio = img.width / img.height;
        if (ratio > 1.2) setImageAspect('landscape');
        else if (ratio < 0.8) setImageAspect('portrait');
        else setImageAspect('square');
      };
    }
  }, [recipe.imageUrl, aspectRatio]);

  const getImageHeight = () => {
    if (aspectRatio !== 'auto') {
      switch (aspectRatio) {
        case 'portrait': return 'h-64 md:h-72 lg:h-80';
        case 'square': return 'h-48 md:h-56 lg:h-64';
        case 'landscape': return 'h-40 md:h-48 lg:h-56';
        default: return 'h-48';
      }
    }
    switch (imageAspect) {
      case 'portrait': return 'h-64 md:h-72 lg:h-80';
      case 'square': return 'h-48 md:h-56 lg:h-64';
      case 'landscape': return 'h-40 md:h-48 lg:h-56';
      default: return 'h-48';
    }
  };
  
  const handleCardClick = () => {
    navigate(`/recipe/${recipe._id}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div 
      className="
        group relative flex flex-col
        border rounded-xl
        overflow-hidden
        shadow-theme
        bg-card
        cursor-pointer
        outline-none
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-theme-lg
        focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2
      "
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${recipe.title}`}
    >
      <RecipeActions
        recipe={recipe}
        onEdit={onEdit}
        onDelete={onDelete}
        isOwner={isOwner} 
      />

      {/* Image container */}
      <div className={`relative overflow-hidden bg-secondary ${getImageHeight()}`}>
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="
            w-full h-full object-cover
            transition-transform duration-500
            group-hover:scale-105
          "
          loading="lazy"
        />
        <div className="
          absolute top-3 right-3
          bg-secondary rounded-full
          shadow-theme
          opacity-0 scale-90
          transition-all duration-300
          group-hover:opacity-100 group-hover:scale-100
          focus-within:opacity-100 ocus-within:scale-100
        ">
          <FavoriteButton recipe={recipe} />
        </div>
      
        {/* Category badge on image */}
        {recipe.category && (
          <span className="
            bg-border backdrop-blur-sm text-secondary
            px-3 py-1 rounded-full
            text-xs font-medium
          ">{recipe.category}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4
        bg-white/10 dark:bg-white/5
  backdrop-blur-md
        ">
        <h3 className="
          text-xl font-bold text-primary
          min-h-[3rem] mb-1 line-clamp-2
          group-hover:text-accent transition-colors
          "
        >{recipe.title}</h3>

        <div className="flex items-center justify-between my-1.5">
          <RatingStars recipeId={recipe._id} size="small" interactive={false} showCount={false} />
          <span className="text-xs text-muted">
            {recipe.ingredients.length} ingredients
          </span>
        </div>
        
        <p className="
          text-sm text-secondary
          leading-relaxed
          flex-1
          max-h-[4.5rem]
          overflow-hidden
          [display:-webkit-box]
          [-webkit-box-orient:vertical]
          [-webkit-line-clamp:3]
        ">{recipe.description}</p>

        <div className="flex justify-between items-center mt-3 pt-3 whitespace-nowrap">
          
          {recipe.cookingTime && (
            <div className="flex items-center gap-1.5 text-secondary text-sm">
              <MdAccessTime className="inline" />
              <span className="
                text-secondary
                pl-2 py-1
                text-xs font-medium
                whitespace-nowrap
              ">{recipe.cookingTime} min</span>
            </div>
          )}
          <div className="text-xs text-muted">
            {recipe.difficulty && (
              <span className="capitalize">{recipe.difficulty}</span>
            )}
          </div>
        </div>
      </div>
    </div>
    );
}

export default RecipeCard;