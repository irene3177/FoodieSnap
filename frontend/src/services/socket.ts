import { io, Socket } from 'socket.io-client';
import { Message } from '../types';
import { config } from '../config';

let socket: Socket | null = null;
let shouldAutoConnect = true;
export let isLoggedOut = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

export const setAutoConnect = (value: boolean) => {
  shouldAutoConnect = value;
};

export const setLoggedOut = (value: boolean) => {
  isLoggedOut = value;
};

export const connectSocket = (userId: string) => {
  if (isLoggedOut) {
    return null;
  }

  // Don't auto-connect if disabled
  if (!shouldAutoConnect) {
    return null;
  }

  if (socket?.connected) return socket;
  
  socket = io(config.baseUrl, {
    withCredentials: true,
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 2000
  });
  
  socket.on('connect', () => {
    console.log('🔌 Connected');
    reconnectAttempts = 0;
    if (userId) {
      socket?.emit('register', userId);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected, reason:', reason);
    
    // if (reason === 'transport close' || reason === 'transport error') {
    //   console.log('🔄 Server restart detected, will reconnect in 2 seconds...');
    //   setTimeout(() => {
    //     if (socket && !socket.connected) {
    //       socket.connect();
    //     }
    //   }, 2000);
    // } else if (reason === 'ping timeout') {
    //   console.log('🔄 Ping timeout, reconnecting immediately...');
    //   setTimeout(() => {
    //     if (socket && !socket.connected) {
    //       socket.connect();
    //     }
    //   }, 500);
    // }
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    reconnectAttempts++;
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log('Max reconnection attempts reached, will retry on next action');
    }
  });
  
  return socket;
};

export const getSocket = () => socket;

export const forceDisconnect = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    console.log('🔌 Socket forcefully disconnected');
  }
};

export const shouldReconnect = () => {
  return shouldAutoConnect && !isLoggedOut;
};

export const disconnectSocket = () => {
  forceDisconnect();
};

export const ensureConnection = (userId: string) => {
  if (!socket || !socket.connected) {
    connectSocket(userId);
  }
  return socket;
};

export const joinChat = (conversationId: string) => {
  socket?.emit('join-chat', conversationId);
};

export const leaveChat = (conversationId: string) => {
  socket?.emit('leave-chat', conversationId);
};

export const sendMessage = (conversationId: string, text: string, senderId: string) => {
  socket?.emit('message', { conversationId, text, senderId });
};

export const sendTyping = (conversationId: string, userId: string, isTyping: boolean) => {
  socket?.emit('typing', { conversationId, userId, isTyping });
};

// Listeners
export const onMessage = (callback: (message: Message) => void): () => void => {
  if (!socket) {
    return () => {};
  }
  socket.on('message', (message) => {
    callback(message);
  });
  return () => {
    socket?.off('message', callback);
  };
};

export const offMessage = (callback?: (message: Message) => void) => {
  if (callback) {
    socket?.off('message', callback);
  } else {
    socket?.off('message');
  }
};

export const onUserOnline = (callback: (data: { userId: string; online: boolean }) => void) => {
  if (!socket) return () => {};
  socket.on('user-online', callback);
  return () => socket?.off('user-online', callback);
};

export const offUserOnline = (callback?: (data: { userId: string; online: boolean }) => void) => {
  if (callback) {
    socket?.off('user-online', callback);
  } else {
    socket?.off('user-online');
  }
};

export const onTyping = (callback: (data: { userId: string; isTyping: boolean }) => void) => {
  socket?.on('typing', callback);
  return () => socket?.off('typing', callback);
};

export const offTyping = (callback?: (data: { userId: string; isTyping: boolean }) => void) => {
  if (callback) {
    socket?.off('typing', callback);
  } else {
    socket?.off('typing');
  }
};

export const checkOnlineStatus = (userId: string) => {
  if (!socket) return;
  socket.emit('check-online-status', userId);
};

export const onOnlineStatusResponse = (callback: (data: { userId: string; online: boolean }) => void) => {
  if (!socket) return () => {};
  socket.on('online-status-response', callback);
  return () => socket?.off('online-status-response', callback);
};

export const onOnlineUsers = (callback: (data: { users: string[] }) => void) => {
  if (!socket) return () => {};
  socket.on('online-users', callback);
  return () => socket?.off('online-users', callback);
};

export const markRead = (conversationId: string, userId: string) => {
  if (socket) {
    socket.emit('mark-read', { conversationId, userId });
  }
};

export const onMessagesRead = (callback: (data: { userId: string; conversationId: string }) => void) => {
  if (!socket) return () => {};

  socket.on('messages-read', (data) => {
    callback(data);
  });
  return () => socket?.off('messages-read', callback);
};

export const offMessagesRead = (callback?: (data: { userId: string; conversationId: string }) => void) => {
  if (callback) {
    socket?.off('messages-read', callback);
  } else {
    socket?.off('messages-read');
  }
};

export const isConnected = () => socket?.connected || false;
