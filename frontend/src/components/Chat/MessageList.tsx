import React from 'react';
import { Message } from '../../types';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  onScroll: () => void;
  currentUserId?: string;
  className?: string;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  messagesContainerRef,
  messagesEndRef,
  onScroll,
  currentUserId,
  className='',
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
      className={`flex-1 overflow-y-auto pt-4 pb-2 scrollbar-thin ${className}`}
      ref={messagesContainerRef}
      onScroll={onScroll}
    >
      <div className="max-w-[776px] mx-auto relative">
        {Object.entries(messageGroups).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date divider */}
            <div className="text-center my-4 relative">
              <span className="bg-secondary px-4 py-1 rounded-full text-xs text-secondary inline-block">{formatDate(dateMessages[0].createdAt)}</span>
            </div>
            {/* Messages */}
            {dateMessages.map((msg) => (
              <MessageBubble
                key={msg._id}
                message={msg}
                isOwnMessage={msg.senderId._id === currentUserId}
              />
            ))}
          </div>
        ))}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
};