'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { useTranslation } from '@/context/LanguageContext';
import { useSearchParams } from 'next/navigation';
import CareRecipientLayout from '@/components/dashboard/CareRecipientLayout';
import {
  Search,
  Send,
  ArrowLeft,
  MessageSquare,
  Loader2,
  Check,
  CheckCheck,
  Handshake,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ConversationUser {
  id: number;
  firstName: string;
  lastName: string;
  profileImageUrl: string | null;
  occupation?: string;
}

interface LastMessage {
  id: number;
  content: string;
  senderRole: string;
  senderId: number;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  id: number;
  careGiverId: number;
  careRecipientId: number;
  lastMessageAt: string | null;
  careGiver: ConversationUser;
  careRecipient: ConversationUser;
  lastMessage: LastMessage | null;
  unreadCount: number;
}

interface Message {
  id: number;
  conversationId: number;
  senderRole: string;
  senderId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
  messageType?: string;
}

export default function RecipientMessagesPage() {
  const { token, user } = useAuth();
  const { sendMessage, respondSettlement, joinConversation, leaveConversation, onNewMessage, onMessagesRead, startTyping, stopTyping, onTyping, onStopTyping, markAsRead, refreshUnreadCount, onSettlementCompleted } = useSocket();
  const { t } = useTranslation();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.data.conversations);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [token]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: number) => {
    if (!token) return;
    setIsLoadingMessages(true);
    try {
      const res = await fetch(`${API_URL}/messages/conversations/${conversationId}/messages?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data.messages);
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle conversationId from URL (e.g., coming from profile page)
  const urlConvHandledRef = useRef<string | null>(null);
  useEffect(() => {
    const convId = searchParams.get('conversation');
    if (convId && conversations.length > 0 && urlConvHandledRef.current !== convId) {
      const conv = conversations.find(c => c.id === parseInt(convId));
      if (conv) {
        urlConvHandledRef.current = convId;
        selectConversation(conv);
      }
    }
  }, [searchParams, conversations]);

  const selectConversation = (conv: Conversation) => {
    // Immediately clear local unread count for this conversation
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
    setActiveConversation({ ...conv, unreadCount: 0 });
  };

  // When active conversation changes
  useEffect(() => {
    if (!activeConversation) return;

    fetchMessages(activeConversation.id);
    joinConversation(activeConversation.id);
    markAsRead(activeConversation.id);
    refreshUnreadCount();

    return () => {
      leaveConversation(activeConversation.id);
    };
  }, [activeConversation, fetchMessages, joinConversation, leaveConversation, markAsRead, refreshUnreadCount]);

  // Listen for new messages
  useEffect(() => {
    const cleanup = onNewMessage((message: Message) => {
      if (activeConversation && message.conversationId === activeConversation.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
        // Mark as read since user is viewing this conversation
        if (message.senderRole !== 'care_recipient') {
          markAsRead(activeConversation.id);
        }
      }
      // Update conversation list
      fetchConversations();
    });
    return cleanup;
  }, [activeConversation, onNewMessage, markAsRead, fetchConversations]);

  // Listen for typing
  useEffect(() => {
    const cleanupTyping = onTyping((data) => {
      if (activeConversation && data.conversationId === activeConversation.id) {
        setIsTyping(true);
      }
    });
    const cleanupStopTyping = onStopTyping((data) => {
      if (activeConversation && data.conversationId === activeConversation.id) {
        setIsTyping(false);
      }
    });
    return () => { cleanupTyping(); cleanupStopTyping(); };
  }, [activeConversation, onTyping, onStopTyping]);

  // Listen for messages read
  useEffect(() => {
    const cleanup = onMessagesRead((data) => {
      if (activeConversation && data.conversationId === activeConversation.id) {
        setMessages(prev => prev.map(m => 
          m.senderRole === 'care_recipient' ? { ...m, isRead: true } : m
        ));
      }
    });
    return cleanup;
  }, [activeConversation, onMessagesRead]);

  // Listen for settlement completions
  useEffect(() => {
    const cleanup = onSettlementCompleted((data) => {
      if (activeConversation && data.conversationId === activeConversation.id) {
        fetchMessages(activeConversation.id);
      }
    });
    return cleanup;
  }, [activeConversation, onSettlementCompleted, fetchMessages]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConversation || isSending) return;
    
    const content = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    const sent = await sendMessage(activeConversation.id, content);
    setIsSending(false);
    
    if (!sent) {
      setNewMessage(content); // Restore on failure
    } else {
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = () => {
    if (!activeConversation) return;
    startTyping(activeConversation.id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (activeConversation) stopTyping(activeConversation.id);
    }, 2000);
  };

  const handleSettlementResponse = async (messageId: number, accepted: boolean) => {
    if (!activeConversation || respondingTo !== null) return;
    setRespondingTo(messageId);
    await respondSettlement(activeConversation.id, messageId, accepted);
    setRespondingTo(null);
  };

  // Check if there's a pending settlement request (no response yet)
  const hasSettlementResponse = messages.some(
    m => m.messageType === 'settlement_confirmed' || m.messageType === 'settlement_dismissed'
  );

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return t('messages.today');
    if (date.toDateString() === yesterday.toDateString()) return t('messages.yesterday');
    return date.toLocaleDateString();
  };

  const getOtherUser = (conv: Conversation): ConversationUser => {
    return conv.careGiver;
  };

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const other = getOtherUser(conv);
    const name = `${other.firstName} ${other.lastName}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { date: string; messages: Message[] }[], msg) => {
    const date = formatDate(msg.createdAt);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.date === date) {
      lastGroup.messages.push(msg);
    } else {
      groups.push({ date, messages: [msg] });
    }
    return groups;
  }, []);

  return (
    <CareRecipientLayout>
      <div className="h-full flex bg-gray-50">
        {/* Conversation List */}
        <div className={`${activeConversation ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-100">
            <h1 className="text-xl font-bold text-gray-900 mb-3">{t('messages.title')}</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('messages.searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingConversations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">{t('messages.noConversations')}</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const other = getOtherUser(conv);
                const isActive = activeConversation?.id === conv.id;
                return (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-50 ${isActive ? 'bg-amber-50 hover:bg-amber-50' : ''}`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                        {other.profileImageUrl ? (
                          <img src={other.profileImageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <>{other.firstName[0]}{other.lastName[0]}</>
                        )}
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-gray-900 truncate">
                          {other.firstName} {other.lastName}
                        </span>
                        {conv.lastMessage && (
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage ? (
                        <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                          {conv.lastMessage.senderRole === 'care_recipient' && (
                            <span className="text-gray-400">{t('messages.you')}: </span>
                          )}
                          {conv.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 mt-0.5">{t('messages.noMessages')}</p>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`${activeConversation ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white`}>
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white">
                <button
                  onClick={() => setActiveConversation(null)}
                  className="md:hidden p-1 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold overflow-hidden">
                  {getOtherUser(activeConversation).profileImageUrl ? (
                    <img src={getOtherUser(activeConversation).profileImageUrl!} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <>{getOtherUser(activeConversation).firstName[0]}{getOtherUser(activeConversation).lastName[0]}</>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900 text-sm">
                    {getOtherUser(activeConversation).firstName} {getOtherUser(activeConversation).lastName}
                  </h2>
                  {isTyping && (
                    <p className="text-xs text-amber-500">{t('messages.typing')}</p>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">{t('messages.startConversation')}</p>
                  </div>
                ) : (
                  groupedMessages.map((group, gi) => (
                    <div key={gi}>
                      <div className="flex items-center justify-center my-4">
                        <span className="text-xs text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
                          {group.date}
                        </span>
                      </div>
                      {group.messages.map((msg) => {
                        const isMine = msg.senderRole === 'care_recipient';
                        
                        // Settlement system messages (confirmed/dismissed)
                        if (msg.messageType === 'settlement_confirmed' || msg.messageType === 'settlement_dismissed') {
                          return (
                            <div key={msg.id} className="flex justify-center mb-3">
                              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium ${
                                msg.messageType === 'settlement_confirmed'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                <Handshake className="w-3.5 h-3.5" />
                                {msg.messageType === 'settlement_confirmed'
                                  ? t('settlement.confirmedMessage')
                                  : t('settlement.dismissedMessage')}
                              </div>
                            </div>
                          );
                        }
                        
                        // Settlement request from caregiver — show confirm/dismiss buttons
                        if (msg.messageType === 'settlement_request') {
                          return (
                            <div key={msg.id} className="flex justify-center mb-3">
                              <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 max-w-[85%]">
                                <div className="flex items-center gap-2 mb-2">
                                  <Handshake className="w-4 h-4 text-amber-600" />
                                  <span className="text-sm font-medium text-amber-800">{t('settlement.requestTitle')}</span>
                                </div>
                                <p className="text-xs text-amber-600 mb-3">{t('settlement.requestDesc')}</p>
                                {!hasSettlementResponse && (
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSettlementResponse(msg.id, true)}
                                      disabled={respondingTo !== null}
                                      className="flex-1 px-3 py-2 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                      {respondingTo === msg.id ? '...' : t('settlement.confirm')}
                                    </button>
                                    <button
                                      onClick={() => handleSettlementResponse(msg.id, false)}
                                      disabled={respondingTo !== null}
                                      className="flex-1 px-3 py-2 bg-gray-200 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                      {t('settlement.dismiss')}
                                    </button>
                                  </div>
                                )}
                                <span className="text-[10px] text-amber-400 mt-2 block">{formatTime(msg.createdAt)}</span>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}>
                            <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                              isMine
                                ? 'bg-amber-500 text-white rounded-br-md'
                                : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                            }`}>
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                              <div className={`flex items-center gap-1 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <span className={`text-[10px] ${isMine ? 'text-white/70' : 'text-gray-400'}`}>
                                  {formatTime(msg.createdAt)}
                                </span>
                                {isMine && (
                                  msg.isRead ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-white/70" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-white/70" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={newMessage}
                    onChange={e => { setNewMessage(e.target.value); handleTyping(); }}
                    onKeyDown={handleKeyDown}
                    placeholder={t('messages.typePlaceholder')}
                    rows={1}
                    className="flex-1 resize-none px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 max-h-32"
                    style={{ minHeight: '42px' }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!newMessage.trim() || isSending}
                    className="p-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-gray-700 mb-1">{t('messages.selectConversation')}</h2>
                <p className="text-sm text-gray-400">{t('messages.selectConversationDesc')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </CareRecipientLayout>
  );
}
