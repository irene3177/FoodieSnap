import React from 'react';
import './ChatDetailSkeleton.css';

export const ChatDetailSkeleton: React.FC = () => {
  return (
    <div className="skeleton-chat">
      {/* Header Skeleton */}
      <div className="skeleton-chat__header">
        <div className="skeleton-chat__back"></div>
        <div className="skeleton-chat__recipient">
          <div className="skeleton-chat__avatar"></div>
          <div className="skeleton-chat__recipient-info">
            <div className="skeleton-chat__name"></div>
            <div className="skeleton-chat__status"></div>
          </div>
        </div>
        <div className="skeleton-chat__options"></div>
      </div>

      {/* Messages Area Skeleton */}
      <div className="skeleton-chat__messages">
        {/* Date divider */}
        <div className="skeleton-chat__date-divider">
          <div className="skeleton-chat__date-divider-line"></div>
        </div>

        {/* Received message bubble (left side) */}
        <div className="skeleton-chat__message skeleton-chat__message--received">
          <div className="skeleton-chat__message-avatar"></div>
          <div className="skeleton-chat__message-bubble skeleton-chat__message-bubble--received"></div>
        </div>

        {/* Sent message bubble (right side) */}
        <div className="skeleton-chat__message skeleton-chat__message--sent">
          <div className="skeleton-chat__message-bubble skeleton-chat__message-bubble--sent"></div>
        </div>

        {/* Another received message */}
        <div className="skeleton-chat__message skeleton-chat__message--received">
          <div className="skeleton-chat__message-avatar"></div>
          <div className="skeleton-chat__message-bubble skeleton-chat__message-bubble--received skeleton-chat__message-bubble--long"></div>
        </div>

        {/* Another sent message */}
        <div className="skeleton-chat__message skeleton-chat__message--sent">
          <div className="skeleton-chat__message-bubble skeleton-chat__message-bubble--sent skeleton-chat__message-bubble--short"></div>
        </div>
      </div>

      {/* Input Area Skeleton */}
      <div className="skeleton-chat__input-area">
        <div className="skeleton-chat__input"></div>
        <div className="skeleton-chat__send"></div>
      </div>
    </div>
  );
};