import { useNavigate } from 'react-router-dom';
import { Recipe } from '../../types/recipe.types';
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
      <img
        src={recipe.image}
        alt={recipe.title}
        className="recipe-card__image"
      />
      <div className="recipe-card__content">
        <h3 className="recipe-card__title">{recipe.title}</h3>
        <p className="recipe-card__description">{recipe.description}</p>
        <div className="recipe-card__footer">
          <span className="recipe-card__ingredients-count">
            {recipe.ingredients.length} ingredients
          </span>
          <span className="recipe-card__view-link">View Recipe →</span>
        </div>
      </div>
    </div>
    );
}

export default RecipeCard;