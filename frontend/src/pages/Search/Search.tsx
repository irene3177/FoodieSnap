import { useState, useEffect, useCallback, useRef } from 'react';
import { recipesApi } from '../../services/recipesApi';
import { Recipe, RecipesFilters } from '../../types';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import { RecipeCardSkeleton } from '../../components/Skeleton/Skeleton';
import Masonry from 'react-masonry-css';
import { RecipeFilters as FiltersComponent } from '../../components/RecipeFilters/RecipeFilters';
import { ScrollToTop } from '../../components/ScrollToTop/ScrollToTop';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { MdClose, MdFilterList, MdKeyboardArrowUp, MdSearch } from 'react-icons/md';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { fetchFiltersData } from '../../store/filtersSlice';

function Search() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const dispatch = useAppDispatch();
  const { categories, tags, areas, loading: filtersLoading, initialized } = useAppSelector(state => state.filters);
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
    if (!initialized) {
      dispatch(fetchFiltersData());
    }
  }, [dispatch, initialized]);

  useEffect(() => {
    let count = 0;
    if (filters.difficulty) count++;
    if (filters.maxCookingTime) count++;
    if (filters.minCookingTime) count++;
    if (filters.minRating) count++;
    if (filters.categories) count++;
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
    console.log('🔵 Search: получены фильтры:', newFilters);
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
    if (initialLoaded.current) {
      loadRecipes(true);
    }
  }, [filters]);

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        window.clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="max-w-7xl mx-auto px-8 py-8 md:py-10 min-h-screen">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-headline-md text-primary mb-2">Search Recipes</h1>
        <p className="text-secondary mb-6">
          Find recipes from our collection
        </p>

        {/* Search Section */}
        <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name (e.g., 'chicken', 'pasta')..."
              value={searchQuery}
              onChange={handleSearchInput}
              className="input px-10"
            />
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xl" />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-muted w-8 h-8 flex items-center justify-center rounded-full hover:bg-border transition-colors cursor-pointer"
                onClick={clearSearch}
              >
                <MdClose className="text-xl" />
              </button>
            )}
          </div>

          <button
            className={`
              flex items-center gap-2 px-4 py-3 rounded-xl border font-medium text-sm whitespace-nowrap transition-all duration-200
              ${activeFiltersCount > 0 
                ? 'bg-accent border-accent text-white hover:bg-accent-hover' 
                : 'bg-secondary text-primary hover:bg-border'
              }
            `}
            onClick={toggleFilters}
            disabled={loading}
          >
            <MdFilterList className="w-5 h-5" />
            Filters
            {activeFiltersCount > 0 && (
              <span className={`
                rounded-full px-2 py-0.5 text-xs font-bold
                ${activeFiltersCount > 0 ? 'bg-white/20 text-white' : 'bg-accent text-white'}
              `}>{activeFiltersCount}</span>
            )}
            <MdKeyboardArrowUp className="w-5 h-5" />
          </button>
        </div>

        {/* Results count */}
        {!loading && !error && recipes.length > 0 && (
          <div className="text-sm text-muted mt-4">
            Found {totalResults} {totalResults === 1 ? 'recipe' : 'recipes'}
            {searchQuery && ` for "${searchQuery}"`}
            {activeFiltersCount > 0 && ` with ${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} applied`}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="text-center py-12 px-4 bg-error rounded-xl max-w-md mx-auto my-8">
          <p className="text-error mb-4">{error}</p>
          <button
            className="px-6 py-2.5 bg-accent text-white rounded-full hover:bg-accent-hover transition-colors"
            onClick={() => loadRecipes(true)}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Recipe grid */}
      <Masonry
        breakpointCols={{
          default: 3,
          1024: 2,
          768: 2,
          640: 1
        }}
        className="flex w-auto -ml-6"
        columnClassName="pl-6 bg-clip-padding"
      >
        {recipes.map((recipe, index) => (
          <div
            key={`${recipe._id}-${index}`}
            ref={index === recipes.length - 1 ? lastElementRef : null}
            className="mb-6 w-full max-w-[450px] justify-self-center"
          >
            <RecipeCard
              recipe={recipe}
              aspectRatio={
                index % 3 === 0 ? 'portrait' : 
                index % 3 === 1 ? 'square' : 
                'landscape'
              }
            />
          </div>
        ))}
      </Masonry>
      {(loading || loadingMore) && !error && (
        <>
          {[...Array(4)].map((_, index) => (
            <RecipeCardSkeleton key={`skeleton-${index}`} />
          ))}
        </>
      )}

      {/* No results */}
      {!loading && !error && recipes.length === 0 && (
        <div className="text-center py-12 px-6 bg-secondary rounded-xl max-w-md mx-auto my-8">
          {searchQuery ? (
            <>
              <p className="text-lg font-medium text-primary mb-2">No recipes found for "{searchQuery}"</p>
              <p className="text-secondary text-sm">
                Try different keywords or check your spelling
              </p>
            </>
          ) : activeFiltersCount > 0 ? (
            <>
              <p className="text-lg font-medium text-primary mb-2">No recipes match your filters</p>
              <button onClick={() => {
                setFilters({});
                loadRecipes(true);
              }} className="mt-4 px-6 py-2.5 bg-accent text-white rounded-full hover:bg-accent-hover transition-colors">
                Reset Filters
              </button>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-primary mb-2">Start searching for recipes!</p>
              <p className="text-secondary text-sm">
                Search by name or use filters to find your favorite dishes
              </p>
            </>
          )}
        </div>
      )}

      {/* End message */}
      {!hasMore && !loading && recipes.length > 0 && (
        <div className="text-center py-6 text-muted text-sm">
          <p>You've reached the end! 🎉</p>
        </div>
      )}
      {/* Scroll to Top Button */}
      <ScrollToTop threshold={300} behavior="smooth" />
      <FiltersComponent
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onFilterChange={handleFilterChange} 
        isLoading={loading}
        categories={categories}
        tags={tags}
        areas={areas}
        filtersLoading={filtersLoading}
      />
    </div>
  );
}

export default Search;