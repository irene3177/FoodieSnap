import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { incrementUnread, resetUnread, updateLastMessage } from '../../store/unreadSlice';
import * as socket from '../../services/socket';
import { Message } from '../../types';

export const useUnreadListener = (userId: string | undefined | null) => {
  const dispatch = useDispatch();
  const isRegistered = useRef(false);
  const processedMessageIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    if (isRegistered.current) return;
    
    isRegistered.current = true;

    const currentProcessedIds = processedMessageIds.current;

    const handleNewMessage = (message: Message) => {
      
      if (currentProcessedIds.has(message._id)) return;

      currentProcessedIds.add(message._id);

      if (currentProcessedIds.size > 100) {
        currentProcessedIds.clear();
      }
      
      if (message.senderId?._id === userId) return;
      
      const isCurrentChat = window.location.pathname === `/chat/${message.conversationId}`;
      
      if (!isCurrentChat) {
        dispatch(incrementUnread(message.conversationId));
        dispatch(updateLastMessage({
          conversationId: message.conversationId,
          text: message.text,
          createdAt: message.createdAt,
          senderId: message.senderId._id
        }));
      } else {
        socket.markRead(message.conversationId, userId);
      }
    };

    const handleMessagesRead = (data: { userId: string; conversationId: string }) => {
      if (data.userId === userId) {
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