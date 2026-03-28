
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recipesApi } from '../../services/recipesApi';
import { Recipe } from '../../types';
import { RecipeDetailSkeleton } from '../../components/Skeleton/Skeleton';
import FavoriteButton from '../../components/FavoriteButton/FavoriteButton';
import RatingStars from '../../components/RatingStars/RatingStars';
import ShareButtons from '../../components/ShareButtons/ShareButtons';
import CommentSection from '../../components/CommentSection/CommentSection';
import './RecipeDetail.css';

function RecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); 

  useEffect(() => {
    const fetchRecipe = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);

      const result = await recipesApi.getRecipeById(id);

      if (result.success && result.data) {
        setRecipe(result.data);
      } else {
        setError(result.error || 'Recipe not found');
      }
      setLoading(false);
    };
    fetchRecipe();
  }, [id]);

  if(loading) {
    return <RecipeDetailSkeleton />;
  }

  if (error || !recipe) {
    return (
      <div className="recipe-detail__error">
        <h2>{error || 'Recipe not found'}</h2>
        <button onClick={() => navigate('/recipes')} className="recipe-detail__back-button">
          Back to Recipes
        </button>
      </div>
    );
  }

  

  return (
    <div className="recipe-detail">
      <button
        onClick={() => navigate(-1)}
        className="recipe-detail__back-button"
      >
        ← Back to Recipes
      </button>

      <div className="recipe-detail__container">
        <div className="recipe-detail__grid">
          <div className="recipe-detail__image-container">
            <img 
              src={recipe.imageUrl}
              alt={recipe.title}
              className="recipe-detail__image"
            />
            <div className="recipe-detail__favorite">
              <FavoriteButton recipe={recipe} size="large" showText />
            </div>
          </div>

          <div className="recipe-detail__info">
            <h1 className="recipe-detail__title">{recipe.title}</h1>
            {/* Metadata tags */}
            <div className="recipe-detail__rating-section">
              <RatingStars recipeId={recipe._id} size="large" showCount />
            </div>
            
            {/* Share buttons */}
            <ShareButtons 
              title={recipe.title}
              url={`/recipe/${recipe._id}`}
              description={recipe.description}
              image={recipe.imageUrl}
            />

            <div className="recipe-detail__meta">
              {recipe.tags && recipe.tags.length > 0 && (
                <div className="recipe-detail__tags">
                  {recipe.tags.map(tag =>(
                    <span key={tag} className="recipe-detail__tag">{tag}</span>
                  ))}
                </div>
              )}

              {recipe.category && (
                <span className="recipe-detail__tag">{recipe.category}</span>
              )}
              {recipe.area && (
                <span className="recipe-detail__tag">{recipe.area}</span>
              )}
            </div>

            <p className="recipe-detail__description">{recipe.description}</p>
            
                {recipe.youtubeUrl && (
                  <div className="recipe-detail__section">
                    <h2 className="recipe-detail__section-title">Video Tutorial</h2>
                    <a
                      href={recipe.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="recipe-detail__youtube-link"
                    >
                      Watch on YouTube →
                    </a>
                  </div>
                )}

          </div>
        </div>
        <div className="recipe-detail__bottom">
            <div className="recipe-detail__section">
              <h2 className="recipe-detail__section-title">Ingredients</h2>
              <ul className="recipe-detail__ingredient-list">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="recipe-detail__ingredient-item">
                    <span className="recipe-detail__ingredient-bullet">•</span>
                    {ingredient}
                  </li>
                ))}
              </ul>
            </div>
            {recipe.instructions && (
              <div className="recipe-detail__section">
                <h2 className="recipe-detail__section-title">Instructions</h2>
                {recipe.instructions.map((step, index) => (
                  <p key={index} className="recipe-detail__step">
                    {step}
                  </p>
                ))}
              </div>
            )}

        </div>
        <CommentSection recipeId={recipe._id} recipeTitle={recipe.title} />
      </div>    
    </div>
  );
}

export default RecipeDetail;