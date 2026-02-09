'use client';

import { FC } from 'react';
import { FileText, Award, Clock, Briefcase, Check } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useCareNeedsPublic } from '@/hooks/usePublicApi';

interface CareGiverDetailsFormProps {
  bio: string;
  skills: string[];
  certifications: string;
  occupation: string;
  experienceYears: string;
  onChange: (updates: { bio?: string; skills?: string[]; certifications?: string; occupation?: string; experienceYears?: string }) => void;
}

const CareGiverDetailsForm: FC<CareGiverDetailsFormProps> = ({ 
  bio, 
  skills, 
  certifications, 
  occupation,
  experienceYears, 
  onChange 
}) => {
  const { t, language } = useTranslation();
  const { data: skillOptions = [], isLoading } = useCareNeedsPublic();

  const toggleSkill = (key: string) => {
    if (skills.includes(key)) {
      onChange({ skills: skills.filter(s => s !== key) });
    } else {
      onChange({ skills: [...skills, key] });
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
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('register.caregiverDataTitle')}</h2>
        <p className="mt-2 text-gray-600">{t('register.fillDetailsFields')}</p>
      </div>

      <div className="space-y-4">
        {/* Bio */}
        <div className="space-y-2">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
            {t('register.bio')} *
          </label>
          <div className="relative">
            <FileText className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => onChange({ bio: e.target.value })}
              placeholder={t('register.bioPlaceholder')}
              rows={3}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400 resize-none"
              required
            />
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('register.skills')}
          </label>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {skillOptions.map((skill) => (
                <button
                  key={skill.key}
                  type="button"
                  onClick={() => toggleSkill(skill.key)}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    skills.includes(skill.key)
                      ? 'border-amber-500 bg-amber-50 text-amber-800'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                    skills.includes(skill.key) ? 'bg-amber-500' : 'border border-gray-300'
                  }`}>
                    {skills.includes(skill.key) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm">{getLabelByLanguage(skill)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Certifications */}
        <div className="space-y-2">
          <label htmlFor="certifications" className="block text-sm font-medium text-gray-700">
            {t('register.certifications')}
          </label>
          <div className="relative">
            <Award className="absolute left-4 top-4 text-gray-400 w-5 h-5" />
            <textarea
              id="certifications"
              value={certifications}
              onChange={(e) => onChange({ certifications: e.target.value })}
              placeholder={t('register.certificationsPlaceholder')}
              rows={2}
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400 resize-none"
            />
          </div>
        </div>

        {/* Occupation & Experience */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">
              {t('register.occupation')}
            </label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="occupation"
                type="text"
                value={occupation}
                onChange={(e) => onChange({ occupation: e.target.value })}
                placeholder={t('register.occupationPlaceholder')}
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="experienceYears" className="block text-sm font-medium text-gray-700">
              {t('register.experienceYears')}
            </label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="experienceYears"
                type="number"
                min="0"
                max="50"
                value={experienceYears}
                onChange={(e) => onChange({ experienceYears: e.target.value })}
                placeholder="5"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareGiverDetailsForm;
