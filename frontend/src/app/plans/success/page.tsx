'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function SuccessContent() {
  const { t } = useTranslation();
  const { user, token, isAuthenticated, isLoading: authLoading, updateSubscriptionStatus } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    const sessionId = searchParams.get('session_id');
    if (!sessionId || !token) {
      setVerifying(false);
      return;
    }

    const verifySession = async () => {
      try {
        const response = await fetch(`${API_URL}/subscription/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (data.success) {
          setVerified(true);
          updateSubscriptionStatus('active');
        }
      } catch (error) {
        console.error('Failed to verify session:', error);
      } finally {
        setVerifying(false);
      }
    };

    verifySession();
  }, [authLoading, isAuthenticated, token, searchParams, router, updateSubscriptionStatus]);

  const handleGoToDashboard = () => {
    if (user?.role === 'care_giver') {
      router.push('/caregiver');
    } else {
      router.push('/dashboard');
    }
  };

  if (authLoading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4" />
          <p className="text-gray-600">{t('plans.verifying')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-3xl shadow-xl p-8 sm:p-12 max-w-md w-full text-center"
      >
        {verified ? (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {t('plans.successTitle')}
            </h1>
            <p className="text-gray-600 mb-8">
              {t('plans.successDesc')}
            </p>
            <motion.button
              onClick={handleGoToDashboard}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-amber-500/30 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('plans.goToDashboard')}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">
              {t('plans.pendingTitle')}
            </h1>
            <p className="text-gray-600 mb-8">
              {t('plans.pendingDesc')}
            </p>
            <motion.button
              onClick={handleGoToDashboard}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-amber-500/30 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('plans.goToDashboard')}
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function PlansSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
