import { RecipeCardSkeleton } from './RecipeCardSkeleton';

interface FavoritesGridSkeletonProps {
  count?: number;
}

export function FavoritesGridSkeleton({ count = 8 }: FavoritesGridSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
      {Array(count)
        .fill(null)
        .map((_, i) => (
          <RecipeCardSkeleton key={i} aspectRatio="square" />
        ))}
    </div>
  );
}