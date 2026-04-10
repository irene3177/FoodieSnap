import { useNavigate } from 'react-router-dom';
import { Recipe } from '../../types';
import FavoriteButton from '../FavoriteButton/FavoriteButton';
import RatingStars from '../RatingStars/RatingStars';
import './RecipeCard.css';
import RecipeActions from '../RecipeActions/RecipeActions';

interface RecipeCardProps {
  recipe: Recipe;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipeId: string) => void;
  isOwner?: boolean;
}

function RecipeCard({ recipe, onEdit, onDelete, isOwner = false }: RecipeCardProps) {
  const navigate = useNavigate();

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
      className="recipe-card"
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
      <div className="recipe-card__image-container">
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="recipe-card__image"
          loading="lazy"
        />
        <div className="recipe-card__favorite">
          <FavoriteButton recipe={recipe} />
        </div>
      </div>

      <div className="recipe-card__content">
        <h3 className="recipe-card__title">{recipe.title}</h3>

        <div className="recipe-card__rating">
          <RatingStars recipeId={recipe._id} size="small" interactive={false} showCount={false} />
        </div>
        
        <p className="recipe-card__description">{recipe.description}</p>

        <div className="recipe-card__footer">
          <span className="recipe-card__ingredients-count">
            {recipe.ingredients.length} ingredients
          </span>
          {recipe.category && (
            <span className="recipe-card__category">{recipe.category}</span>
          )}
          {recipe.cookingTime && (
            <span className="recipe-card__time">{recipe.cookingTime} min</span>
          )}
        </div>
      </div>
    </div>
    );
}

export default RecipeCard;