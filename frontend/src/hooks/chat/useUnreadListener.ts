import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { incrementUnread, resetUnread } from '../../store/unreadSlice';
import * as socket from '../../services/socket';
import { Message } from '../../types';

export const useUnreadListener = (userId: string | undefined) => {
  const dispatch = useDispatch();
  const isRegistered = useRef(false);
  const processedMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    if (isRegistered.current) return;
    
    console.log('✅ useUnreadListener: Active for user', userId);
    isRegistered.current = true;

    const currentProcessedIds = processedMessageIds.current;

    const handleNewMessage = (message: Message) => {
      console.log('🔔 MESSAGE RECEIVED IN LISTENER:', message._id);
      if (currentProcessedIds.has(message._id)) {
        console.log('🔔 Duplicate message skipped:', message._id);
        return;
      }

      currentProcessedIds.add(message._id);

      if (currentProcessedIds.size > 100) {
        currentProcessedIds.clear();
      }

      console.log('🔔 useUnreadListener: New message', {
        messageId: message._id,
        conversationId: message.conversationId,
        senderId: message.senderId?._id,
        currentUserId: userId,
        isOwnMessage: message.senderId?._id === userId
      });
      
      if (message.senderId?._id === userId) return;
      
      const isCurrentChat = window.location.pathname === `/chat/${message.conversationId}`;
      
      if (!isCurrentChat) {
        console.log('🔔 INCREMENTING unread for:', message.conversationId);
        dispatch(incrementUnread(message.conversationId));
      } else {
        console.log('📖 Marking as read');
        socket.markRead(message.conversationId, userId);
      }
    };

    const handleMessagesRead = (data: { userId: string; conversationId: string }) => {
      console.log('📖 useUnreadListener: Messages read event', data);
      if (data.userId === userId) {
        console.log('📖 Resetting unread for:', data.conversationId);
        dispatch(resetUnread(data.conversationId));
      }
    };

    const unsubscribeMessage = socket.onMessage(handleNewMessage);
    const unsubscribeRead = socket.onMessagesRead(handleMessagesRead);

    return () => {
      unsubscribeMessage();
      unsubscribeRead();
      isRegistered.current = false;
      currentProcessedIds.clear();
    };
  }, [userId, dispatch]);
};