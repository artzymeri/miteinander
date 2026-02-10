'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useSocket } from '@/context/SocketContext';
import Logo from '@/components/Logo';
import SupportChatWidget from '@/components/support/SupportChatWidget';
import {
  LayoutDashboard,
  Search,
  MessageSquare,
  Settings,
  LogOut,
  ChevronRight,
  Menu,
  X,
  User,
  Users,
} from 'lucide-react';

interface CareGiverLayoutProps {
  children: ReactNode;
}

const navItems = [
  { key: 'dashboard', href: '/caregiver', icon: LayoutDashboard },
  { key: 'findClients', href: '/caregiver/find-clients', icon: Search },
  { key: 'myClients', href: '/caregiver/my-clients', icon: Users },
  { key: 'messages', href: '/caregiver/messages', icon: MessageSquare },
  { key: 'profile', href: '/caregiver/profile', icon: User },
  { key: 'settings', href: '/caregiver/settings', icon: Settings },
];

export default function CareGiverLayout({ children }: CareGiverLayoutProps) {
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { unreadCount } = useSocket();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!isLoading && user && user.role !== 'care_giver') {
      // Redirect to appropriate dashboard based on role
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'support') {
        router.push('/support');
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

  if (!isAuthenticated || user?.role !== 'care_giver') {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/caregiver') {
      return pathname === '/caregiver';
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
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:transform-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-100">
            <Link href="/caregiver" className="flex items-center gap-3">
              <Logo accentStroke='lightgray' mainStroke='orangered' width={40} height={40} />
              <span className="text-xl font-bold text-gray-900">Miteinander</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    active
                      ? 'bg-amber-50 text-amber-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-amber-600' : ''}`} />
                  <span>{t(`caregiver.nav.${item.key}`)}</span>
                  {item.key === 'messages' && unreadCount > 0 && (
                    <span className="ml-auto bg-amber-500 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  {active && item.key !== 'messages' && (
                    <ChevronRight className="w-4 h-4 ml-auto text-amber-600" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{t('caregiver.role')}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span>{t('admin.logout')}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex-shrink-0 z-30 bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            <Logo accentStroke='lightgray' mainStroke='orangered' width={32} height={32} />
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto ${pathname.startsWith('/caregiver/messages') ? '' : 'p-4 lg:p-8'}`}>
          {children}
        </main>
      </div>

      {/* Mobile close button */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed top-4 right-4 z-50 lg:hidden p-2 bg-white rounded-full shadow-lg"
          >
            <X className="w-6 h-6 text-gray-600" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Support Chat Widget */}
      <SupportChatWidget />
    </div>
  );
}
