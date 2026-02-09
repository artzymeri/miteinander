'use client';

import { FC } from 'react';
import { Phone, User, Check } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useCareNeedsPublic } from '@/hooks/usePublicApi';

interface CareRecipientDetailsFormProps {
  careNeeds: string[];
  emergencyContactName: string;
  emergencyContactPhone: string;
  onChange: (updates: { careNeeds?: string[]; emergencyContactName?: string; emergencyContactPhone?: string }) => void;
}

const CareRecipientDetailsForm: FC<CareRecipientDetailsFormProps> = ({ 
  careNeeds, 
  emergencyContactName, 
  emergencyContactPhone, 
  onChange 
}) => {
  const { t, language } = useTranslation();
  const { data: careNeedOptions = [], isLoading } = useCareNeedsPublic();

  const toggleCareNeed = (key: string) => {
    if (careNeeds.includes(key)) {
      onChange({ careNeeds: careNeeds.filter(n => n !== key) });
    } else {
      onChange({ careNeeds: [...careNeeds, key] });
    }
  };

  const getLabelByLanguage = (item: { labelEn: string; labelDe: string; labelFr: string }) => {
    switch (language) {
      case 'de':
        return item.labelDe;
      case 'fr':
        return item.labelFr;
      default:
        return item.labelEn;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('register.detailsTitle')}</h2>
        <p className="mt-2 text-gray-600">{t('register.fillDetailsFields')}</p>
      </div>

      <div className="space-y-4">
        {/* Care Needs */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('register.careNeeds')} *
          </label>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {careNeedOptions.map((need) => (
                <button
                  key={need.key}
                  type="button"
                  onClick={() => toggleCareNeed(need.key)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    careNeeds.includes(need.key)
                      ? 'border-amber-500 bg-amber-50 text-amber-800'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                    careNeeds.includes(need.key) ? 'bg-amber-500' : 'border border-gray-300'
                  }`}>
                    {careNeeds.includes(need.key) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm">{getLabelByLanguage(need)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Emergency Contact */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
          <h3 className="text-sm font-semibold text-amber-800 mb-4">{t('register.emergencyContact')}</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">
                {t('register.emergencyContactName')}
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="emergencyContactName"
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => onChange({ emergencyContactName: e.target.value })}
                  placeholder="Max Mustermann"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700">
                {t('register.emergencyContactPhone')}
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="emergencyContactPhone"
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(e) => onChange({ emergencyContactPhone: e.target.value })}
                  placeholder="+49 123 456789"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareRecipientDetailsForm;
