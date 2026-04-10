import React from 'react';
import { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div
      className={`message ${isOwnMessage ? 'message--sent' : 'message--received'}`}
    >
      {!isOwnMessage && (
        <img 
          src={message.senderId.avatar || 'https://picsum.photos/32/32'}
          alt={message.senderId.username}
          className="message__avatar"
        />
      )}
      <div className="message__bubble">
        <p className="message__text">{message.text || ''}</p>
        <span className="message__time">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
};