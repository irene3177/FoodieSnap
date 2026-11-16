interface RecipeCardSkeletonProps {
  aspectRatio?: 'portrait' | 'square' | 'landscape';
}

export function RecipeCardSkeleton({ aspectRatio = 'square' }: RecipeCardSkeletonProps) {
  const getImageHeight = () => {
    switch (aspectRatio) {
      case 'portrait': return 'h-[clamp(16rem,25vw,20rem)]';
      case 'square': return 'h-[clamp(12rem,18vw,16rem)]';
      case 'landscape': return 'h-[clamp(10rem,14vw,14rem)]';
      default: return 'h-[clamp(12rem,18vw,16rem)]';
    }
  };

  return (
    <div className=" bg-card rounded-xl overflow-hidden border shadow-theme">
      <div className={`${getImageHeight()} bg-skeleton-base`} />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-skeleton-base rounded w-3/4" />
        <div className="h-4 bg-skeleton-base rounded w-1/2" />
        <div className="h-4 bg-skeleton-base rounded w-full" />
        <div className="h-4 bg-skeleton-base rounded w-2/3" />
      </div>
    </div>
  );
}