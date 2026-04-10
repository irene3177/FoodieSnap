import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { io, Socket } from 'socket.io-client';
import * as socketService from '../../../services/socket';
import { config } from '../../../config';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(),
}));

describe('socket service', () => {
  let mockSocket: Partial<Socket>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    
    // Reset module state
    socketService.forceDisconnect();
    socketService.setAutoConnect(true);
    socketService.setLoggedOut(false);
    
    mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
      connect: vi.fn(),
      removeAllListeners: vi.fn(),
      connected: true,
    };
    
    const mockedIo = vi.mocked(io);
    mockedIo.mockReturnValue(mockSocket as Socket);
  });

  afterEach(() => {
    socketService.forceDisconnect();
  });

  describe('connectSocket', () => {
    it('should create socket connection', () => {
      const result = socketService.connectSocket('user123');
      
      expect(io).toHaveBeenCalledWith(config.baseUrl, {
        withCredentials: true,
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 2000,
      });
      expect(result).toBe(mockSocket);
    });

    it('should not connect if logged out', () => {
      socketService.setLoggedOut(true);
      const result = socketService.connectSocket('user123');
      
      expect(result).toBeNull();
      expect(io).not.toHaveBeenCalled();
    });

    it('should not connect if auto connect is disabled', () => {
      socketService.setAutoConnect(false);
      const result = socketService.connectSocket('user123');
      
      expect(result).toBeNull();
      expect(io).not.toHaveBeenCalled();
    });

    it('should return existing socket if already connected', () => {
      socketService.connectSocket('user123');
      const result = socketService.connectSocket('user123');
      
      expect(io).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockSocket);
    });
  });

  describe('getSocket', () => {
    it('should return current socket', () => {
      socketService.connectSocket('user123');
      const result = socketService.getSocket();
      
      expect(result).toBe(mockSocket);
    });

    it('should return null if socket not connected', () => {
      const result = socketService.getSocket();
      
      expect(result).toBeNull();
    });
  });

  describe('forceDisconnect', () => {
    it('should disconnect socket', () => {
      socketService.connectSocket('user123');
      socketService.forceDisconnect();
      
      expect(mockSocket.removeAllListeners).toHaveBeenCalled();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('ensureConnection', () => {
    it('should create connection if socket not exists', () => {
      const result = socketService.ensureConnection('user123');
      
      expect(io).toHaveBeenCalled();
      expect(result).toBe(mockSocket);
    });

    it('should return existing socket if connected', () => {
      socketService.connectSocket('user123');
      const result = socketService.ensureConnection('user123');
      
      expect(result).toBe(mockSocket);
    });
  });

  describe('joinChat', () => {
    it('should emit join-chat event', () => {
      socketService.connectSocket('user123');
      socketService.joinChat('conv123');
      
      expect(mockSocket.emit).toHaveBeenCalledWith('join-chat', 'conv123');
    });
  });

  describe('leaveChat', () => {
    it('should emit leave-chat event', () => {
      socketService.connectSocket('user123');
      socketService.leaveChat('conv123');
      
      expect(mockSocket.emit).toHaveBeenCalledWith('leave-chat', 'conv123');
    });
  });

  describe('sendMessage', () => {
    it('should emit message event', () => {
      socketService.connectSocket('user123');
      socketService.sendMessage('conv123', 'Hello', 'user123');
      
      expect(mockSocket.emit).toHaveBeenCalledWith('message', {
        conversationId: 'conv123',
        text: 'Hello',
        senderId: 'user123',
      });
    });
  });

  describe('sendTyping', () => {
    it('should emit typing event', () => {
      socketService.connectSocket('user123');
      socketService.sendTyping('conv123', 'user123', true);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('typing', {
        conversationId: 'conv123',
        userId: 'user123',
        isTyping: true,
      });
    });
  });

  describe('onMessage', () => {
    it('should register message listener', () => {
      socketService.connectSocket('user123');
      const callback = vi.fn();
      const unsubscribe = socketService.onMessage(callback);
      
      expect(mockSocket.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(typeof unsubscribe).toBe('function');
    });

    it('should return empty function if socket not connected', () => {
      const callback = vi.fn();
      const unsubscribe = socketService.onMessage(callback);
      
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('onUserOnline', () => {
    it('should register user-online listener', () => {
      socketService.connectSocket('user123');
      const callback = vi.fn();
      const unsubscribe = socketService.onUserOnline(callback);
      
      expect(mockSocket.on).toHaveBeenCalledWith('user-online', callback);
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('onTyping', () => {
    it('should register typing listener', () => {
      socketService.connectSocket('user123');
      const callback = vi.fn();
      const unsubscribe = socketService.onTyping(callback);
      
      expect(mockSocket.on).toHaveBeenCalledWith('typing', callback);
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('checkOnlineStatus', () => {
    it('should emit check-online-status event', () => {
      socketService.connectSocket('user123');
      socketService.checkOnlineStatus('user456');
      
      expect(mockSocket.emit).toHaveBeenCalledWith('check-online-status', 'user456');
    });
  });

  describe('onOnlineStatusResponse', () => {
    it('should register online-status-response listener', () => {
      socketService.connectSocket('user123');
      const callback = vi.fn();
      const unsubscribe = socketService.onOnlineStatusResponse(callback);
      
      expect(mockSocket.on).toHaveBeenCalledWith('online-status-response', callback);
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('markRead', () => {
    it('should emit mark-read event', () => {
      socketService.connectSocket('user123');
      socketService.markRead('conv123', 'user123');
      
      expect(mockSocket.emit).toHaveBeenCalledWith('mark-read', {
        conversationId: 'conv123',
        userId: 'user123',
      });
    });
  });

  describe('onMessagesRead', () => {
    it('should register messages-read listener', () => {
      socketService.connectSocket('user123');
      const callback = vi.fn();
      const unsubscribe = socketService.onMessagesRead(callback);
      
      expect(mockSocket.on).toHaveBeenCalledWith('messages-read', expect.any(Function));
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('isConnected', () => {
    it('should return true if socket connected', () => {
      socketService.connectSocket('user123');
      const result = socketService.isConnected();
      
      expect(result).toBe(true);
    });

    it('should return false if socket not connected', () => {
      const result = socketService.isConnected();
      
      expect(result).toBe(false);
    });
  });

  describe('shouldReconnect', () => {
    it('should return true when auto connect enabled and not logged out', () => {
      const result = socketService.shouldReconnect();
      
      expect(result).toBe(true);
    });

    it('should return false when auto connect disabled', () => {
      socketService.setAutoConnect(false);
      const result = socketService.shouldReconnect();
      
      expect(result).toBe(false);
    });

    it('should return false when logged out', () => {
      socketService.setLoggedOut(true);
      const result = socketService.shouldReconnect();
      
      expect(result).toBe(false);
    });
  });
});