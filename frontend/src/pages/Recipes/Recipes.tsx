import { useMemo, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import Masonry from 'react-masonry-css';
import { useRecipes } from '../../hooks/useRecipes';
// import { recipesApi } from '../../services/recipesApi';
import RecipeCard from '../../components/RecipeCard/RecipeCard';
import { ScrollToTop } from '../../components/ScrollToTop/ScrollToTop';
import { RecipeCardSkeleton } from '../../components/Skeleton/RecipeCardSkeleton';
// import { useInfiniteScroll } from '../../hooks/useInfiniteScroll';
import { Recipe } from '../../types';

const BREAKPOINT_COLS = {
  default: 3,
  1024: 2,
  768: 2,
  640: 1,
};

function Explore() {

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '200px 0px',
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useRecipes({
    initialCount: 8,
    loadMoreCount: 6,
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const recipes = useMemo(() => {
    return data?.pages.flatMap((page) => page.recipes) ?? [];
  }, [data]);

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

  if (isLoading) {
    return (
      <div className="max-w-[1400px] mx-auto px-8 py-12">
        <HeaderContent />
        <Masonry
          breakpointCols={BREAKPOINT_COLS}
          className="flex w-auto -ml-6"
          columnClassName="pl-6 bg-clip-padding"
        >
          {skeletonItems.map((item) => (
            <div key={item.id} className="mb-6 w-full max-w-[450px]">
              <RecipeCardSkeleton aspectRatio={item.aspectRatio} />
            </div>
          ))}
        </Masonry>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-[1400px] mx-auto px-8 py-12">
        <HeaderContent />
        <div className="text-center py-12 px-4 bg-error rounded-lg max-w-md mx-auto">
          <p className="text-error text-lg mb-4">
            {error instanceof Error ? error.message : 'Failed to load recipes'}
          </p>
          <button
            className="px-6 py-2.5 bg-accent text-white rounded-full hover:bg-accent-hover transition-colors"
            onClick={() => refetch()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!recipes.length) {
    return (
      <div className="max-w-[1400px] mx-auto px-8 py-12">
        <HeaderContent />
        <div className="text-center py-12">
          <p className="text-lg text-secondary">No recipes found. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-12">
      <HeaderContent />

      <Masonry
        breakpointCols={BREAKPOINT_COLS}
        className="flex w-auto -ml-6"
        columnClassName="pl-6 bg-clip-padding"
      >
        {recipes.map((recipe: Recipe, index: number) => {
          const isLastItem = index === recipes.length - 1;
          return (
            <div
              key={`${recipe._id}-${index}`}
              ref={isLastItem ? ref : undefined}
              className="mb-6 w-full max-w-[450px] justify-self-center"
            >
              <RecipeCard
                recipe={recipe}
                aspectRatio={getAspectRatio(index)}
              />
            </div>
          );
        })}

        {/* Skeletons for next page loading */}
        {isFetchingNextPage && (
          <>
            {skeletonItems.map((item) => (
              <div key={`${item.id}-more`} className="mb-6 w-full max-w-[450px]">
                <RecipeCardSkeleton aspectRatio={item.aspectRatio} />
              </div>
            ))}
          </>
        )}
      </Masonry>

      {/* Load Indicator */}
      {isFetchingNextPage && (
        <div className="text-center py-4 text-muted text-sm">
          <span className="inline-block animate-pulse">Loading more recipes...</span>
        </div>
      )}

      {/* End of the List */}
      {!hasNextPage && recipes.length > 0 && (
        <div className="text-center py-8 text-secondary text-base">
          <p className="relative inline-block">You've reached the end!</p>
        </div>
      )}

      <ScrollToTop threshold={400} behavior="smooth" />
    </div>
  );
}

function HeaderContent() {
  return (
    <div className="mb-10 cursor-default">
      <h1 className="font-display-lg text-display-lg text-secondary tracking-tight">
        Find Your Next Favorite Meal
      </h1>
      <p className="text-muted font-body-lg text-body-lg mt-2">
        Explore new flavors and get inspired by recipes from around the world
      </p>
    </div>
  );
}

export default Explore;