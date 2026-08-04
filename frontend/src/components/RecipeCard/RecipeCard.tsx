import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAccessTime } from 'react-icons/md';
import { Recipe } from '../../types';
import BookmarkButton from '../FavoriteButton/BookmarkButton';
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
        hover:-translate-y-1 recipe-card-hover
        hover:border-accent/20
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

      {/* Background image */}
      <div className={`relative w-full overflow-hidden bg-secondary ${getImageHeight()}`}>
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

        {/* Category badge */}
        {recipe.category && (
          <span className="
            absolute top-3 left-3
            bg-primary text-primary text-sm px-3 py-1 rounded-full border border-primary mb-3 inline-block
          ">
            {recipe.category}
          </span>
        )}

        {/* Glass overlay info on the bottom */}
        <div className="
          absolute bottom-0 left-0 right-0
          p-4
          bg-gradient-to-t from-black/80 via-black/50 to-transparent
          backdrop-blur-sm
        ">
          <div className="flex items-start justify-between gap-2">
            <h3 className="
              text-2xl font-headline-sm text-white
              line-clamp-2 mb-1.5
              drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]
              group-hover:text-accent
            ">
              {recipe.title}
            </h3>

            {/* Bookmark Button */}
            <BookmarkButton className="flex-end" recipe={recipe} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-2">
              <RatingStars recipeId={recipe._id} size="small" interactive={false} showCount={false} />
              <span className="text-xs text-white/70">
                {recipe.ingredients.length} ingredients
              </span>
            </div>
            
            <div className="flex items-end justify-end gap-3 text-white/80 text-sm">
              {recipe.cookingTime && (
                <span className="flex items-center gap-1">
                  <MdAccessTime className="text-sm" />
                  {recipe.cookingTime}m
                </span>
              )}
              {recipe.difficulty && (
                <span className="capitalize text-xs text-white/60">
                  {recipe.difficulty}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecipeCard;