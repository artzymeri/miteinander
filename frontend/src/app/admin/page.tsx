'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import { useAnalytics } from '@/hooks/useAdminApi';
import {
  Users,
  HeartHandshake,
  UserCheck,
  Headphones,
  TrendingUp,
  Calendar,
  CheckCircle,
} from 'lucide-react';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data: analytics, isLoading, error } = useAnalytics();

  const statCards = analytics ? [
    {
      title: t('admin.stats.totalUsers'),
      value: analytics.totals.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      lightColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      title: t('admin.stats.careGivers'),
      value: analytics.totals.careGivers,
      icon: HeartHandshake,
      color: 'bg-green-500',
      lightColor: 'bg-green-50',
      textColor: 'text-green-600',
      subtitle: `${analytics.verified.careGivers} ${t('admin.stats.verified')}`,
    },
    {
      title: t('admin.stats.careRecipients'),
      value: analytics.totals.careRecipients,
      icon: UserCheck,
      color: 'bg-purple-500',
      lightColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      title: t('admin.stats.supportStaff'),
      value: analytics.totals.supports,
      icon: Headphones,
      color: 'bg-amber-500',
      lightColor: 'bg-amber-50',
      textColor: 'text-amber-600',
    },
  ] : [];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-xl">
        {error instanceof Error ? error.message : 'Failed to load analytics'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('admin.dashboard.title')}</h1>
        <p className="text-gray-500 mt-1">{t('admin.dashboard.subtitle')}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
            >
              <div className={`inline-flex p-3 rounded-lg ${stat.lightColor} mb-4`}>
                <Icon className={stat.textColor} size={24} />
              </div>
              <p className="text-sm text-gray-500 font-medium">{stat.title}</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              {stat.subtitle && (
                <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-6 text-white"
        >
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={24} />
            <span className="font-medium">{t('admin.stats.last30Days')}</span>
          </div>
          <p className="text-4xl font-bold">{analytics?.last30Days.total}</p>
          <p className="text-amber-100 text-sm mt-2">
            {t('admin.stats.newRegistrations')}
          </p>
          <div className="mt-4 pt-4 border-t border-white/20 flex justify-between text-sm">
            <span>{analytics?.last30Days.careGivers} {t('admin.stats.careGivers')}</span>
            <span>{analytics?.last30Days.careRecipients} {t('admin.stats.careRecipients')}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <span className="font-medium text-gray-900">{t('admin.stats.activeUsers')}</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">{t('admin.stats.careGivers')}</span>
              <span className="font-semibold text-gray-900">{analytics?.active.careGivers}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{
                  width: `${analytics ? (analytics.active.careGivers / analytics.totals.careGivers) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-sm">{t('admin.stats.careRecipients')}</span>
              <span className="font-semibold text-gray-900">{analytics?.active.careRecipients}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full"
                style={{
                  width: `${analytics ? (analytics.active.careRecipients / analytics.totals.careRecipients) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            <span className="font-medium text-gray-900">{t('admin.stats.verificationRate')}</span>
          </div>
          <p className="text-4xl font-bold text-gray-900">
            {analytics && analytics.totals.careGivers > 0
              ? Math.round((analytics.verified.careGivers / analytics.totals.careGivers) * 100)
              : 0}%
          </p>
          <p className="text-gray-500 text-sm mt-2">
            {t('admin.stats.careGiversVerified')}
          </p>
        </motion.div>
      </div>

      {/* Recent registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <HeartHandshake size={20} className="text-green-600" />
              {t('admin.dashboard.recentCareGivers')}
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {analytics?.recentRegistrations.careGivers.map((user) => (
              <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-700 font-medium text-sm">
                        {user.firstName[0]}{user.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{formatDate(user.createdAt)}</p>
                    <div className="flex gap-1 mt-1 justify-end">
                      {user.isVerified ? (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                          {t('admin.status.verified')}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                          {t('admin.status.pending')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {(!analytics?.recentRegistrations.careGivers || analytics.recentRegistrations.careGivers.length === 0) && (
              <div className="p-8 text-center text-gray-500">
                {t('admin.dashboard.noRecentRegistrations')}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <UserCheck size={20} className="text-purple-600" />
              {t('admin.dashboard.recentCareRecipients')}
            </h3>
          </div>
          <div className="divide-y divide-gray-100">
            {analytics?.recentRegistrations.careRecipients.map((user) => (
              <div key={user.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-700 font-medium text-sm">
                        {user.firstName[0]}{user.lastName[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">{formatDate(user.createdAt)}</p>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.isActive ? t('admin.status.active') : t('admin.status.inactive')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {(!analytics?.recentRegistrations.careRecipients || analytics.recentRegistrations.careRecipients.length === 0) && (
              <div className="p-8 text-center text-gray-500">
                {t('admin.dashboard.noRecentRegistrations')}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
