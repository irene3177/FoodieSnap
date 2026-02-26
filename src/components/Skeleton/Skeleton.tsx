import './Skeleton.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  borderRadius = '4px',
  className = ''
}) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius
  };

  return <div className={`skeleton ${className}`} style={style} />
};

export const RecipeCardSkeleton: React.FC = () => {
  return (
    <div className="skeleton-card">
      <Skeleton height={200} borderRadius="8px 8px 0 0" />
      <div className="skeleton-card__content">
        <Skeleton width="80%" height={24} />
        <Skeleton width="100%" height={16} />
        <Skeleton width="60%" height={16} />
        <div className="skeleton-card__footer">
          <Skeleton width="40%" height={20} />
          <Skeleton width="30%" height={20} />
        </div>
      </div>
    </div>
  );
};

export const RecipeDetailSkeleton: React.FC = () => {
  return (
    <div className="skeleton-detail">
      <Skeleton width={100} height={32} className="skeleton-detail__back" />

      <div className="skeleton-detail__container">
        <div className="skeleton-detail__grid">
          <div className="skeleton-detail__image-container">
            <Skeleton height={400} borderRadius="8px" />
          </div>

          <div className="skeleton-detail__info">
            <Skeleton width="80%" height={48} className="skeleton-detail__section-title" />
            
            <div className="skeleton-detail__meta">
              <Skeleton width={80} height={24} borderRadius="12px" />
              <Skeleton width={80} height={24} borderRadius="12px" />
              <Skeleton width={80} height={24} borderRadius="12px" />
            </div>

            <div className="skeleton-detail__description">
              <Skeleton width="100%" height={24} />
              <Skeleton width="100%" height={24} />
              <Skeleton width="100%" height={24} />
              <Skeleton width="40%" height={24} />
            </div>

            <div className="skeleton-detail__section">
              <Skeleton width="50%" height={48} className="skeleton-detail__section-title" />
              <Skeleton width="40%" height={24} className="skeleton-detail__link" />
            </div>
          </div>
        </div>

        <div className="skeleton-detail__bottom">
          <div className="skeleton-detail__section">
            <Skeleton width="50%" height={48} className="skeleton-detail__section-title" />
            <div className="skeleton-detail__ingredient-list">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="skeleton-detail__ingredient-item">
                  <Skeleton width={16} height={16} borderRadius="50%" />
                  <Skeleton width="60%" height={20} />
                </div>
              ))}
            </div>
          </div>

          <div className="skeleton-detail__section">
            <Skeleton width="50%" height={48} className="skeleton-detail__section-title" />
            <div className="skeleton-detail__instructions">
              <Skeleton width="100%" height={20} />
              <Skeleton width="100%" height={20} />
              <Skeleton width="100%" height={20} />
              <Skeleton width="90%" height={20} />
              <Skeleton width="80%" height={20} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FavoritesSkeleton: React.FC = () => {
  return (
    <div className="skeleton-favorites">
      <div className="skeleton-favorites__header">
        <Skeleton width={200} height={40} />
        <Skeleton width={100} height={36} />
      </div>

      <div className="skeleton-favorites__count">
        <Skeleton width={150} height={20} />
      </div>

      <div className="skeleton-favorites__grid">
        {[1, 2, 3, 4, 5].map((i => (
          <RecipeCardSkeleton key={i} />
        )))}
      </div>
    </div>
  );
};