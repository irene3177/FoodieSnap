import { useState, useEffect, useRef } from 'react';
import { Message } from '../../types';

export const useChatScroll = (messages: Message[]) => {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const wasAtBottomRef = useRef(true);
  // const isInitialLoadRef = useRef(true);
  const prevMessagesLengthRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
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

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length === 0) return;

    const isNewMessage = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;


    // Scroll only if:
    // 1. It's a new message AND user was at bottom, OR
    // 2. It's the first time loading messages (prevLength was 0)
    const shouldScroll = (isNewMessage && wasAtBottomRef.current)
      || prevMessagesLengthRef.current === messages.length;
    
    if (shouldScroll) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
    // if (messages.length > 0 && messagesContainerRef.current) {
    //   if (isInitialLoadRef.current) {
    //     isInitialLoadRef.current = false;
    //     return;
    //   }
    //   if (wasAtBottomRef.current) {
    //     setTimeout(() => {
    //       scrollToBottom();
    //     }, 100);
    //   }
    // }
  }, [messages]);

  // Set initial scroll position to bottom without animation
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      setTimeout(() => {
        scrollToBottom();
      }, 150);
    }
    // if (messages.length > 0 && messagesContainerRef.current) {
    //   // Immediately scroll to bottom without animation on initial load
    //   messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    //   wasAtBottomRef.current = true;
    // }
  }, [messages.length]);

  return {
    showScrollButton,
    scrollToBottom,
    messagesContainerRef,
    messagesEndRef,
    handleScroll
  };
};