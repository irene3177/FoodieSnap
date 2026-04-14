import React from 'react';
import { Link } from 'react-router-dom';

interface ChatOptionsProps {
  showOptions: boolean;
  setShowOptions: (show: boolean) => void;
  optionsMenuRef: React.RefObject<HTMLDivElement>;
  onViewProfile: () => void;
  onClearChat: () => void;
  onDeleteChat: () => void;
  deleting: boolean;
  currentUserId?: string;
  currentUserAvatar?: string;
}

export const ChatOptions: React.FC<ChatOptionsProps> = ({
  showOptions,
  setShowOptions,
  optionsMenuRef,
  onClearChat,
  onDeleteChat,
  deleting,
  currentUserId,
  currentUserAvatar
}) => {
  return (
    <div className="chat-detail__options-wrapper" ref={optionsMenuRef}>
      <button 
        className="chat-detail__options-button"
        onClick={() => setShowOptions(!showOptions)}
        aria-label="More options"
        disabled={deleting}
      >
        ⋮
      </button>

      {showOptions && (
        <div className="chat-detail__options-menu">
          {/* Profile section */}
          <div className="chat-detail__options-section">
            <div className="chat-detail__options-section-title">Profile</div>
            {currentUserId && (
              <Link 
                to="/me" 
                className="chat-detail__options-item"
                onClick={() => setShowOptions(false)}
              >
                <div className="chat-detail__options-avatar">
                  {currentUserAvatar ? (
                    <img 
                      src={currentUserAvatar} 
                      alt=""
                    />
                  ) : (
                    <span>U</span>
                  )}
                </div>
                My Profile
              </Link>
            )}
          </div>

          {/* Navigation section */}
          <div className="chat-detail__options-section">
            <div className="chat-detail__options-section-title">Explore</div>
            <Link 
              to="/recipes" 
              className="chat-detail__options-item"
              onClick={() => setShowOptions(false)}
            >
              🍽️ Discover Recipes
            </Link>
            <Link 
              to="/top-rated" 
              className="chat-detail__options-item"
              onClick={() => setShowOptions(false)}
            >
              ⭐ Top Rated Recipes
            </Link>
            <Link 
              to="/users" 
              className="chat-detail__options-item"
              onClick={() => setShowOptions(false)}
            >
              👥 Find People
            </Link>
          </div>

          {/* Chat actions section */}
          <div className="chat-detail__options-section">
            <div className="chat-detail__options-section-title">Chat Actions</div>
            <button 
              className="chat-detail__options-item"
              onClick={onClearChat}
            >
              🧹 Clear Chat History
            </button>
            <button 
              className="chat-detail__options-item chat-detail__options-item--delete"
              onClick={onDeleteChat}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : '🗑️ Delete Conversation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};