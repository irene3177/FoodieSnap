import React from 'react';
import { Message } from '../../types';
import Avatar from '../Avatar';

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
      className={`
        flex gap-2 items-start max-w-[80%] mb-3
        ${isOwnMessage ? 'flex-row-reverse self-end ml-auto' : 'self-start'}
      `}
    >
      {/* Avatar */}
      {!isOwnMessage && (
        <Avatar to={`/user/${message.senderId._id}`} src={message.senderId.avatar} username={message.senderId.username} size="sm" border />
      )}
      {/* Bubble */}
      <div className={`
          max-w-full px-4 py-3 rounded-2xl break-words relative text-secondary
          ${isOwnMessage
            ? 'bg-accent-secondary-bg  rounded-br-[4px]'
            : 'bg-secondary rounded-bl-[4px]'
          }
        `}>
        <p className="text-sm leading-relaxed m-0 mb-0.5 break-words">{message.text || ''}</p>
        <span className="text-xs block text-right text-muted">{formatTime(message.createdAt)}</span>
      </div>
    </div>
  );
};