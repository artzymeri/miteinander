'use client';

import { ReactNode, useEffect, useState, useRef } from 'react';
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
  Bell,
  Handshake,
  Check,
  Loader2,
} from 'lucide-react';

interface SettlementRequest {
  id: number;
  status: string;
  createdAt: string;
  careRecipient: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl: string | null;
    city?: string;
    country?: string;
  };
}

interface CareGiverLayoutProps {
  children: ReactNode;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

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
  const [settlementRequests, setSettlementRequests] = useState<SettlementRequest[]>([]);
  const [settlementCount, setSettlementCount] = useState(0);
  const [showSettlementPopover, setShowSettlementPopover] = useState(false);
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const settlementRef = useRef<HTMLDivElement>(null);
  const mobileSettlementRef = useRef<HTMLDivElement>(null);

  // Compute subscription access synchronously
  const subscriptionStatus = user?.subscriptionStatus;
  const trialExpired = subscriptionStatus === 'trial' && user?.trialEndsAt && new Date() > new Date(user.trialEndsAt);
  const hasSubscriptionAccess = isAuthenticated && user?.role === 'care_giver' && (
    subscriptionStatus === 'active' ||
    (subscriptionStatus === 'trial' && !trialExpired)
  );

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && user.role !== 'care_giver') {
      if (user.role === 'admin') router.push('/admin');
      else if (user.role === 'support') router.push('/support');
      else if (user.role === 'care_recipient') router.push('/dashboard');
      else router.push('/');
      return;
    }

    // Redirect to plans page if subscription expired or not active
    if (user?.role === 'care_giver' && !hasSubscriptionAccess) {
      router.push('/plans');
    }
  }, [isLoading, isAuthenticated, user, router, hasSubscriptionAccess]);

  // Fetch settlement requests
  useEffect(() => {
    const fetchSettlementRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const response = await fetch(`${API_URL}/caregiver/settlement-requests`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setSettlementRequests(data.data.requests);
          setSettlementCount(data.data.requests.length);
        }
      } catch (error) {
        console.error('Failed to fetch settlement requests:', error);
      }
    };
    if (!isLoading && isAuthenticated && user?.role === 'care_giver') {
      fetchSettlementRequests();
      const interval = setInterval(fetchSettlementRequests, 30000);
      return () => clearInterval(interval);
    }
  }, [isLoading, isAuthenticated, user]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settlementRef.current && !settlementRef.current.contains(event.target as Node) &&
        (!mobileSettlementRef.current || !mobileSettlementRef.current.contains(event.target as Node))
      ) {
        setShowSettlementPopover(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSettlementResponse = async (requestId: number, action: 'confirm' | 'reject') => {
    setRespondingTo(requestId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/caregiver/settlement-requests/${requestId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove from list
        setSettlementRequests(prev => prev.filter(r => r.id !== requestId));
        setSettlementCount(prev => prev - 1);
      }
    } catch (error) {
      console.error(`Failed to ${action} settlement request:`, error);
    } finally {
      setRespondingTo(null);
    }
  };

  const formatRequestTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return t('notifications.justNow');
    if (diffMin < 60) return `${diffMin}m`;
    if (diffHr < 24) return `${diffHr}h`;
    return `${diffDay}d`;
  };

  const SettlementPopoverContent = () => (
    <div className="w-80 max-h-96 overflow-y-auto">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">{t('settlement.requestTitle')}</h3>
      </div>
      {settlementRequests.length === 0 ? (
        <div className="px-4 py-8 text-center text-gray-500 text-sm">
          {t('settlement.noRequests')}
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {settlementRequests.map((req) => (
            <div key={req.id} className="px-4 py-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 overflow-hidden">
                  {req.careRecipient.profileImageUrl ? (
                    <img src={req.careRecipient.profileImageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <>{req.careRecipient.firstName[0]}{req.careRecipient.lastName[0]}</>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {req.careRecipient.firstName} {req.careRecipient.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{req.careRecipient.email}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatRequestTime(req.createdAt)}
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSettlementResponse(req.id, 'confirm')}
                      disabled={respondingTo === req.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      {respondingTo === req.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Check className="w-3 h-3" />
                      )}
                      {t('settlement.confirm')}
                    </button>
                    <button
                      onClick={() => handleSettlementResponse(req.id, 'reject')}
                      disabled={respondingTo === req.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      <X className="w-3 h-3" />
                      {t('settlement.dismiss')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Show loading spinner while auth is loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
  }

  // Block ALL dashboard content if not authenticated, wrong role, or no subscription access
  if (!isAuthenticated || user?.role !== 'care_giver' || !hasSubscriptionAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
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
              <span className="text-xl font-bold text-gray-900">MyHelper</span>
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
            {/* Settlement requests bell */}
            <div ref={settlementRef} className="relative mb-2">
              <button
                onClick={() => setShowSettlementPopover(!showSettlementPopover)}
                className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-amber-50 hover:text-amber-600 transition-all"
              >
                <div className="relative">
                  <Bell className="w-5 h-5" />
                  {settlementCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {settlementCount > 9 ? '9+' : settlementCount}
                    </span>
                  )}
                </div>
                <span>{t('settlement.requestTitle')}</span>
                {settlementCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
                    {settlementCount > 9 ? '9+' : settlementCount}
                  </span>
                )}
              </button>

              {/* Settlement popover */}
              <AnimatePresence>
                {showSettlementPopover && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50"
                  >
                    <SettlementPopoverContent />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

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
            <div ref={mobileSettlementRef} className="relative">
              <button
                onClick={() => setShowSettlementPopover(!showSettlementPopover)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {settlementCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {settlementCount > 9 ? '9+' : settlementCount}
                  </span>
                )}
              </button>

              {/* Mobile settlement popover */}
              <AnimatePresence>
                {showSettlementPopover && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50"
                  >
                    <SettlementPopoverContent />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
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
