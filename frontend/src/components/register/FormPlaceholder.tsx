'use client';

import { FC } from 'react';
import { useTranslation } from '@/context/LanguageContext';

interface FormPlaceholderProps {
  title: string;
  description?: string;
}

const FormPlaceholder: FC<FormPlaceholderProps> = ({ title, description }) => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-2 text-gray-600">{description}</p>
        )}
      </div>
      
      {/* Mock form fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('register.email')}
          </label>
          <div className="h-12 bg-gray-100 rounded-xl border border-gray-200 animate-pulse" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('register.firstName')}
            </label>
            <div className="h-12 bg-gray-100 rounded-xl border border-gray-200 animate-pulse" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('register.lastName')}
            </label>
            <div className="h-12 bg-gray-100 rounded-xl border border-gray-200 animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('register.password')}
          </label>
          <div className="h-12 bg-gray-100 rounded-xl border border-gray-200 animate-pulse" />
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('register.confirmPassword')}
          </label>
          <div className="h-12 bg-gray-100 rounded-xl border border-gray-200 animate-pulse" />
        </div>
      </div>
      
      <p className="text-center text-sm text-gray-500 italic">
        {t('common.formFieldsComingSoon')}
      </p>
    </div>
  );
};

export default FormPlaceholder;
