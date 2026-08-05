import { useState, useEffect, useCallback, useRef } from 'react';
import { recipesApi } from '../../services/recipesApi';
import { Recipe } from '../../types';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import { RecipeCardSkeleton } from '../../components/Skeleton/RecipeCardSkeleton';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { ScrollToTop } from '../../components/ScrollToTop/ScrollToTop';
// import { MdSearch, MdClose } from 'react-icons/md';
// import './Recipes.css';

function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  // const [searchQuery, setSearchQuery] = useState<string>('');
  // const [searchTimeout, setSearchTimeout] = useState<number | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  // const [isSearching, setIsSearching] = useState<boolean>(false);
  // const [totalResults, setTotalResults] = useState<number>(0);

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

    // await new Promise(resolve => setTimeout(resolve, 7000));

    const response = await recipesApi.getRandomRecipes(8, 1);

    if (response.success) {
      setRecipes(response.data?.recipes || []);
      // setTotalResults(response.data?.totalRecipes || 0);
      setPage(2);
      setHasMore(true);
    } else {
      setError(response.error || 'Failed to load recipes. Please try again later.');
    }
    setLoading(false);
  };

  // Load more recipes for infinite scroll
  const loadMoreRecipes = useCallback(async () => {
    if (loadingMore || !hasMore) return;

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
  }, [page, loadingMore, hasMore]);

  const { lastElementRef } = useInfiniteScroll({
    hasMore: hasMore,
    loadMore: loadMoreRecipes
  });

  // Handle search with debounce
  // const handleSearch = async (query: string) => {
  //   if (!query.trim()) {
  //     // If search is empty, load random recipes again
  //     setIsSearching(false);
  //     loadInitialRecipes();
  //     return;
  //   }

  //   setIsSearching(true);
  //   setLoading(true);
  //   setError(null);
    
  //   const result = await recipesApi.searchRecipesByName(query, 1);

  //   if (result.success) {
  //     setRecipes(result.data?.recipes || []);
  //     setTotalResults(result.data?.total || 0);
  //     setHasMore(false);
  //   } else {
  //     setError(result.error || 'Failed to search recipes. Please try again.');
  //   }
  //   setLoading(false);
  // };

  // const handleSearchInput = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const query = event.target.value;
  //   setSearchQuery(query);

  //   if (searchTimeout) {
  //     window.clearTimeout(searchTimeout);
  //   }

  //   const timeoutId = window.setTimeout(() => {
  //     handleSearch(query);
  //   }, 500);

  //   setSearchTimeout(timeoutId);
  // };

  // const clearSearch = () => {
  //   setSearchQuery('');
  //   setIsSearching(false);
  //   loadInitialRecipes();
  // };

  // Clear timeout on component unmount
  // useEffect(() => {
  //   return () => {
  //     if (searchTimeout) {
  //       window.clearTimeout(searchTimeout);
  //     }
  //   };
  // }, [searchTimeout]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:px-6 md:py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-headline-md text-primary text-center mb-6">Discover Recipes</h1>

        {/* Search Bar */}
        {/* <div className="relative max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search for recipes (e.g., 'chicken', 'pasta')..."
            value={searchQuery}
            onChange={handleSearchInput}
            className="input px-9" 
          />
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-xl" />
          {searchQuery && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xl"
              onClick={clearSearch}
            >
              <MdClose className="text-xl" />
            </button>
          )}
        </div> */}

        {/* Results count */}
        {/* {!loading && !error && recipes.length > 0 && (
          <div className="text-center text-sm text-secondary mt-4 mb-2">
            {isSearching ? (
              <>Found {totalResults} {totalResults === 1 ? 'recipe' : 'recipes'}</>
            ) : (
              <>Showing {recipes.length} recipes</>
            )}
          </div>
        )} */}
      </div>

      {/* Error message */}
      {error && (
        <div className="text-center py-12 px-4 bg-error-bg rounded-lg my-8">
          <p className="text-error-text text-lg mb-4">{error}</p>
          <button
            className="btn-primary"
            onClick={loadInitialRecipes}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Masonry grid*/}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {recipes.map((recipe, index) => (
          <div
            className="break-inside-avoid"
            key={`${recipe._id}-${index}`}
            ref={index === recipes.length - 1 ? lastElementRef : null}
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

        {(loading || loadingMore) && !error && (
          <>
            {[...Array(6)].map((_, index) => (
              <div key={`skeleton-${index}`} className="break-inside-avoid">
                <RecipeCardSkeleton 
                  aspectRatio={
                    index+2 % 3 === 0 ? 'portrait' : 
                    index % 3 === 1 ? 'square' : 
                    'landscape'
                  }
                />
              </div>
            ))}
          </>
        )}
      </div>

      {/* Results */}
      {/* {!loading && !error && recipes?.length === 0 && (
        <div className="text-center py-12 px-4 bg-secondary rounded-lg my-8">
          <p className="text-primary text-xl mb-2">No recipes found for "{searchQuery}"</p>
          <p className="text-secondary text-sm">
            Try different keywords or check your spelling
          </p>
        </div>
      )} */}

      {/* End message */}
      {!hasMore && recipes.length === 0 && (
        <div className="text-center py-8 text-secondary text-base">
          <p className="relative inline-block">You've reached the end! 🎉</p>
        </div>
      )}
      <ScrollToTop threshold={400} behavior="smooth" />
    </div>
  );
}

export default Recipes;