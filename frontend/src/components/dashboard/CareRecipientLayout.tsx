'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useSocket } from '@/context/SocketContext';
import { LogoBlack } from '@/components/Logo';
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
  CheckCircle,
  Bell,
  Star,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface NotificationData {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  data: { caregiverId?: number } | null;
  createdAt: string;
}

interface CareRecipientLayoutProps {
  children: ReactNode;
}

const navItems = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'findCaregivers', href: '/dashboard/find-caregivers', icon: Search },
  { key: 'messages', href: '/dashboard/messages', icon: MessageSquare },
  { key: 'profile', href: '/dashboard/profile', icon: User },
  { key: 'settings', href: '/dashboard/settings', icon: Settings },
];

export default function CareRecipientLayout({ children }: CareRecipientLayoutProps) {
  const { user, logout, isLoading, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const { unreadCount } = useSocket();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettled, setIsSettled] = useState(false);
  const [settledCaregiver, setSettledCaregiver] = useState<{ id: number; firstName: string; lastName: string; profileImageUrl: string | null } | null>(null);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [notifUnreadCount, setNotifUnreadCount] = useState(0);
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const mobileNotifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
    if (!isLoading && user && user.role !== 'care_recipient') {
      // Redirect to appropriate dashboard based on role
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'support') {
        router.push('/support');
      } else if (user.role === 'care_giver') {
        router.push('/caregiver');
      } else {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    const fetchSettledStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_URL}/recipient/profile`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setIsSettled(!!data.data.profile.isSettled);
          setSettledCaregiver(data.data.profile.settledWithCaregiver || null);
        }
      } catch (error) {
        console.error('Failed to fetch settled status:', error);
      }
    };
    if (!isLoading && isAuthenticated && user?.role === 'care_recipient') {
      fetchSettledStatus();
    }
  }, [isLoading, isAuthenticated, user]);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch(`${API_URL}/recipient/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.data.notifications);
          setNotifUnreadCount(data.data.unreadCount);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };
    if (!isLoading && isAuthenticated && user?.role === 'care_recipient') {
      fetchNotifications();
      // Poll every 60 seconds
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [isLoading, isAuthenticated, user]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notifRef.current && !notifRef.current.contains(event.target as Node) &&
        mobileNotifRef.current && !mobileNotifRef.current.contains(event.target as Node)
      ) {
        setShowNotifPopover(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node) && !mobileNotifRef.current) {
        setShowNotifPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenNotifications = async () => {
    setShowNotifPopover(!showNotifPopover);
    if (!showNotifPopover && notifUnreadCount > 0) {
      // Mark visible notifications as read
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      if (unreadIds.length > 0) {
        try {
          const token = localStorage.getItem('token');
          await fetch(`${API_URL}/recipient/notifications/mark-read`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ notificationIds: unreadIds }),
          });
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
          setNotifUnreadCount(0);
        } catch (error) {
          console.error('Failed to mark notifications as read:', error);
        }
      }
    }
  };

  const handleNotificationClick = (notif: NotificationData) => {
    if (notif.type === 'rate_caregiver' && notif.data?.caregiverId) {
      router.push(`/dashboard/caregivers/${notif.data.caregiverId}`);
      setShowNotifPopover(false);
      setIsSidebarOpen(false);
    }
  };

  const formatNotifTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return t('notifications.justNow') || 'Just now';
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHr < 24) return `${diffHr}h`;
    return `${diffDay}d`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'care_recipient') {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
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
            <Link href="/dashboard" className="flex items-center gap-3">
              <LogoBlack width={40} height={40} />
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
                  <span>{t(`recipient.nav.${item.key}`)}</span>
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

          {/* Notification bell - outside nav to avoid overflow clipping */}
          <div className="px-4 pb-2 relative" ref={notifRef}>
              <button
                onClick={handleOpenNotifications}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer"
              >
                <div className="relative">
                  <Bell className="w-5 h-5" />
                  {notifUnreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                      {notifUnreadCount > 9 ? '9+' : notifUnreadCount}
                    </span>
                  )}
                </div>
                <span>{t('notifications.title') || 'Notifications'}</span>
              </button>

              {/* Notification popover */}
              <AnimatePresence>
                {showNotifPopover && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-full bottom-0 ml-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {t('notifications.title') || 'Notifications'}
                      </h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">
                            {t('notifications.noNotifications') || 'No notifications yet'}
                          </p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 cursor-pointer ${
                              !notif.isRead ? 'bg-amber-50/50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
                                notif.type === 'rate_caregiver'
                                  ? 'bg-amber-100 text-amber-600'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {notif.type === 'rate_caregiver' ? (
                                  <Star className="w-4 h-4" />
                                ) : (
                                  <Bell className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                  {notif.message}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">
                                  {formatNotifTime(notif.createdAt)}
                                </p>
                              </div>
                              {!notif.isRead && (
                                <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
          </div>

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
                <p className="text-xs text-gray-500 truncate">{t('recipient.role')}</p>
                {isSettled && (
                  <div className="relative group/settled mt-1">
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-medium rounded-full border border-emerald-200 cursor-default">
                      <CheckCircle className="w-3 h-3" />
                      {t('settlement.settled')}
                    </span>
                    {settledCaregiver && (
                      <div className="absolute bottom-full left-0 z-50 hidden group-hover/settled:block pb-1.5">
                        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-3 min-w-[200px]">
                          <p className="text-[11px] text-gray-400 mb-2">{t('settlement.settledWith')}</p>
                          <button
                            onClick={() => {
                              router.push(`/dashboard/caregivers/${settledCaregiver.id}`);
                              setIsSidebarOpen(false);
                            }}
                            className="flex items-center gap-2.5 w-full hover:bg-gray-50 rounded-lg p-1.5 -m-1.5 transition-colors cursor-pointer"
                          >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-semibold overflow-hidden flex-shrink-0">
                              {settledCaregiver.profileImageUrl ? (
                                <img src={settledCaregiver.profileImageUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <>{settledCaregiver.firstName[0]}{settledCaregiver.lastName[0]}</>
                              )}
                            </div>
                            <span className="text-sm font-medium text-gray-900 hover:text-amber-600 transition-colors">
                              {settledCaregiver.firstName} {settledCaregiver.lastName}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
            <LogoBlack width={32} height={32} />
            <div className="relative" ref={mobileNotifRef}>
              <button
                onClick={handleOpenNotifications}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative cursor-pointer"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {notifUnreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5">
                    {notifUnreadCount > 9 ? '9+' : notifUnreadCount}
                  </span>
                )}
              </button>

              {/* Mobile notification popover */}
              <AnimatePresence>
                {showNotifPopover && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 w-80 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {t('notifications.title') || 'Notifications'}
                      </h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center">
                          <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">
                            {t('notifications.noNotifications') || 'No notifications yet'}
                          </p>
                        </div>
                      ) : (
                        notifications.map(notif => (
                          <button
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 cursor-pointer ${
                              !notif.isRead ? 'bg-amber-50/50' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
                                notif.type === 'rate_caregiver'
                                  ? 'bg-amber-100 text-amber-600'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                {notif.type === 'rate_caregiver' ? (
                                  <Star className="w-4 h-4" />
                                ) : (
                                  <Bell className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notif.title}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                  {notif.message}
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">
                                  {formatNotifTime(notif.createdAt)}
                                </p>
                              </div>
                              {!notif.isRead && (
                                <div className="w-2 h-2 bg-amber-500 rounded-full flex-shrink-0 mt-1.5" />
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto ${pathname.startsWith('/dashboard/messages') ? '' : 'p-4 lg:p-8'}`}>
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
