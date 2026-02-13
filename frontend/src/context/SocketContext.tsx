'use client';

import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';

interface MessageData {
  id: number;
  conversationId: number;
  senderRole: 'care_giver' | 'care_recipient';
  senderId: number;
  content: string;
  messageType: 'text' | 'settlement_request' | 'settlement_confirmed' | 'settlement_dismissed';
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NotificationData {
  conversationId: number;
  message: MessageData;
  senderName: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  unreadCount: number;
  sendMessage: (conversationId: number, content: string, messageType?: string) => Promise<MessageData | null>;
  sendSettlementRequest: (conversationId: number) => Promise<MessageData | null>;
  respondSettlement: (conversationId: number, messageId: number, accepted: boolean) => Promise<MessageData | null>;
  joinConversation: (conversationId: number) => void;
  leaveConversation: (conversationId: number) => void;
  startTyping: (conversationId: number) => void;
  stopTyping: (conversationId: number) => void;
  markAsRead: (conversationId: number) => void;
  onNewMessage: (callback: (message: MessageData) => void) => () => void;
  onNewNotification: (callback: (data: NotificationData) => void) => () => void;
  onTyping: (callback: (data: { conversationId: number; userKey: string }) => void) => () => void;
  onStopTyping: (callback: (data: { conversationId: number; userKey: string }) => void) => () => void;
  onMessagesRead: (callback: (data: { conversationId: number }) => void) => () => void;
  onSettlementCompleted: (callback: (data: { conversationId: number; careRecipientId: number; careGiverId: number }) => void) => () => void;
  refreshUnreadCount: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: ReactNode }) {
  const { token, user, isAuthenticated, handleUnauthorized } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers] = useState<Set<string>>(new Set());

  // Track if notification permission has been requested
  const notifPermissionRef = useRef(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${SOCKET_URL}/api/messages/unread-count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [token]);

  // Request notification permission
  useEffect(() => {
    if (isAuthenticated && !notifPermissionRef.current && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
      notifPermissionRef.current = true;
    }
  }, [isAuthenticated]);

  // Connect socket when authenticated
  useEffect(() => {
    if (!isAuthenticated || !token || !user) {
      // Disconnect if not authenticated
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
      return;
    }

    // Only create new connection if one doesn't exist
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected');
      setIsConnected(true);
      fetchUnreadCount();
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      if (err.message === 'Invalid token' || err.message === 'Token expired' || err.message === 'Authentication required') {
        handleUnauthorized();
      }
    });

    // Listen for incoming notifications (when not in conversation view)
    socket.on('new_message_notification', (data: NotificationData) => {
      setUnreadCount(prev => prev + 1);

      // Show browser notification if permitted and page is not focused
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        if (document.hidden) {
          new Notification('MyHelper - New Message', {
            body: data.message.content.length > 100
              ? data.message.content.slice(0, 100) + '...'
              : data.message.content,
            icon: '/favicon.ico',
            tag: `conversation-${data.conversationId}`,
          });
        }
      }
    });

    // When messages are read (for sender's view)
    socket.on('messages_read', () => {
      // This will be handled by specific listeners set up in chat components
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [isAuthenticated, token, user, fetchUnreadCount]);

  const sendMessage = useCallback(async (conversationId: number, content: string, messageType: string = 'text'): Promise<MessageData | null> => {
    return new Promise((resolve) => {
      if (!socketRef.current?.connected) {
        resolve(null);
        return;
      }
      socketRef.current.emit('send_message', { conversationId, content, messageType }, (response: { success?: boolean; message?: MessageData; error?: string }) => {
        if (response?.success && response.message) {
          resolve(response.message);
        } else {
          console.error('Failed to send message:', response?.error);
          resolve(null);
        }
      });
    });
  }, []);

  const sendSettlementRequest = useCallback(async (conversationId: number): Promise<MessageData | null> => {
    return sendMessage(conversationId, 'Settlement Request', 'settlement_request');
  }, [sendMessage]);

  const respondSettlement = useCallback(async (conversationId: number, messageId: number, accepted: boolean): Promise<MessageData | null> => {
    return new Promise((resolve) => {
      if (!socketRef.current?.connected) {
        resolve(null);
        return;
      }
      socketRef.current.emit('respond_settlement', { conversationId, messageId, accepted }, (response: { success?: boolean; message?: MessageData; error?: string }) => {
        if (response?.success && response.message) {
          resolve(response.message);
        } else {
          console.error('Failed to respond to settlement:', response?.error);
          resolve(null);
        }
      });
    });
  }, []);

  const joinConversation = useCallback((conversationId: number) => {
    socketRef.current?.emit('join_conversation', { conversationId });
  }, []);

  const leaveConversation = useCallback((conversationId: number) => {
    socketRef.current?.emit('leave_conversation', { conversationId });
  }, []);

  const startTyping = useCallback((conversationId: number) => {
    socketRef.current?.emit('typing_start', { conversationId });
  }, []);

  const stopTyping = useCallback((conversationId: number) => {
    socketRef.current?.emit('typing_stop', { conversationId });
  }, []);

  const markAsRead = useCallback((conversationId: number) => {
    socketRef.current?.emit('mark_read', { conversationId });
    // Refresh unread count
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const onNewMessage = useCallback((callback: (message: MessageData) => void) => {
    const handler = (message: MessageData) => callback(message);
    socketRef.current?.on('new_message', handler);
    return () => {
      socketRef.current?.off('new_message', handler);
    };
  }, []);

  const onNewNotification = useCallback((callback: (data: NotificationData) => void) => {
    const handler = (data: NotificationData) => callback(data);
    socketRef.current?.on('new_message_notification', handler);
    return () => {
      socketRef.current?.off('new_message_notification', handler);
    };
  }, []);

  const onTyping = useCallback((callback: (data: { conversationId: number; userKey: string }) => void) => {
    const handler = (data: { conversationId: number; userKey: string }) => callback(data);
    socketRef.current?.on('user_typing', handler);
    return () => {
      socketRef.current?.off('user_typing', handler);
    };
  }, []);

  const onStopTyping = useCallback((callback: (data: { conversationId: number; userKey: string }) => void) => {
    const handler = (data: { conversationId: number; userKey: string }) => callback(data);
    socketRef.current?.on('user_stopped_typing', handler);
    return () => {
      socketRef.current?.off('user_stopped_typing', handler);
    };
  }, []);

  const onMessagesRead = useCallback((callback: (data: { conversationId: number }) => void) => {
    const handler = (data: { conversationId: number }) => callback(data);
    socketRef.current?.on('messages_read', handler);
    return () => {
      socketRef.current?.off('messages_read', handler);
    };
  }, []);

  const onSettlementCompleted = useCallback((callback: (data: { conversationId: number; careRecipientId: number; careGiverId: number }) => void) => {
    const handler = (data: { conversationId: number; careRecipientId: number; careGiverId: number }) => callback(data);
    socketRef.current?.on('settlement_completed', handler);
    return () => {
      socketRef.current?.off('settlement_completed', handler);
    };
  }, []);

  const refreshUnreadCount = useCallback(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      isConnected,
      onlineUsers,
      unreadCount,
      sendMessage,
      sendSettlementRequest,
      respondSettlement,
      joinConversation,
      leaveConversation,
      startTyping,
      stopTyping,
      markAsRead,
      onNewMessage,
      onNewNotification,
      onTyping,
      onStopTyping,
      onMessagesRead,
      onSettlementCompleted,
      refreshUnreadCount,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

const defaultSocketContext: SocketContextType = {
  socket: null,
  isConnected: false,
  onlineUsers: new Set(),
  unreadCount: 0,
  sendMessage: async () => null,
  sendSettlementRequest: async () => null,
  respondSettlement: async () => null,
  joinConversation: () => {},
  leaveConversation: () => {},
  startTyping: () => {},
  stopTyping: () => {},
  markAsRead: () => {},
  onNewMessage: () => () => {},
  onNewNotification: () => () => {},
  onTyping: () => () => {},
  onStopTyping: () => () => {},
  onMessagesRead: () => () => {},
  onSettlementCompleted: () => () => {},
  refreshUnreadCount: () => {},
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  return context ?? defaultSocketContext;
};
