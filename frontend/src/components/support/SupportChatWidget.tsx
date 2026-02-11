'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useSocket } from '@/context/SocketContext';
import {
  Headphones,
  Send,
  X,
  Loader2,
  MessageSquare,
  Lock,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface SupportMsg {
  id: number;
  ticketId: number;
  senderRole: string;
  senderId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function SupportChatWidget() {
  const { token, user } = useAuth();
  const { t } = useTranslation();
  const { socket } = useSocket();
  const [isOpen, setIsOpen] = useState(false);
  const [ticketId, setTicketId] = useState<number | null>(null);
  const [messages, setMessages] = useState<SupportMsg[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [ticketStatus, setTicketStatus] = useState<'open' | 'assigned' | 'closed'>('open');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Get or create ticket when opening
  const openChat = useCallback(async () => {
    if (!token) return;
    setIsOpen(true);
    setIsLoading(true);
    setHasUnread(false);

    try {
      // Get or create ticket
      const ticketRes = await fetch(`${API_URL}/support/ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (ticketRes.ok) {
        const ticketData = await ticketRes.json();
        const ticket = ticketData.data?.ticket;
        if (ticket) {
          setTicketId(ticket.id);
          setTicketStatus(ticket.status || 'open');

          // Fetch messages
          const msgRes = await fetch(`${API_URL}/support/tickets/${ticket.id}/messages`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (msgRes.ok) {
            const msgData = await msgRes.json();
            setMessages(msgData.data?.messages || []);
            setTimeout(scrollToBottom, 100);
          }

          // Join socket room
          socket?.emit('join_support_ticket', { ticketId: ticket.id });
        }
      }
    } catch (err) {
      console.error('Failed to open support chat:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, socket, scrollToBottom]);

  const closeChat = useCallback(() => {
    if (ticketId) {
      socket?.emit('leave_support_ticket', { ticketId });
    }
    setIsOpen(false);
  }, [ticketId, socket]);

  // Listen for support messages
  useEffect(() => {
    if (!socket) return;

    const handleSupportMessage = (msg: SupportMsg) => {
      if (ticketId && msg.ticketId === ticketId) {
        setMessages(prev => [...prev, msg]);
        setTimeout(scrollToBottom, 100);
      }
    };

    const handleSupportNotification = (data: { ticketId: number; message: SupportMsg }) => {
      if (!isOpen) {
        setHasUnread(true);
      }
      // If chat is open and matches, the message handler above will catch it
    };

    const handleTicketClosed = (data: { ticketId: number }) => {
      if (ticketId && data.ticketId === ticketId) {
        setTicketStatus('closed');
      }
    };

    socket.on('support_message', handleSupportMessage);
    socket.on('support_message_notification', handleSupportNotification);
    socket.on('support_ticket_closed', handleTicketClosed);

    return () => {
      socket.off('support_message', handleSupportMessage);
      socket.off('support_message_notification', handleSupportNotification);
      socket.off('support_ticket_closed', handleTicketClosed);
    };
  }, [socket, ticketId, isOpen, scrollToBottom]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !ticketId || !token) return;
    setIsSending(true);
    try {
      const res = await fetch(`${API_URL}/support/tickets/${ticketId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (res.ok) {
        setNewMessage('');
        inputRef.current?.focus();
      }
    } catch (err) {
      console.error('Failed to send support message:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Don't show for admin/support roles
  if (user?.role === 'admin' || user?.role === 'support') return null;

  return (
    <>
      {/* Floating button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={openChat}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center cursor-pointer"
          >
            <Headphones className="w-6 h-6" />
            {hasUnread && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-amber-500 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5" />
                <div>
                  <p className="font-semibold text-sm">{t('supportChat.title')}</p>
                  <p className="text-xs text-amber-100">{t('supportChat.subtitle')}</p>
                </div>
              </div>
              <button
                onClick={closeChat}
                className="p-1 hover:bg-amber-600 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageSquare className="w-10 h-10 mb-2" />
                  <p className="text-sm text-center">{t('supportChat.welcomeMessage')}</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const isMe = msg.senderRole === user?.role && msg.senderId === user?.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] px-3 py-2 rounded-2xl overflow-hidden ${
                            isMe
                              ? 'bg-amber-500 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-900 rounded-bl-md'
                          }`}
                        >
                          {!isMe && (
                            <p className="text-xs font-medium text-amber-600 mb-0.5">{t('supportChat.agent')}</p>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-all">{msg.content}</p>
                          <p className={`text-xs mt-1 ${isMe ? 'text-amber-100' : 'text-gray-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            {ticketStatus === 'closed' ? (
              <div className="p-3 border-t border-gray-200 flex-shrink-0 text-center">
                <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  {t('supportChat.ticketClosed')}
                </p>
              </div>
            ) : (
              <div className="p-3 border-t border-gray-200 flex-shrink-0">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('supportChat.placeholder')}
                    rows={1}
                    className="flex-1 resize-none px-3 py-2 border border-gray-200 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none text-sm"
                    style={{ maxHeight: '80px' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || isSending}
                    className="p-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    {isSending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
