import { useState, useEffect, useCallback, useRef } from 'react';
import { recipesApi } from '../../services/recipesApi';
import { Recipe, RecipesFilters } from '../../types';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import { RecipeCardSkeleton } from '../../components/Skeleton/Skeleton';
import { RecipeFilters as FiltersComponent } from '../../components/RecipeFilters/RecipeFilters';
import { ScrollToTop } from '../../components/ScrollToTop/ScrollToTop';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import './Search.css';

function Search() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchTimeout, setSearchTimeout] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [totalResults, setTotalResults] = useState<number>(0);
  const [filters, setFilters] = useState<RecipesFilters>({});
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [activeFiltersCount, setActiveFiltersCount] = useState<number>(0);

  const initialLoaded = useRef(false);

  useEffect(() => {
    let count = 0;
    if (filters.difficulty) count++;
    if (filters.maxCookingTime) count++;
    if (filters.minCookingTime) count++;
    if (filters.minRating) count++;
    if (filters.category) count++;
    if (filters.area) count++;
    if (filters.source) count++;
    if (filters.hasVideo) count++;
    if (filters.hasImage) count++;
    if (filters.minRatingCount) count++;
    if (filters.tags && filters.tags.length > 0) count++;
    setActiveFiltersCount(count);
  }, [filters]);

  const loadRecipes = useCallback(async (resetPage = true) => {
    const currentPage = resetPage ? 1 : page;
    if (resetPage) setPage(1);

    setLoading(resetPage);
    setError(null);

    const allFilters: RecipesFilters = {
      ...filters,
      ...(searchQuery.trim() && { search: searchQuery.trim() })
    };

    const response = await recipesApi.filterRecipes(allFilters, currentPage, 12);

    if (response.success && response.data) {
      const data = response.data;
      if (resetPage) {
        setRecipes(data.recipes);
      } else {
        setRecipes(prev => {
          const existingIds = new Set(prev.map(r => r._id));
          const newRecipes = data.recipes.filter(r => !existingIds.has(r._id));
          return [...prev, ...newRecipes];
        });
      }
      setTotalResults(data.pagination.total);
      setHasMore(currentPage < data.pagination.pages);
    } else {
      setError(response.error || 'Failed to load recipes');
      if (resetPage) {
        setRecipes([]);
        setTotalResults(0);
      }
    }
    setLoading(false);
  }, [filters, searchQuery, page]);

  const loadMoreRecipes = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    
    const allFilters: RecipesFilters = {
      ...filters,
      ...(searchQuery.trim() && { search: searchQuery.trim() })
    };
    
    const response = await recipesApi.filterRecipes(allFilters, nextPage, 12);
    
    if (response.success && response.data) {
      const data = response.data;
      setRecipes(prev => {
        const existingIds = new Set(prev.map(r => r._id));
        const newRecipes = data.recipes.filter(r => !existingIds.has(r._id));
        return [...prev, ...newRecipes];
      });
      setPage(nextPage);
      setHasMore(nextPage < data.pagination.pages);
    }
    setLoadingMore(false);
  }, [page, loadingMore, hasMore, filters, searchQuery]);

  const { lastElementRef } = useInfiniteScroll({
    hasMore: hasMore && !loadingMore,
    loadMore: loadMoreRecipes
  });

  const handleSearchInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);

    if (searchTimeout) {
      window.clearTimeout(searchTimeout);
    }

    const timeoutId = window.setTimeout(() => {
      loadRecipes(true);
    }, 500);

    setSearchTimeout(timeoutId);
  };

  const handleFilterChange = (newFilters: RecipesFilters) => {
    setFilters(newFilters);
    loadRecipes(true);
    setShowFilters(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilters({});
    loadRecipes(true);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  useEffect(() => {
    if (!initialLoaded.current) {
      loadRecipes(true);
      initialLoaded.current = true;
    }
  }, [loadRecipes]);

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        window.clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="search-page">
      <div className="search-page__header">
        <h1 className="search-page__title">Search Recipes</h1>
        <p className="search-page__subtitle">
          Find recipes from our collection
        </p>

        <div className="search-page__search-section">
          <div className="search-page__search-bar">
            <input
              type="text"
              placeholder="Search by name (e.g., 'chicken', 'pasta')..."
              value={searchQuery}
              onChange={handleSearchInput}
              className="search-page__search-input"
            />
            {searchQuery && (
              <button
                className="search-page__search-clear"
                onClick={clearSearch}
              >
                ✕
              </button>
            )}
          </div>

          <button
            className={`search-page__filter-toggle ${activeFiltersCount > 0 ? 'search-page__filter-toggle--active' : ''}`}
            onClick={toggleFilters}
            disabled={loading}
          >
            <svg className="search-page__filter-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16v2l-6 6v6l-4 2v-8L4 6V4z" />
            </svg>
            Filters
            {activeFiltersCount > 0 && (
              <span className="search-page__filter-count">{activeFiltersCount}</span>
            )}
            <svg className="search-page__filter-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={showFilters ? "M6 9l6 6 6-6" : "M6 15l6-6 6 6"} />
            </svg>
          </button>
        </div>

        {showFilters && (
          <div className="search-page__filters-panel">
            <FiltersComponent 
              onFilterChange={handleFilterChange} 
              isLoading={loading} 
            />
          </div>
        )}

        {!loading && !error && recipes.length > 0 && (
          <div className="search-page__results-count">
            Found {totalResults} {totalResults === 1 ? 'recipe' : 'recipes'}
            {searchQuery && ` for "${searchQuery}"`}
            {activeFiltersCount > 0 && ` with ${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} applied`}
          </div>
        )}
      </div>

      {error && (
        <div className="search-page__error">
          <p>{error}</p>
          <button onClick={() => loadRecipes(true)}>
            Try Again
          </button>
        </div>
      )}

      {/* Recipe grid */}
      <div className="search-page__grid">
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

      {/* No results */}
      {!loading && !error && recipes.length === 0 && (
        <div className="search-page__no-results">
          {searchQuery ? (
            <>
              <p>No recipes found for "{searchQuery}"</p>
              <p className="search-page__no-results-hint">
                Try different keywords or check your spelling
              </p>
            </>
          ) : activeFiltersCount > 0 ? (
            <>
              <p>No recipes match your filters</p>
              <button onClick={() => {
                setFilters({});
                loadRecipes(true);
              }} className="search-page__reset-filters">
                Reset Filters
              </button>
            </>
          ) : (
            <>
              <p>Start searching for recipes!</p>
              <p className="search-page__no-results-hint">
                Search by name or use filters to find your favorite dishes
              </p>
            </>
          )}
        </div>
      )}

      {/* End message */}
      {!hasMore && !loading && recipes.length > 0 && (
        <div className="search-page__end-message">
          <p>You've reached the end! 🎉</p>
        </div>
      )}
      {/* Scroll to Top Button */}
      <ScrollToTop threshold={300} behavior="smooth" />
    </div>
  );
}

export default Search;