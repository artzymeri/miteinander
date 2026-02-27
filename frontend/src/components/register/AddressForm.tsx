'use client';

import { FC, useState, useMemo } from 'react';
import { MapPin, Building, Hash, Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

interface AddressFormProps {
  address: string;
  city: string;
  postalCode: string;
  country: string;
  onChange: (updates: { address?: string; city?: string; postalCode?: string; country?: string }) => void;
}

const COUNTRIES = [
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
];

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  DE: ['Berlin', 'München', 'Hamburg', 'Köln', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen'],
  AT: ['Wien', 'Graz', 'Linz', 'Salzburg', 'Innsbruck', 'Klagenfurt', 'Villach', 'Wels', 'Sankt Pölten'],
  CH: ['Zürich', 'Genf', 'Basel', 'Bern', 'Lausanne', 'Winterthur', 'Luzern', 'St. Gallen', 'Lugano'],
  LI: ['Vaduz', 'Schaan', 'Balzers', 'Triesen', 'Eschen', 'Mauren', 'Triesenberg', 'Ruggell', 'Gamprin', 'Schellenberg', 'Planken'],
  SE: ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Linköping', 'Örebro', 'Västerås', 'Helsingborg', 'Norrköping', 'Jönköping'],
  NL: ['Amsterdam', 'Rotterdam', 'Den Haag', 'Utrecht', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda'],
  GB: ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Bristol', 'Sheffield', 'Leeds', 'Edinburgh'],
  LU: ['Luxembourg City', 'Esch-sur-Alzette', 'Differdange', 'Dudelange', 'Ettelbruck', 'Diekirch', 'Wiltz'],
  BE: ['Brüssel', 'Antwerpen', 'Gent', 'Charleroi', 'Lüttich', 'Brügge', 'Namur', 'Löwen', 'Mons'],
  FR: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
};

const AddressForm: FC<AddressFormProps> = ({ address, city, postalCode, country, onChange }) => {
  const { t } = useTranslation();
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  
  const selectedCountry = country ? COUNTRIES.find(c => c.code === country) : null;
  const availableCities = useMemo(() => country ? (CITIES_BY_COUNTRY[country] || []) : [], [country]);

  const handleCountryChange = (countryCode: string) => {
    onChange({ country: countryCode, city: '' }); // Reset city when country changes
    setIsCountryDropdownOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('register.addressDataTitle')}</h2>
        <p className="mt-2 text-gray-600">{t('register.fillAddressFields')}</p>
      </div>

      <div className="space-y-4">
        {/* Country Select */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {t('register.country')} *
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-400" />
                {selectedCountry ? (
                  <>
                    <span className="text-lg">{selectedCountry.flag}</span>
                    <span className="text-gray-900">{t(`register.countries.${selectedCountry.code}`)}</span>
                  </>
                ) : (
                  <span className="text-gray-400">{t('register.selectCountry')}</span>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isCountryDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden max-h-60 overflow-y-auto">
                {COUNTRIES.map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountryChange(c.code)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-left cursor-pointer transition-colors ${
                      c.code === country ? 'bg-amber-50' : ''
                    }`}
                  >
                    <span className="text-lg">{c.flag}</span>
                    <span className="text-gray-900">{t(`register.countries.${c.code}`)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="space-y-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            {t('register.address')} *
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => onChange({ address: e.target.value })}
              placeholder="Musterstraße 123"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>
        </div>

        {/* City & Postal Code */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
              {t('register.postalCode')} *
            </label>
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="postalCode"
                type="text"
                value={postalCode}
                onChange={(e) => onChange({ postalCode: e.target.value })}
                placeholder="10115"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>
          </div>

          {/* City Select */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {t('register.city')} *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <span className={city ? 'text-gray-900' : 'text-gray-400'}>
                    {city || t('register.selectCity')}
                  </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isCityDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden max-h-48 overflow-y-auto">
                  {availableCities.length > 0 ? (
                    availableCities.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          onChange({ city: c });
                          setIsCityDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 hover:bg-amber-50 text-left cursor-pointer transition-colors ${
                          c === city ? 'bg-amber-50' : ''
                        }`}
                      >
                        <span className="text-gray-900">{c}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-sm">
                      {t('register.selectCountryFirst')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressForm;
