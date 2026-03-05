import { useEffect, useState } from 'react';
import { useRatings } from '../../context/RatingContext';
import { recipeApi } from '../../services/recipeApi';
import { Recipe } from '../../types/recipe.types';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import { RecipeCardSkeleton } from '../../components/Skeleton/Skeleton';
import './TopRated.css';

function TopRated() {
  const { ratings } = useRatings();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTopRated = async () => {
      setLoading(true);
      try {
        // Get recipes that have ratings
        const ratedRecipeIds = Object.keys(ratings)
          .map(id => parseInt(id))
          .sort((a, b) => {
            const ratingA = ratings[a]?.averageRating || 0;
            const ratingB = ratings[b]?.averageRating || 0;
            return ratingB - ratingA;
          })
          .slice(0, 10); // Top 10

          const recipePromises = ratedRecipeIds.map(id => 
              recipeApi.getRecipeById(id.toString())
          );

          const fetchedRecipes = await Promise.all(recipePromises);
          setRecipes(fetchedRecipes.filter((r): r is Recipe => r !== null));
      } catch (error) {
        setError('Failed to load top rated recipes');
        console.error(error);
      } finally {
        setLoading(false);
      } 
    };

    if (Object.keys(ratings).length > 0) {
      loadTopRated();
    } else {
      setLoading(false);
    }
  }, [ratings]);

  return (
    <div className="top-rated">
      <h1 className="top-rated__title">Top Rated Recipes ⭐</h1>

      {error && (
        <div className="top-rated__error">{error}</div>
      )}

      {loading ? (
        <div className="top-rated__grid">
          {[...Array(4)].map((_, index) => (
            <RecipeCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="top-rated__empty">
          <p>No recipes have been rated yet.</p>
          <p>Be the first to rate some recipes!</p>
          <a href="/recipes" className="top-rated__explore-link">
            Explore Recipes
          </a>
        </div>
      ) : (
        <div className="top-rated__grid">
          {recipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}

export default TopRated;