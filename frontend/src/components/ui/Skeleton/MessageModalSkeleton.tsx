import React from 'react';
import './MessageModalSkeleton.css';

export const MessageModalSkeleton: React.FC = () => {
  return (
    <div className="skeleton-message-modal">
      {/* Messages Area */}
      <div className="skeleton-message-modal__messages">
        {/* Received message */}
        <div className="skeleton-message-modal__message skeleton-message-modal__message--received">
          <div className="skeleton-message-modal__message-avatar"></div>
          <div className="skeleton-message-modal__message-bubble"></div>
        </div>

        {/* Sent message */}
        <div className="skeleton-message-modal__message skeleton-message-modal__message--sent">
          <div className="skeleton-message-modal__message-bubble skeleton-message-modal__message-bubble--sent"></div>
        </div>

        {/* Another received message */}
        <div className="skeleton-message-modal__message skeleton-message-modal__message--received">
          <div className="skeleton-message-modal__message-avatar"></div>
          <div className="skeleton-message-modal__message-bubble skeleton-message-modal__message-bubble--long"></div>
        </div>

        {/* Another sent message */}
        <div className="skeleton-message-modal__message skeleton-message-modal__message--sent">
          <div className="skeleton-message-modal__message-bubble skeleton-message-modal__message-bubble--sent skeleton-message-modal__message-bubble--short"></div>
        </div>

        {/* Received message */}
        <div className="skeleton-message-modal__message skeleton-message-modal__message--received">
          <div className="skeleton-message-modal__message-avatar"></div>
          <div className="skeleton-message-modal__message-bubble"></div>
        </div>
      </div>

      {/* Input Area */}
      <div className="skeleton-message-modal__input-area">
        <div className="skeleton-message-modal__input"></div>
        <div className="skeleton-message-modal__send"></div>
      </div>
    </div>
  );
};