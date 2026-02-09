'use client';

import { FC } from 'react';
import { Check } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useCareNeedsPublic } from '@/hooks/usePublicApi';

interface CareNeedsFormProps {
  careNeeds: string[];
  onChange: (updates: { careNeeds: string[] }) => void;
}

const CareNeedsForm: FC<CareNeedsFormProps> = ({ careNeeds, onChange }) => {
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
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('register.careNeedsTitle')}</h2>
        <p className="mt-2 text-gray-600">{t('register.careNeedsSubtitle')}</p>
      </div>

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
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left cursor-pointer ${
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
    </div>
  );
};

export default CareNeedsForm;
