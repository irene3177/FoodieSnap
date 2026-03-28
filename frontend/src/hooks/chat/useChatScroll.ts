import { useState, useEffect, useRef } from 'react';
import { Message } from '../../types';

export const useChatScroll = (messages: Message[]) => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const wasAtBottomRef = useRef(true);
  const isInitialLoadRef = useRef(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    wasAtBottomRef.current = true;
  };

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isAtBottom);
      wasAtBottomRef.current = isAtBottom;
    }
  };

  // Auto-scroll when new messages arrive (but NOT on initial load)
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
        return;
      }
      if (wasAtBottomRef.current) {
        setTimeout(() => {
          scrollToBottom();
        }, 100);
      }
    }
  }, [messages]);

  // Set initial scroll position to bottom without animation
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      // Immediately scroll to bottom without animation on initial load
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      wasAtBottomRef.current = true;
    }
  }, [messages]);

  return {
    showScrollButton,
    scrollToBottom,
    messagesContainerRef,
    messagesEndRef,
    handleScroll
  };
};