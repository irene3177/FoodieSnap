import React from 'react';
import { Message } from '../../types';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onScroll: () => void;
  currentUserId?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  messagesContainerRef,
  messagesEndRef,
  onScroll,
  currentUserId
}) => {
  const groupMessagesByDate = () => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach(message => {
      const date = new Date(message.createdAt).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
    }
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div
      className="chat-detail__messages"
      ref={messagesContainerRef}
      onScroll={onScroll}
    >
      {Object.entries(messageGroups).map(([date, dateMessages]) => (
        <div key={date}>
          <div className="chat-detail__date-divider">
            <span>{formatDate(dateMessages[0].createdAt)}</span>
          </div>
          {dateMessages.map((msg) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isOwnMessage={msg.senderId._id === currentUserId}
            />
          ))}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};