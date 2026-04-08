import { useState, useEffect, useCallback, useRef } from 'react';
import { recipesApi } from '../../services/recipesApi';
import { Recipe } from '../../types';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import { RecipeCardSkeleton } from '../../components/Skeleton/Skeleton';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { ScrollToTop } from '../../components/ScrollToTop/ScrollToTop';
import './Recipes.css';

function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [totalResults, setTotalResults] = useState<number>(0);

  const initialLoaded = useRef(false);

  // Load initial random recipes
  useEffect(() => {
    if (!initialLoaded.current) {
      loadInitialRecipes();
      initialLoaded.current = true;
    }
  }, []);

  const loadInitialRecipes = async () => {
    setLoading(true);
    setError(null);

    const response = await recipesApi.getRandomRecipes(8, 1);

    if (response.success) {
      setRecipes(response.data?.recipes || []);
      setTotalResults(response.data?.totalRecipes || 0);
      setPage(2);
      setHasMore(true);
    } else {
      setError(response.error || 'Failed to load recipes. Please try again later.');
    }
    setLoading(false);
  };

  // Load more recipes for infinite scroll
  const loadMoreRecipes = useCallback(async () => {
    if (loadingMore || isSearching || !hasMore) return;

    setLoadingMore(true);
    const response = await recipesApi.getRandomRecipes(4, page);
    
    if (response.success) {
      const newRecipes = response.data?.recipes || [];
      setRecipes(prev => {
        const existingIds = new Set(prev.map(r => r._id));
        const uniqueNewRecipes = newRecipes.filter(r => !existingIds.has(r._id));
        return [...prev, ...uniqueNewRecipes];
      });
      setPage(prev => prev + 1);

      // For random recipes hasMore is always true
      setHasMore(true);
    } else {
      console.error('Failed to load more recipes:', response.error);
    }
    setLoadingMore(false);
  }, [page, loadingMore, isSearching, hasMore]);

  const { lastElementRef } = useInfiniteScroll({
    hasMore: hasMore && !isSearching,
    loadMore: loadMoreRecipes
  });

  // Handle search with debounce
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      // If search is empty, load random recipes again
      setIsSearching(false);
      loadInitialRecipes();
      return;
    }

    setIsSearching(true);
    setLoading(true);
    setError(null);
    
    const result = await recipesApi.searchRecipesByName(query, 1);

    if (result.success) {
      setRecipes(result.data?.recipes || []);
      setTotalResults(result.data?.total || 0);
      setHasMore(false);
    } else {
      setError(result.error || 'Failed to search recipes. Please try again.');
    }
    setLoading(false);
  };

  const handleSearchInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (searchTimeout) {
      window.clearTimeout(searchTimeout);
    }

    const timeoutId = window.setTimeout(() => {
      handleSearch(query);
    }, 500);

    setSearchTimeout(timeoutId);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
    loadInitialRecipes();
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
            onChange={handleSearchInput}
            className="recipes-page__search-input" 
          />
          {searchQuery && (
            <button
              className="recipes-page__search-clear"
              onClick={clearSearch}
            >
              ✕
            </button>
          )}
        </div>

        {/* Results count */}
        {!loading && !error && recipes.length > 0 && (
          <div className="recipes-page__results-count">
            {isSearching ? (
              <>Found {totalResults} {totalResults === 1 ? 'recipe' : 'recipes'}</>
            ) : (
              <>Showing {recipes.length} recipes</>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="recipes-page__error">
          <p className="recipes-page__error-message">{error}</p>
          <button
            className="recipes-page__retry-button"
            onClick={loadInitialRecipes}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Recipe grid*/}
      <div className="recipes-page__grid">
        {recipes.map((recipe, index) => (
          <div
            key={`${recipe._id}-${index}`}
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
      {!loading && !error && recipes?.length === 0 && (
        <div className="recipes-page__no-results">
          <p>No recipes found for "{searchQuery}"</p>
          <p className="recipes-page__no-results-hint">
            Try different keywords or check your spelling
          </p>
        </div>
      )}

      {!hasMore && !isSearching && recipes.length === 0 && (
        <div className="recipes-page__end-message">
          <p>You've reached the end! 🎉</p>
        </div>
      )}
      <ScrollToTop threshold={400} behavior="smooth" />
    </div>
  );
}

export default Recipes;