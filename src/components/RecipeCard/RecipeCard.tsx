import { useNavigate } from 'react-router-dom';
import { Recipe } from '../../types/recipe.types';
import FavoriteButton from '../FavoriteButton/FavoriteButton';
import RatingStars from '../RatingStars/RatingStars';
import './RecipeCard.css';

interface RecipeCardProps {
  recipe: Recipe;
}

function RecipeCard({ recipe }: RecipeCardProps) {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/recipe/${recipe.id}`);
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
      <div className="recipe-card__image-container">
        <img
          src={recipe.image}
          alt={recipe.title}
          className="recipe-card__image"
        />
        <div className="recipe-card__favorite">
          <FavoriteButton recipe={recipe} />
        </div>
      </div>

      <div className="recipe-card__content">
        <h3 className="recipe-card__title">{recipe.title}</h3>

        <div className="recipe-card__rating">
          <RatingStars recipeId={recipe.id} size="small" interactive={false} showCount={false} />
        </div>
        
        <p className="recipe-card__description">{recipe.description}</p>

        <div className="recipe-card__footer">
          <span className="recipe-card__ingredients-count">
            {recipe.ingredients.length} ingredients
          </span>
          {recipe.category && (
            <span className="recipe-card__category">{recipe.category}</span>
          )}
        </div>
      </div>
    </div>
    );
}

export default RecipeCard;