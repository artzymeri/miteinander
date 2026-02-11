'use client';

import { ReactNode, useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useSocket } from '@/context/SocketContext';
import {
  LayoutDashboard,
  HeartHandshake,
  UserCheck,
  MessageSquare,
  LogOut,
  ChevronRight,
  Menu,
  X,
  Settings,
} from 'lucide-react';
import Logo from '../Logo';

interface SupportLayoutProps {
  children: ReactNode;
}

const navItems = [
  { key: 'dashboard', href: '/support', icon: LayoutDashboard },
  { key: 'tickets', href: '/support/tickets', icon: MessageSquare },
  { key: 'careGivers', href: '/support/care-givers', icon: HeartHandshake },
  { key: 'careRecipients', href: '/support/care-recipients', icon: UserCheck },
  { key: 'settings', href: '/support/settings', icon: Settings },
];

export default function SupportLayout({ children }: SupportLayoutProps) {
  const { user, logout, isLoading, isAuthenticated, token } = useAuth();
  const { t } = useTranslation();
  const { socket } = useSocket();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [assignedCount, setAssignedCount] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const fetchAssignedCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const tickets = data.data?.tickets || [];
        const count = tickets.filter(
          (tk: { status: string; assignedToId: number | null }) =>
            (tk.status === 'open' || tk.status === 'assigned') && (tk.assignedToId === user?.id || tk.status === 'open')
        ).length;
        setAssignedCount(count);
      }
    } catch (err) {
      console.error('Failed to fetch assigned count:', err);
    }
  }, [token, user?.id, API_URL]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'support') {
      fetchAssignedCount();
    }
  }, [isAuthenticated, user?.role, fetchAssignedCount]);

  // Real-time updates for the badge count
  useEffect(() => {
    if (!socket) return;

    const refreshCount = () => {
      fetchAssignedCount();
    };

    socket.on('support_ticket_new', refreshCount);
    socket.on('support_ticket_assigned', refreshCount);
    socket.on('support_ticket_closed', refreshCount);
    socket.on('support_ticket_claimed', refreshCount);
    socket.on('support_ticket_update', refreshCount);

    return () => {
      socket.off('support_ticket_new', refreshCount);
      socket.off('support_ticket_assigned', refreshCount);
      socket.off('support_ticket_closed', refreshCount);
      socket.off('support_ticket_claimed', refreshCount);
      socket.off('support_ticket_update', refreshCount);
    };
  }, [socket, fetchAssignedCount]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!isLoading && user && user.role !== 'support') {
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'care_giver') {
        router.push('/caregiver');
      } else if (user.role === 'care_recipient') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'support') {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/support') {
      return pathname === '/support';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out lg:transform-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
            <Link href="/support" className="flex items-center gap-2">
              <Logo accentStroke='lightgray' mainStroke='gray' width={32} height={32} />
              <span className="font-bold text-lg text-gray-900">{t('support.title')}</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              const showBadge = item.key === 'tickets' && assignedCount > 0;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-amber-50 text-amber-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon size={20} />
                  <span>{t(`support.nav.${item.key}`)}</span>
                  {showBadge && (
                    <span className="ml-auto bg-amber-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                      {assignedCount > 99 ? '99+' : assignedCount}
                    </span>
                  )}
                  {active && !showBadge && <ChevronRight size={16} className="ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-amber-700 font-semibold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut size={18} />
              <span>{t('admin.logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-gray-500 hover:text-gray-700 cursor-pointer"
          >
            <Menu size={24} />
          </button>
          <span className="ml-3 font-semibold text-gray-900">
            {t(`support.nav.${navItems.find(item => isActive(item.href))?.key || 'dashboard'}`)}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
