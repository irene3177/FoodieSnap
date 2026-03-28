import { useState, useEffect } from 'react';
import * as socket from '../../services/socket';
import { useAuth } from '../useAuth';

export const useUserStatus = (userId: string) => {
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!userId) return;

    console.log(`👤 Setting up status listeners for user: ${userId}`);
    console.log(`Current user ID: ${user?._id}`);

    socket.checkOnlineStatus(userId);

    // Listen for online status response
    const unsubscribeStatusResponse = socket.onOnlineStatusResponse((data) => {
      console.log(`📡 Online status response:`, data);
      if (data.userId === userId) {
        console.log(`✅ Setting initial isOnline to: ${data.online}`);
        setIsOnline(data.online);
      }
    });
    
    // Listen for online status
    const unsubscribeOnline = socket.onUserOnline((data) => {
      console.log(`🟢 Online status event received:`, data);
      console.log(`Comparing: data.userId (${data.userId}) === userId (${userId})? ${data.userId === userId}`);

      if (data.userId === userId) {
        console.log(`✅ Setting isOnline to: ${data.online}`);
        setIsOnline(data.online);
      }
    });
    
    // Listen for typing
    const unsubscribeTyping = socket.onTyping((data) => {
      console.log(`⌨️ Typing event received:`, data);
      if (data.userId === userId) {
        console.log(`✅ Setting isTyping to: ${data.isTyping}`);
        setIsTyping(data.isTyping);
        if (data.isTyping) {
          setTimeout(() => setIsTyping(false), 3000);
        }
      }
    });
    
    return () => {
      unsubscribeStatusResponse();
      console.log(`🧹 Cleaning up status listeners for user: ${userId}`);
      unsubscribeOnline();
      unsubscribeTyping();
    };
  }, [userId, user]);

  return { isOnline, isTyping };
};





/*
import { useState, useEffect } from 'react';
import * as socket from '../../services/socket';

export const useUserStatus = (userId: string) => {
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Check current online status
    setIsOnline(socket.isUserOnline(userId));
    
    // Listen for status updates
    const unsubscribeStatus = socket.onUserStatus((data) => {
      if (data.userId === userId) {
        setIsOnline(data.isOnline);
      }
    });
    
    // Listen for typing updates
    const unsubscribeTyping = socket.onUserTyping((data) => {
      if (data.userId === userId && data.conversationId) {
        setIsTyping(data.isTyping);
        // Auto-hide typing after 3 seconds if no update
        if (data.isTyping) {
          setTimeout(() => {
            if (socket.isUserTyping(userId) === false) {
              setIsTyping(false);
            }
          }, 3000);
        }
      }
    });
    
    return () => {
      unsubscribeStatus();
      unsubscribeTyping();
    };
  }, [userId]);

  return { isOnline, isTyping };
};

*/