'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useSocket } from '@/context/SocketContext';
import {
  MessageSquare,
  Send,
  Search,
  X,
  Clock,
  User,
  CheckCircle,
  Loader2,
  UserCog,
  ChevronDown,
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

interface AssignedStaff {
  id: number;
  firstName: string;
  lastName: string;
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
  assignedStaff: AssignedStaff | null;
}

interface SupportStaff {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export default function AdminSupportTicketsPage() {
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'assigned' | 'closed'>('all');
  const [staffList, setStaffList] = useState<SupportStaff[]>([]);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const assignDropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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

  const fetchStaff = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/support/staff`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.data?.staff || []);
      }
    } catch (err) {
      console.error('Failed to fetch staff:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchTickets();
    fetchStaff();
  }, [fetchTickets, fetchStaff]);

  // Close assign dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (assignDropdownRef.current && !assignDropdownRef.current.contains(e.target as Node)) {
        setShowAssignDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAssign = async (supportId: number | null) => {
    if (!selectedTicket || !token) return;
    setIsAssigning(true);
    try {
      const res = await fetch(`${API_URL}/support/tickets/${selectedTicket.id}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ supportId }),
      });
      if (res.ok) {
        const data = await res.json();
        const updatedTicket = data.data?.ticket;
        const staff = supportId ? staffList.find(s => s.id === supportId) : null;
        const assignedStaff = staff ? { id: staff.id, firstName: staff.firstName, lastName: staff.lastName } : null;
        setTickets(prev =>
          prev.map(t => t.id === selectedTicket.id ? { ...t, ...updatedTicket, assignedStaff } : t)
        );
        setSelectedTicket(prev => prev ? { ...prev, ...updatedTicket, assignedStaff } : null);
        setShowAssignDropdown(false);
      }
    } catch (err) {
      console.error('Failed to assign ticket:', err);
    } finally {
      setIsAssigning(false);
    }
  };

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

  const handleSelectTicket = useCallback((ticket: Ticket) => {
    if (selectedTicket) {
      socket?.emit('leave_support_ticket', { ticketId: selectedTicket.id });
    }
    setSelectedTicket(ticket);
    fetchMessages(ticket.id);
    socket?.emit('join_support_ticket', { ticketId: ticket.id });
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
          fetchTickets();
          return prev;
        }
      });
    };

    const handleTicketAssigned = (data: { ticketId: number; ticket: Ticket; assignedTo?: { id: number; firstName: string; lastName: string } }) => {
      // Update ticket in list
      setTickets(prev =>
        prev.map(tk =>
          tk.id === data.ticketId
            ? { ...tk, status: data.ticket.status, assignedToId: data.ticket.assignedToId, assignedToRole: data.ticket.assignedToRole }
            : tk
        )
      );
      // Update selected ticket if it's the one being assigned
      if (selectedTicket?.id === data.ticketId) {
        setSelectedTicket(prev =>
          prev ? { ...prev, status: data.ticket.status, assignedToId: data.ticket.assignedToId, assignedToRole: data.ticket.assignedToRole } : null
        );
      }
      // Show toast
      if (data.assignedTo) {
        toast.info(t('support.tickets.toastAssigned').replace('{name}', `${data.assignedTo.firstName} ${data.assignedTo.lastName}`));
      } else {
        toast.info(t('support.tickets.toastUnassigned'));
      }
    };

    const handleNewTicket = (data: { ticket: Ticket }) => {
      setTickets(prev => {
        if (prev.find(tk => tk.id === data.ticket.id)) return prev;
        return [data.ticket, ...prev];
      });
      const userName = data.ticket.user
        ? `${data.ticket.user.firstName} ${data.ticket.user.lastName}`
        : `User #${data.ticket.userId}`;
      toast.info(t('support.tickets.toastNewTicket') + ` — ${userName}`);
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

    const handleTicketClaimed = (data: { ticketId: number; assignedToId: number; assignedToRole: string }) => {
      setTickets(prev =>
        prev.map(tk =>
          tk.id === data.ticketId
            ? { ...tk, status: 'assigned' as const, assignedToId: data.assignedToId, assignedToRole: data.assignedToRole }
            : tk
        )
      );
      if (selectedTicket?.id === data.ticketId) {
        setSelectedTicket(prev =>
          prev ? { ...prev, status: 'assigned', assignedToId: data.assignedToId, assignedToRole: data.assignedToRole } : null
        );
      }
    };

    socket.on('support_message', handleSupportMessage);
    socket.on('support_ticket_update', handleTicketUpdate);
    socket.on('support_ticket_assigned', handleTicketAssigned);
    socket.on('support_ticket_closed', handleTicketClosed);
    socket.on('support_ticket_new', handleNewTicket);
    socket.on('support_ticket_claimed', handleTicketClaimed);

    return () => {
      socket.off('support_message', handleSupportMessage);
      socket.off('support_ticket_update', handleTicketUpdate);
      socket.off('support_ticket_assigned', handleTicketAssigned);
      socket.off('support_ticket_closed', handleTicketClosed);
      socket.off('support_ticket_new', handleNewTicket);
      socket.off('support_ticket_claimed', handleTicketClaimed);
    };
  }, [socket, selectedTicket, fetchTickets, scrollToBottom, t]);

  useEffect(() => {
    return () => {
      if (selectedTicket) {
        socket?.emit('leave_support_ticket', { ticketId: selectedTicket.id });
      }
    };
  }, [selectedTicket, socket]);

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

  const filteredTickets = tickets.filter(ticket => {
    if (statusFilter !== 'all' && ticket.status !== statusFilter) return false;
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-50 rounded-xl">
          <MessageSquare className="text-amber-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('support.tickets.title')}</h1>
          <p className="text-gray-500">{t('support.tickets.adminSubtitle')}</p>
        </div>
      </div>

      {/* Chat interface */}
      <div className="h-[calc(100vh-14rem)] flex bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Ticket list sidebar */}
        <div className={`w-full sm:w-80 lg:w-96 border-r border-gray-200 flex flex-col ${selectedTicket ? 'hidden sm:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-200 space-y-3">
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
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-1">
              {(['all', 'open', 'assigned', 'closed'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-2.5 py-1 text-xs rounded-full transition-colors cursor-pointer ${
                    statusFilter === s
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {s === 'all' ? t('support.tickets.filterAll') : t(`support.tickets.status${s.charAt(0).toUpperCase() + s.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>

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
                      <img src={ticket.user.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
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
                      {ticket.assignedStaff && (
                        <p className="text-[11px] text-blue-500 mt-0.5 truncate">
                          <UserCog size={10} className="inline mr-0.5 -mt-px" />
                          {ticket.assignedStaff.firstName} {ticket.assignedStaff.lastName}
                        </p>
                      )}
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
                    <img src={selectedTicket.user.profileImageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
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
                      {selectedTicket.user?.email}
                      {selectedTicket.assignedStaff && (
                        <span className="text-blue-500"> · {t('support.tickets.handledBy')} {selectedTicket.assignedStaff.firstName} {selectedTicket.assignedStaff.lastName}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(selectedTicket.status)}
                  {selectedTicket.status !== 'closed' && (
                    <>
                      {/* Assign dropdown */}
                      <div className="relative" ref={assignDropdownRef}>
                        <button
                          onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                          disabled={isAssigning}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-amber-600 border border-gray-200 hover:border-amber-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {isAssigning ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <UserCog size={14} />
                          )}
                          {selectedTicket.assignedToId
                            ? (() => {
                                const agent = staffList.find(s => s.id === selectedTicket.assignedToId);
                                return agent ? `${agent.firstName} ${agent.lastName}` : t('support.tickets.assigned');
                              })()
                            : t('support.tickets.assign')}
                          <ChevronDown size={12} />
                        </button>

                        <AnimatePresence>
                          {showAssignDropdown && (
                            <motion.div
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -4 }}
                              className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden"
                            >
                              <div className="p-2 border-b border-gray-100">
                                <p className="text-xs font-medium text-gray-500 px-2 py-1">{t('support.tickets.assignTo')}</p>
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                {selectedTicket.assignedToId && (
                                  <button
                                    onClick={() => handleAssign(null)}
                                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-2"
                                  >
                                    <X size={14} />
                                    {t('support.tickets.unassign')}
                                  </button>
                                )}
                                {staffList.length === 0 ? (
                                  <p className="px-4 py-3 text-sm text-gray-400">{t('support.tickets.noStaff')}</p>
                                ) : (
                                  staffList.map(staff => (
                                    <button
                                      key={staff.id}
                                      onClick={() => handleAssign(staff.id)}
                                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-amber-50 transition-colors cursor-pointer flex items-center justify-between ${
                                        selectedTicket.assignedToId === staff.id ? 'bg-amber-50 text-amber-700' : 'text-gray-700'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                                          <span className="text-amber-700 text-xs font-medium">
                                            {staff.firstName[0]}{staff.lastName[0]}
                                          </span>
                                        </div>
                                        <div>
                                          <p className="font-medium">{staff.firstName} {staff.lastName}</p>
                                          <p className="text-xs text-gray-400">{staff.email}</p>
                                        </div>
                                      </div>
                                      {selectedTicket.assignedToId === staff.id && (
                                        <CheckCircle size={14} className="text-amber-500 flex-shrink-0" />
                                      )}
                                    </button>
                                  ))
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <button
                        onClick={handleCloseTicket}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg transition-colors cursor-pointer"
                      >
                        <CheckCircle size={14} className="inline mr-1" />
                        {t('support.tickets.close')}
                      </button>
                    </>
                  )}
                </div>
              </div>

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
                      {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
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
    </div>
  );
}
