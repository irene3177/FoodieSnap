import { useEffect, useState } from 'react';
import { recipesApi } from '../../services/recipesApi';
import { Recipe } from '../../types';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import { RecipeCardSkeleton } from '../../components/Skeleton/Skeleton';
import { ScrollToTop } from '../../components/ScrollToTop/ScrollToTop';
import { Link } from 'react-router-dom';

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
    <div className="max-w-6xl mx-auto px-4 py-8 md:px-6 md:py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-headline-md text-primary tracking-tight">
          Top Rated Recipes
        </h1>
        <p className="text-secondary text-sm mt-2">
          The best recipes, as rated by our community
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="text-center py-8 px-4 bg-error-bg rounded-xl text-error my-6">{error}</div>
      )}

      {/* Empty */}
      {!loading && !error && recipes.length === 0 && (
        <div className="text-center py-12 px-6 bg-bg-card rounded-xl shadow-theme max-w-lg mx-auto my-8">
          <p className="text-xl text-text-primary mb-2">No recipes have been rated yet.</p>
          <p className="text-text-secondary mb-6">Be the first to rate some recipes!</p>
          <Link
            to="/recipes"
            className="inline-block px-6 py-3 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors"
          >
            Explore Recipes
          </Link>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <RecipeCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      )}

      {/* Grid */}
      {!loading && !error && recipes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe._id} recipe={recipe} />
          ))}
        </div>
      )}
      <ScrollToTop threshold={300} behavior="smooth" />
    </div>
  );
}

export default TopRated;