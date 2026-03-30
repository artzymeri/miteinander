'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { CreditCard, ExternalLink, Crown, Zap, Loader2, AlertTriangle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function SubscriptionTab() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [subscriptionEndsAt, setSubscriptionEndsAt] = useState<string | null>(user?.subscriptionEndsAt || null);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  const subscriptionStatus = user?.subscriptionStatus || 'none';
  const isActive = subscriptionStatus === 'active';
  const isCanceling = isActive && !!subscriptionEndsAt;

  // Fetch latest subscription status on mount
  useEffect(() => {
    const fetchStatus = async () => {
      if (!token) { setStatusLoading(false); return; }
      try {
        const response = await fetch(`${API_URL}/subscription/status`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await response.json();
        if (data.success) {
          setSubscriptionEndsAt(data.data.subscriptionEndsAt || null);
          setCurrentPeriodEnd(data.data.currentPeriodEnd || null);
          setPlan(data.data.plan || null);
        }
      } catch {
        // Ignore — use local state
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatus();
  }, [token]);

  const handleManageSubscription = async () => {
    setError('');
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/subscription/portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        setError(data.error?.message || t('plans.error'));
      }
    } catch {
      setError(t('plans.error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoosePlan = () => {
    window.location.href = '/plans';
  };

  const cancelDaysLeft = subscriptionEndsAt
    ? Math.max(0, Math.ceil((new Date(subscriptionEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('plans.manageSubscription')}
        </h3>
      </div>

      {/* Status card */}
      {statusLoading ? (
        <div className="rounded-xl p-5 border-2 bg-gray-50 border-gray-200 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : (
      <div className={`rounded-xl p-5 border-2 ${
        isCanceling
          ? 'bg-amber-50 border-amber-200'
          : isActive 
            ? 'bg-green-50 border-green-200'
            : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-3">
          {isCanceling ? (
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          ) : isActive ? (
            <Crown className="w-6 h-6 text-green-600" />
          ) : (
            <Zap className="w-6 h-6 text-gray-500" />
          )}
          <div>
            <p className={`font-semibold ${
              isCanceling ? 'text-amber-800' : isActive ? 'text-green-800' : 'text-gray-700'
            }`}>
              {isCanceling
                ? t('settings.subscriptionCanceling')
                : isActive 
                  ? t('settings.subscriptionActive')
                  : t('settings.subscriptionNone')
              }
            </p>
            {isActive && !isCanceling && plan && (
              <p className="text-sm text-green-600 mt-0.5">
                {t('plans.yearly')} — €8,99/{t('plans.perYear')}
              </p>
            )}
            {isActive && !isCanceling && currentPeriodEnd && (
              <p className="text-sm text-green-600 mt-0.5">
                {t('settings.activeUntil', { date: formatDate(currentPeriodEnd) })}
              </p>
            )}
            {isCanceling && subscriptionEndsAt && (
              <p className="text-sm text-amber-600 mt-0.5">
                {t('settings.subscriptionEndsOn', { date: formatDate(subscriptionEndsAt), days: cancelDaysLeft })}
              </p>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Canceling info banner */}
      {isCanceling && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <p className="font-medium mb-1">{t('settings.cancelingInfo')}</p>
          <p className="text-amber-600">{t('settings.cancelingDesc')}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Actions */}
      {isActive && (
        <button
          onClick={handleManageSubscription}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ExternalLink className="w-4 h-4" />
          )}
          {t('plans.manageSubscription')}
        </button>
      )}

      {(subscriptionStatus === 'none' || subscriptionStatus === 'canceled') && (
        <button
          onClick={handleChoosePlan}
          className="flex items-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors cursor-pointer"
        >
          <CreditCard className="w-4 h-4" />
          {t('plans.choosePlan')}
        </button>
      )}
    </div>
  );
}
