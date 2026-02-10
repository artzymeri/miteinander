'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import CareGiverLayout from '@/components/caregiver/CareGiverLayout';
import {
  Search,
  MapPin,
  Filter,
  ChevronDown,
  X,
  Loader2,
  User,
  Heart,
  Globe,
  Building,
  ArrowRight,
} from 'lucide-react';

const COUNTRIES = [
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
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
  NL: ['Amsterdam', 'Rotterdam', 'Den Haag', 'Utrecht', 'Eindhoven', 'Groningen', 'Tilburg', 'Almere', 'Breda'],
  GB: ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Bristol', 'Sheffield', 'Leeds', 'Edinburgh'],
  LU: ['Luxembourg City', 'Esch-sur-Alzette', 'Differdange', 'Dudelange', 'Ettelbruck', 'Diekirch', 'Wiltz'],
  BE: ['Brüssel', 'Antwerpen', 'Gent', 'Charleroi', 'Lüttich', 'Brügge', 'Namur', 'Löwen', 'Mons'],
  FR: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
};

interface CareNeedData {
  id: number;
  key: string;
  labelEn: string;
  labelDe: string;
  labelFr: string;
}

interface Client {
  id: number;
  firstName: string;
  lastName: string;
  city: string;
  postalCode: string;
  country: string;
  careNeeds: CareNeedData[];
  bio: string | null;
  profileImageUrl: string | null;
  createdAt: string;
}

interface CareNeedOption {
  id: number;
  key: string;
  labelEn: string;
  labelDe: string;
  labelFr: string;
}

interface FilterOptions {
  countries: string[];
  cities: string[];
  careNeeds: CareNeedOption[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function FindClientsPage() {
  const { token } = useAuth();
  const { t, language } = useTranslation();
  const router = useRouter();
  
  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCareNeeds, setSelectedCareNeeds] = useState<number[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    countries: [],
    cities: [],
    careNeeds: [],
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  
  // Refs
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCountry) params.append('country', selectedCountry);
      
      const response = await fetch(`${API_URL}/caregiver/clients/filters?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
    }
  }, [token, selectedCountry]);

  // Fetch clients
  const fetchClients = useCallback(async (pageNum: number, reset = false) => {
    if (!token) return;
    
    try {
      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      const params = new URLSearchParams();
      params.append('page', pageNum.toString());
      params.append('limit', '20');
      
      if (search) params.append('search', search);
      if (selectedCountry) params.append('country', selectedCountry);
      if (selectedCity) params.append('city', selectedCity);
      selectedCareNeeds.forEach(id => params.append('careNeeds[]', id.toString()));
      
      const response = await fetch(`${API_URL}/caregiver/clients?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const newClients = data.data.clients;
        
        if (reset || pageNum === 1) {
          setClients(newClients);
        } else {
          setClients(prev => [...prev, ...newClients]);
        }
        
        setHasMore(data.data.pagination.hasMore);
        setTotalCount(data.data.pagination.totalCount);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [token, search, selectedCountry, selectedCity, selectedCareNeeds]);

  // Initial load
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Fetch clients when filters change
  useEffect(() => {
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchClients(1, true);
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, selectedCountry, selectedCity, selectedCareNeeds, fetchClients]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          fetchClients(page + 1);
        }
      },
      { threshold: 0.1 }
    );
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, isLoadingMore, page, fetchClients]);

  // Helper to get care need label from the resolved care need object
  const getCareNeedLabel = (careNeed: CareNeedData) => {
    switch (language) {
      case 'de':
        return careNeed.labelDe;
      case 'fr':
        return careNeed.labelFr;
      default:
        return careNeed.labelEn;
    }
  };

  // Toggle care need filter
  const toggleCareNeed = (id: number) => {
    setSelectedCareNeeds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSearch('');
    setSelectedCountry('');
    setSelectedCity('');
    setSelectedCareNeeds([]);
  };

  const hasActiveFilters = search || selectedCountry || selectedCity || selectedCareNeeds.length > 0;

  return (
    <CareGiverLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            {t('caregiver.findClients.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('caregiver.findClients.subtitle')}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 lg:p-6">
          {/* Search Bar */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('caregiver.findClients.searchPlaceholder')}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                showFilters || hasActiveFilters
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>{t('caregiver.findClients.filters')}</span>
              {hasActiveFilters && (
                <span className="ml-1 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                  {(selectedCountry ? 1 : 0) + (selectedCity ? 1 : 0) + selectedCareNeeds.length}
                </span>
              )}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-gray-100"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('caregiver.findClients.country')}
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCountryDropdownOpen(!isCountryDropdownOpen);
                        setIsCityDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Globe className="w-5 h-5 text-gray-400" />
                        {selectedCountry ? (
                          <>
                            <span className="text-lg">{COUNTRIES.find(c => c.code === selectedCountry)?.flag}</span>
                            <span className="text-gray-900">{t(`register.countries.${selectedCountry}`)}</span>
                          </>
                        ) : (
                          <span className="text-gray-400">{t('caregiver.findClients.allCountries')}</span>
                        )}
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isCountryDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden max-h-60 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCountry('');
                            setSelectedCity('');
                            setIsCountryDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-left cursor-pointer transition-colors ${
                            !selectedCountry ? 'bg-amber-50' : ''
                          }`}
                        >
                          <Globe className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-900">{t('caregiver.findClients.allCountries')}</span>
                        </button>
                        {COUNTRIES.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(c.code);
                              setSelectedCity('');
                              setIsCountryDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-left cursor-pointer transition-colors ${
                              c.code === selectedCountry ? 'bg-amber-50' : ''
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

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('caregiver.findClients.city')}
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCityDropdownOpen(!isCityDropdownOpen);
                        setIsCountryDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-gray-400" />
                        <span className={selectedCity ? 'text-gray-900' : 'text-gray-400'}>
                          {selectedCity || t('caregiver.findClients.allCities')}
                        </span>
                      </div>
                      <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isCityDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {isCityDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden max-h-60 overflow-y-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCity('');
                            setIsCityDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-amber-50 text-left cursor-pointer transition-colors ${
                            !selectedCity ? 'bg-amber-50' : ''
                          }`}
                        >
                          <Building className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-900">{t('caregiver.findClients.allCities')}</span>
                        </button>
                        {(selectedCountry ? CITIES_BY_COUNTRY[selectedCountry] || [] : filterOptions.cities).map((city) => (
                          <button
                            key={city}
                            type="button"
                            onClick={() => {
                              setSelectedCity(city);
                              setIsCityDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 hover:bg-amber-50 text-left cursor-pointer transition-colors ${
                              city === selectedCity ? 'bg-amber-50' : ''
                            }`}
                          >
                            <span className="text-gray-900">{city}</span>
                          </button>
                        ))}
                        {selectedCountry && (!CITIES_BY_COUNTRY[selectedCountry] || CITIES_BY_COUNTRY[selectedCountry].length === 0) && (
                          <div className="px-4 py-3 text-gray-500 text-sm">
                            {t('caregiver.findClients.noCitiesAvailable')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="flex items-end">
                    <button
                      onClick={clearFilters}
                      className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <X className="w-4 h-4" />
                      {t('caregiver.findClients.clearFilters')}
                    </button>
                  </div>
                )}
              </div>

              {/* Care Needs */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('caregiver.findClients.careNeeds')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.careNeeds.map(careNeed => {
                    const label = language === 'de' ? careNeed.labelDe : language === 'fr' ? careNeed.labelFr : careNeed.labelEn;
                    const isSelected = selectedCareNeeds.includes(careNeed.id);
                    return (
                      <button
                        key={careNeed.id}
                        onClick={() => toggleCareNeed(careNeed.id)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('caregiver.findClients.noResults')}
            </h3>
            <p className="text-gray-500">
              {t('caregiver.findClients.tryDifferentFilters')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/caregiver/clients/${client.id}`)}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-amber-200 transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Card Top - Colored accent bar */}
                <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
                
                <div className="p-5 flex-1">
                  {/* Avatar + Name row */}
                  <div className="flex items-center gap-3.5">
                    {client.profileImageUrl ? (
                      <img
                        src={client.profileImageUrl}
                        alt={`${client.firstName} ${client.lastName}`}
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0 ring-2 ring-gray-100"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm">
                        {client.firstName[0]}{client.lastName[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate text-[15px]">
                        {client.firstName} {client.lastName}
                      </h3>
                      <p className="text-sm text-gray-400 truncate mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        {client.city}{client.postalCode ? `, ${client.postalCode}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Bio preview */}
                  {client.bio ? (
                    <p className="mt-3 text-sm text-gray-500 leading-relaxed line-clamp-2">
                      {client.bio}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm text-gray-400 italic">
                      {t('caregiver.findClients.noBio') || 'No description provided yet'}
                    </p>
                  )}

                  {/* Care Needs */}
                  {client.careNeeds && client.careNeeds.length > 0 ? (
                    <div className="mt-3.5">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        {t('caregiver.findClients.lookingFor') || 'Looking for help with'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {client.careNeeds.slice(0, 3).map(need => (
                          <span
                            key={need.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs rounded-lg font-medium"
                          >
                            <Heart className="w-3 h-3" />
                            {getCareNeedLabel(need)}
                          </span>
                        ))}
                        {client.careNeeds.length > 3 && (
                          <span className="px-2.5 py-1 bg-gray-50 text-gray-400 text-xs rounded-lg">
                            +{client.careNeeds.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3.5">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                        {t('caregiver.findClients.lookingFor') || 'Looking for help with'}
                      </p>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-50 text-gray-400 text-xs rounded-lg">
                        {t('caregiver.findClients.notSpecified') || 'Not specified yet'}
                      </span>
                    </div>
                  )}

                </div>

                {/* Bottom bar - Member since + View Profile */}
                <div className="mt-auto px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <span className="text-[11px] text-gray-400">
                    {t('caregiver.findClients.memberSince') || 'Member since'}{' '}
                    {new Date(client.createdAt).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-xs font-medium text-amber-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                    {t('caregiver.findClients.viewProfile') || 'View Profile'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Load more trigger */}
        {hasMore && !isLoading && (
          <div ref={loadMoreRef} className="flex justify-center py-8">
            {isLoadingMore && (
              <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
            )}
          </div>
        )}

        {/* End of results */}
        {!hasMore && clients.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            {t('caregiver.findClients.endOfResults')}
          </div>
        )}
      </div>
    </CareGiverLayout>
  );
}
