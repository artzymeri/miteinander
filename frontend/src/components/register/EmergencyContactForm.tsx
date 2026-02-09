'use client';

import { FC, useState } from 'react';
import { Phone, User, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

interface EmergencyContactFormProps {
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactPhoneCountryCode: string;
  onChange: (updates: { 
    emergencyContactName?: string; 
    emergencyContactPhone?: string; 
    emergencyContactPhoneCountryCode?: string;
  }) => void;
}

const COUNTRY_CODES = [
  { code: '+49', country: 'DE', flag: '🇩🇪' },
  { code: '+43', country: 'AT', flag: '🇦🇹' },
  { code: '+41', country: 'CH', flag: '🇨🇭' },
  { code: '+31', country: 'NL', flag: '🇳🇱' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+352', country: 'LU', flag: '🇱🇺' },
  { code: '+32', country: 'BE', flag: '🇧🇪' },
  { code: '+33', country: 'FR', flag: '🇫🇷' },
];

const EmergencyContactForm: FC<EmergencyContactFormProps> = ({ 
  emergencyContactName, 
  emergencyContactPhone,
  emergencyContactPhoneCountryCode,
  onChange 
}) => {
  const { t } = useTranslation();
  const [isCodeDropdownOpen, setIsCodeDropdownOpen] = useState(false);
  
  const selectedCountry = COUNTRY_CODES.find(c => c.code === emergencyContactPhoneCountryCode) || COUNTRY_CODES[0];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('register.emergencyContactTitle')}</h2>
        <p className="mt-2 text-gray-600">{t('register.emergencyContactSubtitle')}</p>
      </div>

      <div className="space-y-4">
        {/* Emergency Contact Name */}
        <div className="space-y-2">
          <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">
            {t('register.emergencyContactName')} *
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="emergencyContactName"
              type="text"
              value={emergencyContactName}
              onChange={(e) => onChange({ emergencyContactName: e.target.value })}
              placeholder="Max Mustermann"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>
        </div>

        {/* Emergency Contact Phone with Country Code */}
        <div className="space-y-2">
          <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700">
            {t('register.emergencyContactPhone')} *
          </label>
          <div className="flex gap-2">
            {/* Country Code Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCodeDropdownOpen(!isCodeDropdownOpen)}
                className="flex items-center gap-2 px-3 py-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all cursor-pointer"
              >
                <span className="text-lg">{selectedCountry.flag}</span>
                <span className="text-sm text-gray-700">{selectedCountry.code}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
              
              {isCodeDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setIsCodeDropdownOpen(false)} 
                  />
                  <div className="absolute top-full left-0 mt-1 w-32 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
                    {COUNTRY_CODES.map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => {
                          onChange({ emergencyContactPhoneCountryCode: country.code });
                          setIsCodeDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-amber-50 text-left cursor-pointer transition-colors"
                      >
                        <span className="text-lg">{country.flag}</span>
                        <span className="text-sm text-gray-700">{country.code}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            {/* Phone Input */}
            <div className="relative flex-1">
              <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="emergencyContactPhone"
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => onChange({ emergencyContactPhone: e.target.value })}
                placeholder="123 456789"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>
          </div>
        </div>

        {/* Info box */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
          <p className="text-sm text-amber-800">
            {t('register.emergencyContactInfo')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyContactForm;
