import React from 'react';
import './ChatsSkeleton.css';

export const ChatsSkeleton: React.FC = () => {
  return (
    <div className="skeleton-chats">
      {/* Header */}
      <div className="skeleton-chats__header">
        <div className="skeleton-chats__title"></div>
        <div className="skeleton-chats__new-chat"></div>
      </div>

      {/* Chat items list */}
      <div className="skeleton-chats__list">
        {/* Chat item 1 */}
        <div className="skeleton-chats__item">
          <div className="skeleton-chats__avatar"></div>
          <div className="skeleton-chats__info">
            <div className="skeleton-chats__header-row">
              <div className="skeleton-chats__name"></div>
              <div className="skeleton-chats__time"></div>
            </div>
            <div className="skeleton-chats__preview-row">
              <div className="skeleton-chats__message"></div>
            </div>
          </div>
        </div>

        {/* Chat item 2 */}
        <div className="skeleton-chats__item">
          <div className="skeleton-chats__avatar"></div>
          <div className="skeleton-chats__info">
            <div className="skeleton-chats__header-row">
              <div className="skeleton-chats__name"></div>
              <div className="skeleton-chats__time"></div>
            </div>
            <div className="skeleton-chats__preview-row">
              <div className="skeleton-chats__message"></div>
            </div>
          </div>
        </div>

        {/* Chat item 3 */}
        <div className="skeleton-chats__item">
          <div className="skeleton-chats__avatar"></div>
          <div className="skeleton-chats__info">
            <div className="skeleton-chats__header-row">
              <div className="skeleton-chats__name"></div>
              <div className="skeleton-chats__time"></div>
            </div>
            <div className="skeleton-chats__preview-row">
              <div className="skeleton-chats__message skeleton-chats__message--long"></div>
            </div>
          </div>
        </div>

        {/* Chat item 4 */}
        <div className="skeleton-chats__item">
          <div className="skeleton-chats__avatar"></div>
          <div className="skeleton-chats__info">
            <div className="skeleton-chats__header-row">
              <div className="skeleton-chats__name"></div>
              <div className="skeleton-chats__time"></div>
            </div>
            <div className="skeleton-chats__preview-row">
              <div className="skeleton-chats__message"></div>
            </div>
          </div>
        </div>

        {/* Chat item 5 */}
        <div className="skeleton-chats__item">
          <div className="skeleton-chats__avatar"></div>
          <div className="skeleton-chats__info">
            <div className="skeleton-chats__header-row">
              <div className="skeleton-chats__name"></div>
              <div className="skeleton-chats__time"></div>
            </div>
            <div className="skeleton-chats__preview-row">
              <div className="skeleton-chats__message skeleton-chats__message--short"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};