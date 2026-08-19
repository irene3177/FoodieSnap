import React, { useState, useRef, useEffect } from 'react';
import * as socket from '../../services/socket';
import TextareaAutosize from 'react-textarea-autosize';
import { LuSend } from 'react-icons/lu';

const MAX_MESSAGE_LENGTH = 1000;
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
  disabled,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const typingTimeoutRef = useRef<number>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!disabled && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;

    if (value.length > MAX_MESSAGE_LENGTH) {
      value = value.slice(0, MAX_MESSAGE_LENGTH);
    }
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      return;
    }
    
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedMessage = newMessage.trim();
    if (!trimmedMessage || sending) return;

    // Stop typing indicator
    if (conversationId && userId) {
      socket.sendTyping(conversationId, userId, false);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }

    setSending(true);
    const success = await onSendMessage(trimmedMessage);
    if (success) {
      setNewMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.rows = 1;
      }
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
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
    <form onSubmit={handleSubmit} className="flex items-center justify-center pb-4 flex-shrink-0 min-h-[70px] sticky bottom-0 z-5 mt-auto">
      <div className="flex-1 relative p-4 border rounded-3xl shadow-theme bg-secondary max-w-[776px] z-30 focus:border-accent">
        <TextareaAutosize
          ref={textareaRef}
          value={newMessage}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          maxLength={MAX_MESSAGE_LENGTH}
          placeholder="Type a message... (Shift+Enter for new line)"
          minRows={1}
          maxRows={8}
          disabled={disabled || sending}
          className="
            bg-transparent focus:ring-0 rounded-none border-none p-0
            resize-none overflow-y-auto scrollbar-thin
            input
            min-h-[40px]
            max-h-[320px]
          "
        />
        <div className="flex items-center justify-end bg-secondary">
          <button
            type="submit"
            className="py-3 px-3 bg-accent text-white border-none rounded-full font-medium cursor-pointer transition-all duration-200 hover:bg-accent-hover hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            disabled={!newMessage.trim() || disabled || sending}
          >
            {sending ? (
              '...'
            ) : ( 
              <>
                <LuSend className="text-base" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};