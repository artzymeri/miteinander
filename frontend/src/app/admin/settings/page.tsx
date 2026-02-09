'use client';

import { motion } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import AdminLayout from '@/components/admin/AdminLayout';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { Globe } from 'lucide-react';

export default function AdminSettingsPage() {
  const { t } = useTranslation();

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 rounded-xl">
              <Globe className="text-amber-600" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
              <p className="text-gray-500">{t('settings.subtitle')}</p>
            </div>
          </div>
        </motion.div>

        {/* Language Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8"
        >
          <div className="max-w-md space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {t('settings.language')}
              </h3>
              <p className="text-gray-600">
                {t('settings.languageDesc')}
              </p>
            </div>

            <div className="pt-2">
              <LanguageSwitcher direction="down" fullWidth />
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
