import { useState, useEffect, useCallback } from 'react';
import { recipeApi } from '../../services/recipeApi';
import { Recipe } from '../../types/recipe.types';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import { RecipeCardSkeleton } from '../../components/Skeleton/Skeleton';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import './Recipes.css';

function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);


  // Load initial random recipes
  useEffect(() => {
    loadRecipes(true);
  }, []);

  const loadRecipes = async (reset: boolean = false) => {
    if (reset) {
      setRecipes([]);
      setPage(1);
      setHasMore(true);
    }

    setLoading(true);
    setError(null);

    try {
      // For demo. For prod use actual pagination
      const newRecipes: Recipe[] = [];
      const count = reset ? 8 : 4;

      for (let i = 0; i < count; i++) {
        const recipe = await recipeApi.getRandomRecipe();
        newRecipes.push(recipe);
      }
      
      setRecipes(prev => reset ? newRecipes : [...prev, ...newRecipes]);
      setHasMore(page < 5);  // Limit to 5 pages for demo
    } catch (err) {
      setError('Failed to load recipes. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreRecipes = useCallback(async () => {
    if (!searchQuery) {
      setPage(prev => prev + 1);
      await loadRecipes(false);
    }
  }, [searchQuery]);

  const { lastElementRef, loading: loadingMore } = useInfiniteScroll({
    hasMore: hasMore && !searchQuery,
    loadMore: loadMoreRecipes
  });

  /*
  const loadRandomRecipes = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load 4 random recipes for initial display
      const randomRecipes: Recipe[] = [];
      for (let i = 0; i < 4; i++) {
        const recipe = await recipeApi.getRandomRecipe();
        randomRecipes.push(recipe);
      }
      setRecipes(randomRecipes);
    } catch (err) {
      setError('Failed to load recipes. Please try again later.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  */

  // Handle search with debounce
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    // Clear previous timeout
    if(searchTimeout) {
      window.clearTimeout(searchTimeout);
    }

    // Set new timeout for debounced searched
    const timeoutId = window.setTimeout(async () => {
      if (query.trim()) {
        setLoading(true);
        setError(null);
        try {
          const searchResults = await recipeApi.searchRecipes(query);
          setRecipes(searchResults);
          setHasMore(false);
        } catch (err) {
          setError('Failed to search recipes. Please try again.');
          console.error(err);
        } finally {
          setLoading(false);
      }
    } else if (query === '') {
      // If search is empty, load random recipes again
      loadRecipes(true);
    }
  }, 500);  // 500ms debounce

    setSearchTimeout(timeoutId);
  };

  // Clear timeout on component unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        window.clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="recipes-page">
      <div className="recipes-page__header">
        <h1 className="recipes-page__title">Discover Recipes</h1>

        {/* Search Bar */}
        <div className="recipes-page__search">
          <input
            type="text"
            placeholder="Search for recipes (e.g., 'chicken', 'pasta')..."
            value={searchQuery}
            onChange={handleSearch}
            className="recipes-page__search-input" 
          />
          {searchQuery && (
            <button
              className="recipes-page__search-clear"
              onClick={() => {
                setSearchQuery('');
                loadRecipes(true);
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="recipes-page__error">
          <p className="recipes-page__error-message">{error}</p>
          <button
            className="recipes-page__retry-button"
            onClick={() => loadRecipes(true)}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Recipe grid*/}
      <div className="recipes-page__grid">
        {recipes.map((recipe, index) => (
          <div
            key={index}
            ref={index === recipes.length - 1 ? lastElementRef : null}
          >
            <RecipeCard recipe={recipe} />
          </div>
        ))}

        {(loading || loadingMore) && !error && (
          <>
            {[...Array(4)].map((_, index) => (
              <RecipeCardSkeleton key={`skeleton-${index}`} />
            ))}
          </>
        )}
      </div>

      {/* Results */}
      {!loading && !error && recipes.length === 0 && (
        <div className="recipes-page__no-results">
          <p>No recipes found for "{searchQuery}"</p>
          <p className="recipes-page__no-results-hint">
            Try different keywords or check your spelling
          </p>
        </div>
      )}

      {!hasMore && !searchQuery && recipes.length === 0 && (
        <div className="recipes-page__end-message">
          <p>You've reached the end! 🎉</p>
        </div>
      )}
    </div>
  );
}

export default Recipes;