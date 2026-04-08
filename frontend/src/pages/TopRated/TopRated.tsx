import { useEffect, useState } from 'react';
import { recipesApi } from '../../services/recipesApi';
import { Recipe } from '../../types';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import { RecipeCardSkeleton } from '../../components/Skeleton/Skeleton';
import { ScrollToTop } from '../../components/ScrollToTop/ScrollToTop';
import './TopRated.css';

function TopRated() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTopRated = async () => {
      setLoading(true);
      setError(null);

      const result = await recipesApi.getTopRatedRecipes(10);
      if (result.success && result.data) {
        setRecipes(result.data);
      } else {
        setError(result.error || 'Failed to load top rated recipes');
      }
      setLoading(false);
    };
    loadTopRated();
  }, []);

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
            <RecipeCard key={recipe._id} recipe={recipe} />
          ))}
        </div>
      )}
      <ScrollToTop threshold={300} behavior="smooth" />
    </div>
  );
}

export default TopRated;