'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, Crown, ArrowRight, LogOut } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import Logo from '@/components/Logo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function PlansPage() {
  const { t } = useTranslation();
  const { user, token, isAuthenticated, isLoading: authLoading, logout, updateSubscriptionStatus } = useAuth();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // If user already has active subscription, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      const status = user.subscriptionStatus;
      if (status === 'active') {
        if (user.role === 'care_giver') router.push('/caregiver');
        else if (user.role === 'care_recipient') router.push('/dashboard');
      }
    }
  }, [authLoading, user, router]);

  const handleSelectPlan = async () => {
    setError('');
    setIsProcessing(true);

    try {
      const response = await fetch(`${API_URL}/subscription/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: 'yearly' }),
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
      setIsProcessing(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
  }

  const yearlyPrice = 8.99;

  const isNoSub = user.subscriptionStatus === 'none' || user.subscriptionStatus === 'canceled' || user.subscriptionStatus === 'expired';
  const isRecipientNoSub = user.role === 'care_recipient' && user.subscriptionStatus === 'none';

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Logo mainStroke="orangered" accentStroke="orangered" width={48} height={40} className="w-10 h-8 sm:w-12 sm:h-10" />
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              {t('admin.logout')}
            </button>
          </div>
        </div>
      </header>

      <div className="pt-28 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Title section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-full text-sm font-medium mb-6">
              <Crown className="w-4 h-4" />
              {t('plans.subscriptionRequired')}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {t('plans.title')}
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {isRecipientNoSub 
                ? t('plans.recipientDesc')
                : t('plans.noSubscriptionDesc')
              }
            </p>
          </motion.div>

          {/* Plan card - Yearly only */}
          <div className="max-w-md mx-auto mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative rounded-2xl p-6 sm:p-8 bg-white ring-2 ring-amber-500 shadow-xl shadow-amber-500/10"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{t('plans.yearly')}</h3>
              </div>

              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">€8,99</span>
                <span className="text-gray-500 ml-1">/{t('plans.perYear')}</span>
              </div>

              <ul className="space-y-3">
                {['feature1', 'feature2', 'feature3', 'feature4'].map((key) => (
                  <li key={key} className="flex items-center gap-3 text-sm text-gray-600">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    {t(`plans.${key}`)}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 max-w-md mx-auto p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center"
            >
              {error}
            </motion.div>
          )}

          {/* CTA Button */}
          <div className="text-center">
            <motion.button
              onClick={handleSelectPlan}
              disabled={isProcessing}
              className={`
                inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-white text-lg
                transition-all duration-200
                ${isProcessing
                  ? 'bg-amber-400 cursor-not-allowed opacity-60'
                  : 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30 cursor-pointer'
                }
              `}
              whileHover={!isProcessing ? { scale: 1.02 } : {}}
              whileTap={!isProcessing ? { scale: 0.98 } : {}}
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('plans.processing')}
                </>
              ) : (
                <>
                  {t('plans.subscribe')}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>

            <p className="mt-4 text-xs text-gray-400">
              {t('plans.securePayment')}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
