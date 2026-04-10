import React, { useState, useRef, useEffect } from 'react';
import * as socket from '../../services/socket';

interface MessageInputProps {
  conversationId: string;
  userId: string;
  onSendMessage: (text: string) => Promise<boolean>;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  userId,
  onSendMessage,
  disabled
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const typingTimeoutRef = useRef<number>();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewMessage(value);
    
    // Send typing indicator
    if (conversationId && userId) {
      socket.sendTyping(conversationId, userId, true);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        socket.sendTyping(conversationId, userId, false);
      }, 1000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    // Stop typing indicator
    if (conversationId && userId) {
      socket.sendTyping(conversationId, userId, false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    setSending(true);
    const success = await onSendMessage(newMessage);
    if (success) {
      setNewMessage('');
    }
    setSending(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Notify that typing stopped
      if (conversationId && userId) {
        socket.sendTyping(conversationId, userId, false);
      }
    };
  }, [conversationId, userId]);

  return (
    <form onSubmit={handleSubmit} className="chat-detail__input-area">
      <input
        type="text"
        value={newMessage}
        onChange={handleChange}
        placeholder="Type a message..."
        className="chat-detail__input"
        disabled={disabled || sending}
      />
      <button
        type="submit"
        className="chat-detail__send"
        disabled={!newMessage.trim() || disabled || sending}
      >
        {sending ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
};