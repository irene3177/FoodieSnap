import { useState, useEffect } from 'react';
import * as socket from '../../services/socket';
import { useAuth } from '../useAuth';

export const useUserStatus = (userId: string) => {
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!userId) return;

    socket.checkOnlineStatus(userId);

    // Listen for online status response
    const unsubscribeStatusResponse = socket.onOnlineStatusResponse((data) => {
      if (data.userId === userId) {
        setIsOnline(data.online);
      }
    });
    
    // Listen for online status
    const unsubscribeOnline = socket.onUserOnline((data) => {

      if (data.userId === userId) {
        setIsOnline(data.online);
      }
    });
    
    // Listen for typing
    const unsubscribeTyping = socket.onTyping((data) => {
      if (data.userId === userId) {
        setIsTyping(data.isTyping);
        if (data.isTyping) {
          setTimeout(() => setIsTyping(false), 3000);
        }
      }
    });
    
    return () => {
      unsubscribeStatusResponse();
      unsubscribeOnline();
      unsubscribeTyping();
    };
  }, [userId, user]);

  return { isOnline, isTyping };
};
