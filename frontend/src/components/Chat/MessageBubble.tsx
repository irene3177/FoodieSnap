import React from 'react';
import { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage }) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);

    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
  };

  return (
    <div
      className={`message ${isOwnMessage ? 'message--sent' : 'message--received'}`}
    >
      {!isOwnMessage && (
        <img 
          src={message.senderId.avatar || message.senderId.username.charAt(0).toUpperCase()}
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