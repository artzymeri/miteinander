'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useTranslation } from '@/context/LanguageContext';

export default function GetStartedSection() {
  const { t } = useTranslation();
  
  return (
    <section id="get-started" className="py-24 bg-gradient-to-br from-amber-50 via-white to-orange-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-10 left-10 w-72 h-72 bg-amber-200 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-orange-200 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary mb-4">
            {t("getStarted.title")}
          </h2>
          <p className="text-lg text-primary/70 max-w-2xl mx-auto">
            {t("getStarted.subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* New Users Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border border-gray-100"
          >
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" 
                />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-primary mb-3">
              {t("getStarted.newUser")}
            </h3>
            <p className="text-primary/70 mb-6">
              {t("getStarted.newUserDesc")}
            </p>
            
            <Link href="/registrieren">
              <motion.button
                className="w-full bg-amber-500 text-white py-4 px-6 rounded-xl font-semibold hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {t("getStarted.registerBtn")}
              </motion.button>
            </Link>
            
            <p className="text-xs text-center text-primary/50 mt-4">
              {t("getStarted.noCreditCard")}
            </p>
          </motion.div>

          {/* Existing Users Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 border border-gray-100"
          >
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" 
                />
              </svg>
            </div>
            
            <h3 className="text-2xl font-bold text-primary mb-3">
              {t("getStarted.existingUser")}
            </h3>
            <p className="text-primary/70 mb-6">
              {t("getStarted.existingUserDesc")}
            </p>
            
            <Link href="/login">
              <motion.button
                className="w-full bg-white border-2 border-amber-500 text-amber-600 py-4 px-6 rounded-xl font-semibold hover:bg-amber-50 transition-colors"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {t("getStarted.loginBtn")}
              </motion.button>
            </Link>
            
            <p className="text-xs text-center text-primary/50 mt-4">
              <a href="/forgot-password" className="hover:text-amber-600 transition-colors">
                {t("getStarted.forgotPassword")}
              </a>
            </p>
          </motion.div>
        </div>

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-primary/60">
            {t("getStarted.questions")}{' '}
            <a href="#footer" className="text-amber-600 hover:text-amber-700 font-medium">
              {t("getStarted.contactUs")}
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
