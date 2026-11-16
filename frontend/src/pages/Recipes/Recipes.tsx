import { useMemo, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import Masonry from 'react-masonry-css';
import { useRecipes } from '@/hooks/useRecipes';
import { Recipe } from '@/types';
import RecipeCard from '@/components/RecipeCard/RecipeCard';
import { EmptyState, ErrorState, ScrollToTop } from '@/components/ui';
import { RecipeCardSkeleton } from '@/components/ui/Skeleton/RecipeCardSkeleton';
import { MdOutlineRestaurantMenu } from 'react-icons/md';

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

  return (
    <div className="max-w-[1400px] mx-auto px-8 py-12">
      <HeaderContent />

      {isLoading ? (
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
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load recipes'}
          onRetry={() => refetch()}
        />
      ) : !recipes.length ? (
        <div className="flex justify-center">
          <EmptyState
            icon={<MdOutlineRestaurantMenu />}
            title="No recipes found"
            description="Please try again later."
            action={{
              label: 'Retry',
              to: '/recipes',
            }}
          />
        </div>
      ) : (
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
      )}


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