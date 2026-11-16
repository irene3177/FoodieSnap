import React from 'react';
import './UsersSkeleton.css';

export const UsersSkeleton: React.FC = () => {
  return (
    <div className="skeleton-users">
      {/* Header */}
      <div className="skeleton-users__header">
        <div className="skeleton-users__title"></div>
        <div className="skeleton-users__subtitle"></div>
        
        {/* Search bar */}
        <div className="skeleton-users__search">
          <div className="skeleton-users__search-input"></div>
        </div>
        
        {/* Results count */}
        <div className="skeleton-users__results-count"></div>
      </div>

      {/* Users list */}
      <div className="skeleton-users__list">
        {/* User item 1 */}
        <div className="skeleton-users__item">
          <div className="skeleton-users__avatar"></div>
          <div className="skeleton-users__info">
            <div className="skeleton-users__name"></div>
            <div className="skeleton-users__bio"></div>
          </div>
        </div>

        {/* User item 2 */}
        <div className="skeleton-users__item">
          <div className="skeleton-users__avatar"></div>
          <div className="skeleton-users__info">
            <div className="skeleton-users__name"></div>
            <div className="skeleton-users__bio skeleton-users__bio--long"></div>
          </div>
        </div>

        {/* User item 3 */}
        <div className="skeleton-users__item">
          <div className="skeleton-users__avatar"></div>
          <div className="skeleton-users__info">
            <div className="skeleton-users__name"></div>
            <div className="skeleton-users__bio skeleton-users__bio--short"></div>
          </div>
        </div>

        {/* User item 4 */}
        <div className="skeleton-users__item">
          <div className="skeleton-users__avatar"></div>
          <div className="skeleton-users__info">
            <div className="skeleton-users__name"></div>
            <div className="skeleton-users__bio"></div>
          </div>
        </div>

        {/* User item 5 */}
        <div className="skeleton-users__item">
          <div className="skeleton-users__avatar"></div>
          <div className="skeleton-users__info">
            <div className="skeleton-users__name"></div>
            <div className="skeleton-users__bio skeleton-users__bio--long"></div>
          </div>
        </div>

        {/* User item 6 */}
        <div className="skeleton-users__item">
          <div className="skeleton-users__avatar"></div>
          <div className="skeleton-users__info">
            <div className="skeleton-users__name"></div>
            <div className="skeleton-users__bio"></div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      <div className="skeleton-users__pagination">
        <div className="skeleton-users__pagination-prev"></div>
        <div className="skeleton-users__pagination-pages">
          <div className="skeleton-users__pagination-page"></div>
          <div className="skeleton-users__pagination-page"></div>
          <div className="skeleton-users__pagination-page"></div>
          <div className="skeleton-users__pagination-page"></div>
          <div className="skeleton-users__pagination-page"></div>
        </div>
        <div className="skeleton-users__pagination-next"></div>
      </div>
    </div>
  );
};