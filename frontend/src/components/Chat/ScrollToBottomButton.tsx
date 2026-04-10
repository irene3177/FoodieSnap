import React from 'react';

interface ScrollToBottomButtonProps {
  onClick: () => void;
}

export const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({ onClick }) => {
  return (
    <button 
      className="chat-detail__scroll-button"
      onClick={onClick}
      aria-label="Scroll to bottom"
    >
      ↓
    </button>
  );
};