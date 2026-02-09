'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useSocket } from '@/context/SocketContext';
import SupportLayout from '@/components/support/SupportLayout';
import {
  MessageSquare,
  HeartHandshake,
  UserCheck,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface TicketSummary {
  open: number;
  assigned: number;
  closed: number;
}

export default function SupportDashboardPage() {
  const { user, token, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();
  const { socket } = useSocket();
  const [ticketSummary, setTicketSummary] = useState<TicketSummary>({ open: 0, assigned: 0, closed: 0 });
  const [isLoading, setIsLoading] = useState(true);

  const fetchSummary = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const tickets = data.data?.tickets || [];
        setTicketSummary({
          open: tickets.filter((t: { status: string }) => t.status === 'open').length,
          assigned: tickets.filter((t: { status: string }) => t.status === 'assigned').length,
          closed: tickets.filter((t: { status: string }) => t.status === 'closed').length,
        });
      }
    } catch (err) {
      console.error('Failed to fetch ticket summary:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Real-time socket updates for ticket stats
  useEffect(() => {
    if (!socket) return;

    // Refetch on every ticket event — the backend already filters
    // correctly per-user (support sees only open + assigned-to-me)
    socket.on('support_ticket_new', fetchSummary);
    socket.on('support_ticket_assigned', fetchSummary);
    socket.on('support_ticket_closed', fetchSummary);
    socket.on('support_ticket_claimed', fetchSummary);

    return () => {
      socket.off('support_ticket_new', fetchSummary);
      socket.off('support_ticket_assigned', fetchSummary);
      socket.off('support_ticket_closed', fetchSummary);
      socket.off('support_ticket_claimed', fetchSummary);
    };
  }, [socket, fetchSummary]);

  if (authLoading) {
    return (
      <SupportLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      </SupportLayout>
    );
  }

  const stats = [
    {
      label: t('support.stats.openTickets'),
      value: ticketSummary.open,
      icon: MessageSquare,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: t('support.stats.assignedToMe'),
      value: ticketSummary.assigned,
      icon: MessageSquare,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
  ];

  return (
    <SupportLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('support.welcome')}, {user?.firstName}!
          </h1>
          <p className="text-gray-500 mt-1">{t('support.welcomeMessage')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl border border-gray-200 p-6"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {isLoading ? '...' : stat.value}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/support/tickets">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-amber-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-amber-600" />
                  </div>
                  <span className="font-medium text-gray-900">{t('support.nav.tickets')}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </motion.div>
          </Link>

          <Link href="/support/care-givers">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-green-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-50 rounded-lg">
                    <HeartHandshake className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="font-medium text-gray-900">{t('support.nav.careGivers')}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </motion.div>
          </Link>

          <Link href="/support/care-recipients">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-purple-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <UserCheck className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-medium text-gray-900">{t('support.nav.careRecipients')}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400" />
              </div>
            </motion.div>
          </Link>
        </div>
      </div>
    </SupportLayout>
  );
}
