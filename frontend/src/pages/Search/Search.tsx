import { useState, useEffect, useMemo } from 'react';
import { useInView } from 'react-intersection-observer';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { fetchFiltersData } from '../../store/filtersSlice';
import { useSearchRecipes } from '../../hooks/useSearchRecipes';
import { RecipesFilters } from '../../types';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import { RecipeCardSkeleton } from '../../components/Skeleton/RecipeCardSkeleton';
import Masonry from 'react-masonry-css';
import { RecipeFilters as FiltersComponent } from '../../components/RecipeFilters/RecipeFilters';
import { ScrollToTop } from '../../components/ScrollToTop/ScrollToTop';
import { MdClose, MdFilterList, MdSearch } from 'react-icons/md';

const BREAKPOINT_COLS = {
  default: 3,
  1024: 2,
  768: 2,
  640: 1,
};

function Search() {
  const dispatch = useAppDispatch();
  const { categories, tags, areas, loading: filtersLoading, initialized } = useAppSelector(state => state.filters);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [filters, setFilters] = useState<RecipesFilters>({});
  const [showFilters, setShowFilters] = useState<boolean>(false);
 
  useEffect(() => {
    if (!initialized) {
      dispatch(fetchFiltersData());
    }
  }, [dispatch, initialized]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.difficulty) count++;
    if (filters.maxCookingTime) count++;
    if (filters.minCookingTime) count++;
    if (filters.minRating) count++;
    if (filters.categories?.length) count++;
    if (filters.area) count++;
    if (filters.source) count++;
    if (filters.hasVideo) count++;
    if (filters.hasImage) count++;
    if (filters.minRatingCount) count++;
    if (filters.tags?.length) count++;
    return count;
  }, [filters]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useSearchRecipes({
    searchQuery: debouncedSearch,
    filters,
  });

  const recipes = useMemo(() => {
    return data?.pages.flatMap((page) => page.recipes) ?? [];
  }, [data]);

  const totalResults = useMemo(() => {
    return data?.pages[0]?.total || 0;
  }, [data]);

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px 0px',
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleSearchInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleFilterChange = (newFilters: RecipesFilters) => {
    setFilters(newFilters);
    setShowFilters(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setDebouncedSearch('');
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const getAspectRatio = (index: number): 'portrait' | 'square' | 'landscape' => {
    if (index % 3 === 0) return 'portrait';
    if (index % 3 === 1) return 'square';
    return 'landscape';
  };

  const skeletonItems = useMemo(() => {
    return Array(4)
      .fill(null)
      .map((_, index) => ({
        id: `skeleton-${index}`,
        aspectRatio: getAspectRatio(index),
      }));
  }, []);


  return (
    <div className="max-w-7xl mx-auto px-8 py-8 md:py-10 min-h-screen">
      <div className="text-center mb-8 cursor-default">
        <h1 className="font-display-lg text-display-lg text-secondary tracking-tight">Search Recipes</h1>
        <p className=" text-muted font-body-lg text-body-lg mt-2 mb-6">
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
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-transparent border-none text-muted w-8 h-8 flex items-center justify-center rounded-lg hover:bg-border transition-colors duration-500 cursor-pointer"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <MdClose className="text-xl" />
              </button>
            )}
          </div>

          <button
            className={`
              flex items-center gap-2 whitespace-nowrap
              ${activeFiltersCount > 0 
                ? 'btn-primary' 
                : 'btn-secondary'
              }
            `}
            onClick={toggleFilters}
            disabled={isLoading}
          >
            <MdFilterList className="w-5 h-5" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="rounded-lg bg-white px-2 text-sm text-button">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Results count */}
        {!isLoading && !isError && recipes.length > 0 && (
          <div className="text-sm text-muted mt-4">
            Found {totalResults} {totalResults === 1 ? 'recipe' : 'recipes'}
            {debouncedSearch && ` for "${debouncedSearch}"`}
            {activeFiltersCount > 0 && ` with ${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} applied`}
          </div>
        )}
      </div>

      {/* No Results */}
      {!isLoading && !isError && recipes.length === 0 && (
        <div className="text-center py-12 px-6 bg-secondary rounded-xl max-w-md mx-auto my-8">
          {debouncedSearch ? (
            <>
              <p className="text-lg font-medium text-primary mb-2">No recipes found for "{debouncedSearch}"</p>
              <p className="text-secondary text-sm">
                Try different keywords or check your spelling
              </p>
            </>
          ) : activeFiltersCount > 0 ? (
            <>
              <p className="text-lg font-medium text-primary mb-2">No recipes match your filters</p>
              <button 
                onClick={() => {
                  setFilters({});
                }} 
                className="mt-4 px-6 py-2.5 bg-accent text-white rounded-full hover:bg-accent-hover transition-colors"
              >
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

      {/* Error */}
      {isError && (
        <div className="text-center py-12 px-4 bg-error-bg rounded-xl max-w-md mx-auto my-8">
          <p className="text-error-text text-lg mb-4">
            {error instanceof Error ? error.message : 'Failed to load recipes'}
          </p>
          <button
            className="px-6 py-2.5 bg-accent text-white rounded-full hover:bg-accent-hover transition-colors"
            onClick={() => refetch()}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Results */}
      {recipes.length > 0 && (
        <>
          <Masonry
            breakpointCols={BREAKPOINT_COLS}
            className="flex w-auto -ml-6"
            columnClassName="pl-6 bg-clip-padding"
          >
            {recipes.map((recipe, index) => {
              const isLastItem = index === recipes.length - 1;
              return (
                <div
                  key={`${recipe._id}-${index}`}
                  ref={isLastItem ? ref : undefined}
                  className="mb-6 w-full max-w-[450px]"
                >
                  <RecipeCard
                    recipe={recipe}
                    aspectRatio={getAspectRatio(index)}
                  />
                </div>
              );
            })}

            {/* Loading Skeletons */}
            {(isLoading || isFetchingNextPage) && !isError && (
              <>
                {skeletonItems.map((item) => (
                  <div key={`${item.id}-loading`} className="mb-6 w-full max-w-[450px]">
                    <RecipeCardSkeleton aspectRatio={item.aspectRatio} />
                  </div>
                ))}
              </>
            )}
          </Masonry>

          {/* Loading Indicator */}
          {isFetchingNextPage && (
            <div className="text-center py-4 text-muted text-sm">
              <span className="inline-block animate-pulse">Loading more recipes...</span>
            </div>
          )}

          {/* End of the List */}
          {!hasNextPage && recipes.length > 0 && (
            <div className="text-center py-6 text-muted text-sm">
              <p>You've reached the end! 🎉</p>
            </div>
          )}
        </>
      )}

      <ScrollToTop threshold={300} behavior="smooth" />

      {/* Фильтры */}
      <FiltersComponent
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onFilterChange={handleFilterChange}
        isLoading={isLoading}
        categories={categories}
        tags={tags}
        areas={areas}
        filtersLoading={filtersLoading}
      />
    </div>
  );
}

export default Search;