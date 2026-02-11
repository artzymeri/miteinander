'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import SupportLayout from '@/components/support/SupportLayout';
import SupportProfileModal from '@/components/support/SupportProfileModal';
import { UserCheck, Loader2, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface CareRecipient {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  city: string | null;
  isActive: boolean;
  createdAt: string;
  profileImageUrl: string | null;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  lastLoginAt: string | null;
  address: string | null;
  postalCode: string | null;
  dateOfBirth: string | null;
}

interface PaginatedData {
  items: CareRecipient[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export default function SupportCareRecipientsPage() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [data, setData] = useState<PaginatedData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<CareRecipient | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: String(pageSize) });
      if (debouncedSearch) params.append('search', debouncedSearch);
      const res = await fetch(`${API_URL}/support/care-recipients?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch care recipients:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, currentPage, debouncedSearch, pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRowClick = (item: CareRecipient) => {
    setSelectedUser(item);
    setIsModalOpen(true);
  };

  const getSubscriptionColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      trial: 'bg-blue-100 text-blue-700',
      past_due: 'bg-yellow-100 text-yellow-700',
      canceled: 'bg-red-100 text-red-700',
      none: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || colors.none;
  };

  return (
    <SupportLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-purple-50 rounded-xl">
            <UserCheck className="text-purple-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('admin.careRecipients.title')}</h1>
            <p className="text-gray-500">{t('support.viewOnly')}</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('admin.careRecipients.searchPlaceholder')}
                className="w-full pl-10 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.fields.name')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.fields.email')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.fields.city')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.fields.subscribed')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('admin.fields.createdAt')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                    </td>
                  </tr>
                ) : !data?.items.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400 text-sm">
                      {t('admin.table.noData')}
                    </td>
                  </tr>
                ) : (
                  data.items.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => handleRowClick(item)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.profileImageUrl ? (
                            <img 
                              src={item.profileImageUrl} 
                              alt={`${item.firstName} ${item.lastName}`}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-purple-700 font-medium text-xs">{item.firstName[0]}{item.lastName[0]}</span>
                            </div>
                          )}
                          <span className="font-medium text-sm text-gray-900">{item.firstName} {item.lastName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{item.city || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs rounded-full ${getSubscriptionColor(item.subscriptionStatus || 'none')}`}>
                          {t(`admin.status.subscription_${item.subscriptionStatus || 'none'}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(item.createdAt).toLocaleDateString('de-DE')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && (
            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none cursor-pointer"
                  >
                    {[10, 20, 50, 100].map((size) => (
                      <option key={size} value={size}>{size}</option>
                    ))}
                  </select>
                  <span className="text-sm text-gray-500">{t('admin.table.perPage')}</span>
                </div>
                <p className="text-sm text-gray-500">
                  {t('admin.table.showing')} {data.totalItems > 0 ? ((data.currentPage - 1) * pageSize) + 1 : 0}-{Math.min(data.currentPage * pageSize, data.totalItems)} {t('admin.table.of')} {data.totalItems} {t('admin.table.results')}
                </p>
              </div>
              {data.totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-600">{data.currentPage} / {data.totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(data.totalPages, p + 1))}
                    disabled={currentPage >= data.totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Profile Modal */}
      <SupportProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={selectedUser}
        userType="careRecipient"
      />
    </SupportLayout>
  );
}
