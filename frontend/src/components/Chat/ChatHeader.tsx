// src/components/Chat/ChatHeader.tsx
import React from 'react';
import { useUserStatus } from '../../hooks/chat/useUserStatus';
import { ChatOptions } from './ChatOptions';

interface ChatHeaderProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  onBack: () => void;
  onViewProfile: () => void;
  showOptions: boolean;
  setShowOptions: (show: boolean) => void;
  optionsMenuRef: React.RefObject<HTMLDivElement>;
  onClearChat: () => void;
  onDeleteChat: () => void;
  deleting: boolean;
  currentUserId?: string;
  currentUserAvatar?: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  recipientId,
  recipientName,
  recipientAvatar,
  onBack,
  onViewProfile,
  showOptions,
  setShowOptions,
  optionsMenuRef,
  onClearChat,
  onDeleteChat,
  deleting,
  currentUserId,
  currentUserAvatar
}) => {
  const { isOnline, isTyping } = useUserStatus(recipientId);

  // Determine status text and class
  const getStatusDisplay = () => {
    if (isTyping) {
      return {
        text: 'Typing...',
        className: 'chat-detail__status--typing'
      };
    }
    if (isOnline) {
      return {
        text: 'Online',
        className: 'chat-detail__status--online'
      };
    }
    return {
      text: 'Offline',
      className: 'chat-detail__status--offline'
    };
  };
  
  const status = getStatusDisplay();

  return (
    <div className="chat-detail__header">
      <button className="chat-detail__back" onClick={onBack}>
        ← Back
      </button>

      <div
        className="chat-detail__recipient"
        onClick={onViewProfile}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onViewProfile()}
      >
        <div className="chat-detail__avatar">
          {recipientAvatar ? (
            <img 
              src={recipientAvatar} 
              alt={recipientName}
            />
          ) : (
            <span>{recipientName.charAt(0).toUpperCase() || 'U'}</span>
          )}
        </div>
        <div className="chat-detail__recipient-info">
          <span className="chat-detail__name">{recipientName || 'User'}</span>
          <span className={`chat-detail__status ${status.className}`}>
            {status.text}
          </span>
        </div>
      </div>

      <ChatOptions
        showOptions={showOptions}
        setShowOptions={setShowOptions}
        optionsMenuRef={optionsMenuRef}
        onViewProfile={onViewProfile}
        onClearChat={onClearChat}
        onDeleteChat={onDeleteChat}
        deleting={deleting}
        currentUserId={currentUserId}
        currentUserAvatar={currentUserAvatar}
      />
    </div>
  );
};