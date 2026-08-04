import { useState, useEffect, useCallback, useRef } from 'react';
import { recipesApi } from '../../services/recipesApi';
import { Recipe } from '../../types';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import { RecipeCardSkeleton } from '../../components/Skeleton/RecipeCardSkeleton';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { ScrollToTop } from '../../components/ScrollToTop/ScrollToTop';

function Recipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
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

  return (
    <div className="max-w-[1400px] overflow-y-auto mx-auto p-12 scrollbar-thin">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] text-secondary text-center mb-6 cursor-default">Find Your Next Favorite Meal</h1>
        <p 
          className="text-muted text-[clamp(1rem,1.5vw,1.25rem)] max-w-2xl mx-auto justify-center cursor-default  text-balance text-center"
        >
          Explore new flavors and get inspired by recipes from around the world
        </p>
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
            className="break-inside-avoid flex justify-center"
            key={`${recipe._id}-${index}`}
            ref={index === recipes.length - 1 ? lastElementRef : null}
          >
            <div className="w-full max-w-[450px]">
              <RecipeCard
                recipe={recipe}
                aspectRatio={
                  index % 3 === 0 ? 'portrait' : 
                  index % 3 === 1 ? 'square' : 
                  'landscape'
                }
              />
            </div>
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