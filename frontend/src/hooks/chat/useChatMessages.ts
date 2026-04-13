import { useState, useEffect, useRef } from 'react';
import * as socket from '../../services/socket';
import { messagesApi } from '../../services/messagesApi';
import { Message, User } from '../../types';

export const useChatMessages = (conversationId: string | undefined, currentUser: User | null) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const pendingMessagesRef = useRef<Map<string, string>>(new Map());
  const hasJoinedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (!conversationId) return;
      
    const unsubscribe = socket.onMessage((msg: Message) => {
      
      if (msg.conversationId !== conversationId) return;
      
      setMessages(prev => {
        // Replace temp message if exists
        const tempId = pendingMessagesRef.current.get(msg.text);
        if (tempId) {
          pendingMessagesRef.current.delete(msg.text);
          return prev.map(m => m._id === tempId ? msg : m);
        }
        
        // Avoid duplicates
        if (prev.some(m => m._id === msg._id)) return prev;
        
        return [...prev, msg];
      });
    });
    
    return () => unsubscribe();
  }, [conversationId]);

  // Load messages
  useEffect(() => {
    if (!conversationId) return;
    
    const load = async () => {
      try {
        const res = await messagesApi.getConversationById(conversationId);
        if (res.success && isMountedRef.current) {
          setMessages(res.data?.messages || []);
        } else if (isMountedRef.current) {
          setMessages([]);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        if (isMountedRef.current) {
          setMessages([]);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    };
    
    load();
    
    // Join chat room only if not already joined
    if (!hasJoinedRef.current) {
      socket.joinChat(conversationId);
      hasJoinedRef.current = true;
    }
    
    return () => {
      if (hasJoinedRef.current) {
        socket.leaveChat(conversationId);
        hasJoinedRef.current = false;
      }
    };
  }, [conversationId]);


  // Send message
  const sendMessage = async (text: string) => {
    if (!text.trim() || sending || !conversationId || !currentUser) return false;
    
    setSending(true);

    const tempId = `temp-${Date.now()}-${Math.random()}`;
    const messageText = text.trim();
    pendingMessagesRef.current.set(messageText, tempId);
    
    // Optimistic update
    const tempMsg: Message = {
      _id: tempId,
      conversationId,
      senderId: {
        _id: currentUser._id,
        username: currentUser.username,
        avatar: currentUser.avatar
      },
      text: messageText,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      read: false
    };
    setMessages(prev => [...prev, tempMsg]);
    
    socket.sendMessage(conversationId, messageText, currentUser._id);
    
    setTimeout(() => {
      if (pendingMessagesRef.current.has(messageText)) {
        pendingMessagesRef.current.delete(messageText);
      }
    }, 10000);

    setSending(false);
    return true;
  };

  useEffect(() => {
    isMountedRef.current = true;
    const pendingMessages = pendingMessagesRef.current;
    return () => {
      isMountedRef.current = false;
      pendingMessages.clear();
    };
  }, []);

  return { messages, loading, sending, sendMessage, setMessages };
};



