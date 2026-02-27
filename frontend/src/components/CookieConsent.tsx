'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import { Cookie, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

const CONSENT_KEY = 'myhelper_cookie_consent';

interface ConsentState {
  necessary: boolean; // always true
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

export default function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (consent: ConsentState) => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
    setVisible(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
      timestamp: new Date().toISOString(),
    });
  };

  const handleAcceptSelected = () => {
    saveConsent({
      necessary: true,
      analytics,
      marketing,
      timestamp: new Date().toISOString(),
    });
  };

  const handleRejectAll = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
    });
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-end sm:justify-center pointer-events-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/20 pointer-events-auto"
        />

        {/* Banner */}
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="relative w-full max-w-2xl mx-4 mb-4 sm:mb-6 pointer-events-auto"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-amber-100 rounded-xl">
                  <Cookie className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('cookie.title')}
                </h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('cookie.description')}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {t('cookie.legalBasis')}{' '}
                <Link href="/datenschutz" className="text-amber-600 hover:underline">
                  {t('cookie.privacyLink')}
                </Link>
              </p>
            </div>

            {/* Details toggle */}
            <div className="px-6">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
              >
                <Shield className="w-4 h-4" />
                {t('cookie.details')}
                {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <AnimatePresence>
                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 space-y-3">
                      {/* Necessary cookies - always on */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{t('cookie.necessary')}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{t('cookie.necessaryDesc')}</p>
                        </div>
                        <div className="ml-4">
                          <div className="w-10 h-6 bg-amber-500 rounded-full relative cursor-not-allowed">
                            <div className="absolute right-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow" />
                          </div>
                        </div>
                      </div>

                      {/* Analytics cookies */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{t('cookie.analytics')}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{t('cookie.analyticsDesc')}</p>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => setAnalytics(!analytics)}
                            className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${
                              analytics ? 'bg-amber-500' : 'bg-gray-300'
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                analytics ? 'right-0.5' : 'left-0.5'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Marketing cookies */}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{t('cookie.marketing')}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{t('cookie.marketingDesc')}</p>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => setMarketing(!marketing)}
                            className={`w-10 h-6 rounded-full relative transition-colors cursor-pointer ${
                              marketing ? 'bg-amber-500' : 'bg-gray-300'
                            }`}
                          >
                            <div
                              className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                                marketing ? 'right-0.5' : 'left-0.5'
                              }`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 mt-2 flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleRejectAll}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                {t('cookie.rejectAll')}
              </button>
              {showDetails && (
                <button
                  onClick={handleAcceptSelected}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer"
                >
                  {t('cookie.acceptSelected')}
                </button>
              )}
              <button
                onClick={handleAcceptAll}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors cursor-pointer"
              >
                {t('cookie.acceptAll')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
