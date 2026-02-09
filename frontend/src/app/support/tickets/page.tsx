'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useSocket } from '@/context/SocketContext';
import SupportLayout from '@/components/support/SupportLayout';
import {
  MessageSquare,
  Send,
  Search,
  X,
  Clock,
  User,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface TicketUser {
  id: number;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  email: string;
}

interface SupportMsg {
  id: number;
  ticketId: number;
  senderRole: string;
  senderId: number;
  senderName: string | null;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface Ticket {
  id: number;
  userRole: string;
  userId: number;
  status: 'open' | 'assigned' | 'closed';
  assignedToRole: string | null;
  assignedToId: number | null;
  subject: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  user: TicketUser | null;
  lastMessage: SupportMsg | null;
  unreadCount: number;
}

export default function SupportTicketsPage() {
  const { user, token } = useAuth();
  const { t } = useTranslation();
  const { socket } = useSocket();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<SupportMsg[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.data?.tickets || []);
      }
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setIsLoadingTickets(false);
    }
  }, [token]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Fetch messages for selected ticket
  const fetchMessages = useCallback(async (ticketId: number) => {
    if (!token) return;
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`${API_URL}/support/tickets/${ticketId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data?.messages || []);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [token, scrollToBottom]);

  // Select a ticket
  const handleSelectTicket = useCallback((ticket: Ticket) => {
    // Leave previous ticket room
    if (selectedTicket) {
      socket?.emit('leave_support_ticket', { ticketId: selectedTicket.id });
    }
    setSelectedTicket(ticket);
    fetchMessages(ticket.id);
    // Join new ticket room
    socket?.emit('join_support_ticket', { ticketId: ticket.id });
    // Clear unread
    setTickets(prev =>
      prev.map(t => t.id === ticket.id ? { ...t, unreadCount: 0 } : t)
    );
  }, [selectedTicket, socket, fetchMessages]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleSupportMessage = (msg: SupportMsg) => {
      if (selectedTicket && msg.ticketId === selectedTicket.id) {
        setMessages(prev => [...prev, msg]);
        setTimeout(scrollToBottom, 100);
      }
    };

    const handleTicketUpdate = (data: { ticketId: number; message: SupportMsg; ticket: Ticket }) => {
      // Update ticket in list
      setTickets(prev => {
        const exists = prev.find(t => t.id === data.ticketId);
        if (exists) {
          return prev.map(t =>
            t.id === data.ticketId
              ? {
                  ...t,
                  lastMessage: data.message,
                  lastMessageAt: data.message.createdAt,
                  status: data.ticket.status,
                  unreadCount: selectedTicket?.id === data.ticketId ? 0 : t.unreadCount + 1,
                }
              : t
          ).sort((a, b) => {
            const aTime = a.lastMessageAt || a.createdAt;
            const bTime = b.lastMessageAt || b.createdAt;
            return new Date(bTime).getTime() - new Date(aTime).getTime();
          });
        } else {
          // New ticket — refetch
          fetchTickets();
          return prev;
        }
      });
    };

    const handleTicketClaimed = (data: { ticketId: number; assignedToId: number; assignedToRole: string }) => {
      // If assigned to someone else, and we're support, remove from list
      if (user?.role === 'support' && data.assignedToId !== user.id) {
        setTickets(prev => prev.filter(t => t.id !== data.ticketId));
        if (selectedTicket?.id === data.ticketId) {
          setSelectedTicket(null);
          setMessages([]);
        }
      } else {
        setTickets(prev =>
          prev.map(t =>
            t.id === data.ticketId
              ? { ...t, status: 'assigned' as const, assignedToId: data.assignedToId, assignedToRole: data.assignedToRole }
              : t
          )
        );
      }
    };

    const handleTicketAssigned = (data: { ticketId: number; ticket: Ticket; assignedTo?: { id: number; firstName: string; lastName: string } }) => {
      const isAssignedToMe = data.ticket.assignedToId === user?.id;
      const isUnassigned = !data.ticket.assignedToId;

      if (isAssignedToMe) {
        // Assigned to me — update in list and show toast
        setTickets(prev => {
          const exists = prev.find(tk => tk.id === data.ticketId);
          if (exists) {
            return prev.map(tk =>
              tk.id === data.ticketId
                ? { ...tk, status: data.ticket.status, assignedToId: data.ticket.assignedToId, assignedToRole: data.ticket.assignedToRole }
                : tk
            );
          }
          // Ticket not in list yet — refetch
          fetchTickets();
          return prev;
        });
        toast.success(t('support.tickets.toastAssignedToYou'));
      } else if (isUnassigned) {
        // Ticket was unassigned — it becomes open, should appear in list
        setTickets(prev => {
          const exists = prev.find(tk => tk.id === data.ticketId);
          if (exists) {
            return prev.map(tk =>
              tk.id === data.ticketId
                ? { ...tk, status: 'open' as const, assignedToId: null, assignedToRole: null }
                : tk
            );
          }
          fetchTickets();
          return prev;
        });
        toast.info(t('support.tickets.toastTicketReopened'));
      } else {
        // Assigned to someone else — remove from my list if it was open
        setTickets(prev => prev.filter(tk => {
          if (tk.id !== data.ticketId) return true;
          // Keep only if it was already assigned to me
          return tk.assignedToId === user?.id;
        }));
        if (selectedTicket?.id === data.ticketId) {
          setSelectedTicket(null);
          setMessages([]);
          toast.info(t('support.tickets.toastAssignedToOther'));
        }
      }
    };

    const handleNewTicket = (data: { ticket: Ticket }) => {
      setTickets(prev => {
        // Don't add if already in list
        if (prev.find(tk => tk.id === data.ticket.id)) return prev;
        return [data.ticket, ...prev];
      });
      toast.info(t('support.tickets.toastNewTicket'));
    };

    const handleTicketClosed = (data: { ticketId: number }) => {
      setTickets(prev =>
        prev.map(tk =>
          tk.id === data.ticketId ? { ...tk, status: 'closed' as const } : tk
        )
      );
      if (selectedTicket?.id === data.ticketId) {
        setSelectedTicket(prev => prev ? { ...prev, status: 'closed' } : null);
      }
    };

    socket.on('support_message', handleSupportMessage);
    socket.on('support_ticket_update', handleTicketUpdate);
    socket.on('support_ticket_claimed', handleTicketClaimed);
    socket.on('support_ticket_assigned', handleTicketAssigned);
    socket.on('support_ticket_closed', handleTicketClosed);
    socket.on('support_ticket_new', handleNewTicket);

    return () => {
      socket.off('support_message', handleSupportMessage);
      socket.off('support_ticket_update', handleTicketUpdate);
      socket.off('support_ticket_claimed', handleTicketClaimed);
      socket.off('support_ticket_assigned', handleTicketAssigned);
      socket.off('support_ticket_closed', handleTicketClosed);
      socket.off('support_ticket_new', handleNewTicket);
    };
  }, [socket, selectedTicket, user, fetchTickets, scrollToBottom, t]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (selectedTicket) {
        socket?.emit('leave_support_ticket', { ticketId: selectedTicket.id });
      }
    };
  }, [selectedTicket, socket]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedTicket || !token) return;
    setIsSending(true);
    try {
      const res = await fetch(`${API_URL}/support/tickets/${selectedTicket.id}/messages`, {
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
        // Message will come back via socket
      }
    } catch (err) {
      console.error('Failed to send message:', err);
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

  // Close ticket
  const handleCloseTicket = async () => {
    if (!selectedTicket || !token) return;
    try {
      const res = await fetch(`${API_URL}/support/tickets/${selectedTicket.id}/close`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTickets(prev =>
          prev.map(t => t.id === selectedTicket.id ? { ...t, status: 'closed' as const } : t)
        );
        setSelectedTicket(prev => prev ? { ...prev, status: 'closed' } : null);
      }
    } catch (err) {
      console.error('Failed to close ticket:', err);
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(ticket => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = ticket.user ? `${ticket.user.firstName} ${ticket.user.lastName}`.toLowerCase() : '';
    const email = ticket.user?.email?.toLowerCase() || '';
    return name.includes(q) || email.includes(q);
  });

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('support.tickets.justNow');
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-700">{t('support.tickets.statusOpen')}</span>;
      case 'assigned':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">{t('support.tickets.statusAssigned')}</span>;
      case 'closed':
        return <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">{t('support.tickets.statusClosed')}</span>;
      default:
        return null;
    }
  };

  return (
    <SupportLayout>
      <div className="h-[calc(100vh-8rem)] flex bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Ticket list sidebar */}
        <div className={`w-full sm:w-80 lg:w-96 border-r border-gray-200 flex flex-col ${selectedTicket ? 'hidden sm:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('support.tickets.title')}</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('support.tickets.searchPlaceholder')}
                className="w-full pl-10 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Ticket list */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingTickets ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                <MessageSquare className="w-8 h-8 mb-2" />
                <p className="text-sm">{t('support.tickets.noTickets')}</p>
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => handleSelectTicket(ticket)}
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                    selectedTicket?.id === ticket.id ? 'bg-amber-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {ticket.user?.profileImageUrl ? (
                      <img
                        src={ticket.user.profileImageUrl}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-medium text-sm text-gray-900 truncate">
                            {ticket.user ? `${ticket.user.firstName} ${ticket.user.lastName}` : `User #${ticket.userId}`}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400 flex-shrink-0">#{ticket.id}</span>
                        </div>
                        <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
                          {ticket.lastMessageAt ? formatTime(ticket.lastMessageAt) : formatTime(ticket.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 truncate pr-2">
                          {ticket.lastMessage?.content || t('support.tickets.noMessages')}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {getStatusBadge(ticket.status)}
                          {ticket.unreadCount > 0 && (
                            <span className="bg-amber-500 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
                              {ticket.unreadCount > 9 ? '9+' : ticket.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">
                        {ticket.userRole === 'care_giver' ? t('support.tickets.caregiver') : t('support.tickets.carerecipient')}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col ${!selectedTicket ? 'hidden sm:flex' : 'flex'}`}>
          {selectedTicket ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      socket?.emit('leave_support_ticket', { ticketId: selectedTicket.id });
                      setSelectedTicket(null);
                    }}
                    className="sm:hidden p-1 text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                  {selectedTicket.user?.profileImageUrl ? (
                    <img
                      src={selectedTicket.user.profileImageUrl}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {selectedTicket.user ? `${selectedTicket.user.firstName} ${selectedTicket.user.lastName}` : `User #${selectedTicket.userId}`}
                      </p>
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium bg-gray-100 text-gray-500 rounded">
                        #{selectedTicket.id}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {selectedTicket.user?.email} · {selectedTicket.userRole === 'care_giver' ? t('support.tickets.caregiver') : t('support.tickets.carerecipient')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedTicket.status)}
                  {selectedTicket.status !== 'closed' && (
                    <button
                      onClick={handleCloseTicket}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg transition-colors cursor-pointer"
                    >
                      <CheckCircle size={14} className="inline mr-1" />
                      {t('support.tickets.close')}
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                    <MessageSquare className="w-8 h-8 mb-2" />
                    <p className="text-sm">{t('support.tickets.noMessages')}</p>
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      const isAgent = msg.senderRole === 'admin' || msg.senderRole === 'support';
                      const roleLabel = msg.senderRole === 'admin' ? t('support.tickets.adminRole') : t('support.tickets.supportAgent');
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isAgent ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                              isAgent
                                ? 'bg-amber-500 text-white rounded-br-md'
                                : 'bg-gray-100 text-gray-900 rounded-bl-md'
                            }`}
                          >
                            {isAgent && (
                              <p className="text-xs text-amber-100 mb-0.5 font-medium">
                                {msg.senderName || roleLabel} <span className="font-normal opacity-75">· {roleLabel}</span>
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isAgent ? 'text-amber-100' : 'text-gray-400'}`}>
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
              {selectedTicket.status !== 'closed' ? (
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-end gap-2">
                    <textarea
                      ref={inputRef}
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={t('support.tickets.typePlaceholder')}
                      rows={1}
                      className="flex-1 resize-none px-4 py-2.5 border border-gray-200 rounded-xl focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none text-sm"
                      style={{ maxHeight: '120px' }}
                    />
                    <button
                      onClick={handleSend}
                      disabled={!newMessage.trim() || isSending}
                      className="p-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {isSending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-500">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {t('support.tickets.ticketClosed')}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageSquare className="w-12 h-12 mb-3" />
              <p className="text-lg font-medium text-gray-600">{t('support.tickets.selectTicket')}</p>
              <p className="text-sm">{t('support.tickets.selectTicketDesc')}</p>
            </div>
          )}
        </div>
      </div>
    </SupportLayout>
  );
}
