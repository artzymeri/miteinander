'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  MapPin, 
  ChevronDown,
  X,
  Globe,
  Building,
  Loader2,
  Star,
  Briefcase,
  CheckCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import CareRecipientLayout from '@/components/dashboard/CareRecipientLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Country list with flags
const COUNTRIES = [
  { code: 'DE', flag: '🇩🇪' },
  { code: 'AT', flag: '🇦🇹' },
  { code: 'CH', flag: '🇨🇭' },
];

// Cities by country
const CITIES_BY_COUNTRY: Record<string, string[]> = {
  'DE': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen'],
  'AT': ['Vienna', 'Graz', 'Linz', 'Salzburg', 'Innsbruck'],
  'CH': ['Zurich', 'Geneva', 'Basel', 'Bern', 'Lausanne'],
};

interface SkillData {
  id: number;
  key: string;
  labelEn: string;
  labelDe: string;
  labelFr: string;
}

interface Caregiver {
  id: number;
  firstName: string;
  lastName: string;
  city: string;
  postalCode: string;
  country: string;
  skills: SkillData[];
  experienceYears: number | null;
  occupation: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  rating: number | null;
  reviewCount: number;
  isVerified: boolean;
  createdAt: string;
}

interface SkillOption {
  id: number;
  key: string;
  labelEn: string;
  labelDe: string;
  labelFr: string;
}

interface FilterOptions {
  countries: string[];
  cities: string[];
  skills: SkillOption[];
}

export default function FindCaregiversPage() {
  const { t, language } = useTranslation();
  const { token } = useAuth();
  const router = useRouter();
  
  // State
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ 
    countries: [], 
    cities: [], 
    skills: [] 
  });
  
  // Dropdowns
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  
  // Refs
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const url = new URL(`${API_URL}/recipient/caregivers/filters`);
      if (selectedCountry) {
        url.searchParams.append('country', selectedCountry);
      }
      
      const response = await fetch(url.toString(), {
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
  
  // Fetch caregivers
  const fetchCaregivers = useCallback(async (pageNum: number = 1, reset: boolean = false) => {
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
      selectedSkills.forEach(id => params.append('skills[]', id.toString()));
      
      const response = await fetch(`${API_URL}/recipient/caregivers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const newCaregivers = data.data.caregivers;
        
        if (reset || pageNum === 1) {
          setCaregivers(newCaregivers);
        } else {
          setCaregivers(prev => [...prev, ...newCaregivers]);
        }
        
        setHasMore(data.data.pagination.hasMore);
        setTotalCount(data.data.pagination.totalCount);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to fetch caregivers:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [token, search, selectedCountry, selectedCity, selectedSkills]);

  // Initial load
  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Fetch caregivers when filters change
  useEffect(() => {
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      fetchCaregivers(1, true);
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, selectedCountry, selectedCity, selectedSkills, fetchCaregivers]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          fetchCaregivers(page + 1);
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
  }, [hasMore, isLoading, isLoadingMore, page, fetchCaregivers]);

  // Helper to get skill label from the resolved skill object
  const getSkillLabel = (skill: SkillData) => {
    switch (language) {
      case 'de':
        return skill.labelDe;
      case 'fr':
        return skill.labelFr;
      default:
        return skill.labelEn;
    }
  };

  // Toggle skill filter
  const toggleSkill = (id: number) => {
    setSelectedSkills(prev => 
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
    setSelectedSkills([]);
  };

  const hasActiveFilters = search || selectedCountry || selectedCity || selectedSkills.length > 0;

  return (
    <CareRecipientLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            {t('recipient.findCaregivers.title') || 'Find Caregivers'}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('recipient.findCaregivers.subtitle') || 'Browse caregivers in your area'}
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
                placeholder={t('recipient.findCaregivers.searchPlaceholder') || 'Search by name, city, or occupation...'}
                className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                showFilters || hasActiveFilters
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>{t('recipient.findCaregivers.filters') || 'Filters'}</span>
              {hasActiveFilters && (
                <span className="ml-1 px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                  {(selectedCountry ? 1 : 0) + (selectedCity ? 1 : 0) + selectedSkills.length}
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
                    {t('recipient.findCaregivers.country') || 'Country'}
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
                          <span className="text-gray-400">{t('recipient.findCaregivers.allCountries') || 'All Countries'}</span>
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
                          <span className="text-gray-900">{t('recipient.findCaregivers.allCountries') || 'All Countries'}</span>
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
                    {t('recipient.findCaregivers.city') || 'City'}
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
                          {selectedCity || (t('recipient.findCaregivers.allCities') || 'All Cities')}
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
                          <span className="text-gray-900">{t('recipient.findCaregivers.allCities') || 'All Cities'}</span>
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
                            {t('recipient.findCaregivers.noCitiesAvailable') || 'No cities available'}
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
                      className="flex items-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      {t('recipient.findCaregivers.clearFilters') || 'Clear Filters'}
                    </button>
                  </div>
                )}
              </div>

              {/* Skills */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('recipient.findCaregivers.skills') || 'Skills & Expertise'}
                </label>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.skills.map(skill => {
                    const label = language === 'de' ? skill.labelDe : language === 'fr' ? skill.labelFr : skill.labelEn;
                    const isSelected = selectedSkills.includes(skill.id);
                    return (
                      <button
                        key={skill.id}
                        onClick={() => toggleSkill(skill.id)}
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
        ) : caregivers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('recipient.findCaregivers.noResults') || 'No caregivers found'}
            </h3>
            <p className="text-gray-500">
              {t('recipient.findCaregivers.tryDifferentFilters') || 'Try adjusting your search filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {caregivers.map((caregiver, index) => (
              <motion.div
                key={caregiver.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => router.push(`/dashboard/caregivers/${caregiver.id}`)}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-amber-200 transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Card Top - Colored accent bar */}
                <div className="h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
                
                <div className="p-5 flex-1">
                  {/* Avatar + Name row */}
                  <div className="flex items-center gap-3.5">
                    {caregiver.profileImageUrl ? (
                      <img
                        src={caregiver.profileImageUrl}
                        alt={`${caregiver.firstName} ${caregiver.lastName}`}
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0 ring-2 ring-gray-100"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm">
                        {caregiver.firstName[0]}{caregiver.lastName[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-semibold text-gray-900 truncate text-[15px]">
                          {caregiver.firstName} {caregiver.lastName}
                        </h3>
                        {caregiver.isVerified && (
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                      {caregiver.occupation && (
                        <p className="text-sm text-gray-500 truncate mt-0.5 flex items-center gap-1">
                          <Briefcase className="w-3.5 h-3.5 flex-shrink-0" />
                          {caregiver.occupation}
                        </p>
                      )}
                      <p className="text-sm text-gray-400 truncate mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        {caregiver.city}{caregiver.postalCode ? `, ${caregiver.postalCode}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Bio preview */}
                  {caregiver.bio && (
                    <p className="mt-3 text-sm text-gray-500 leading-relaxed line-clamp-2">
                      {caregiver.bio}
                    </p>
                  )}

                  {/* Stats row */}
                  <div className="mt-3.5 flex items-center gap-3 flex-wrap">
                    {caregiver.rating !== null && caregiver.rating > 0 && (
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-lg">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-semibold text-amber-700">{Number(caregiver.rating).toFixed(1)}</span>
                        <span className="text-xs text-amber-500">({caregiver.reviewCount})</span>
                      </div>
                    )}
                    {caregiver.experienceYears && caregiver.experienceYears > 0 ? (
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-xs font-medium text-blue-700">
                          {caregiver.experienceYears} {t('recipient.findCaregivers.yearsExp') || 'yrs'}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-gray-50 rounded-lg">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {t('recipient.findCaregivers.noExperience') || 'No experience added'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {caregiver.skills && caregiver.skills.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {caregiver.skills.slice(0, 3).map(skill => (
                        <span
                          key={skill.id}
                          className="px-2.5 py-1 bg-gray-50 text-gray-600 text-xs rounded-lg font-medium"
                        >
                          {getSkillLabel(skill)}
                        </span>
                      ))}
                      {caregiver.skills.length > 3 && (
                        <span className="px-2.5 py-1 bg-gray-50 text-gray-400 text-xs rounded-lg">
                          +{caregiver.skills.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mt-3">
                      <div className="px-3 py-2 bg-gray-100/50 border border-gray-200 rounded-lg text-center">
                        <span className="text-xs text-gray-400 italic">
                          {t('recipient.caregiverProfile.noSkills') || 'No skills added'}
                        </span>
                      </div>
                    </div>
                  )}

                </div>

                {/* Bottom bar - Member since + View Profile */}
                <div className="mt-auto px-5 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <span className="text-[11px] text-gray-400">
                    {t('recipient.findCaregivers.memberSince') || 'Member since'}{' '}
                    {new Date(caregiver.createdAt).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-xs font-medium text-amber-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                    {t('recipient.findCaregivers.viewProfile') || 'View Profile'}
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
        {!hasMore && caregivers.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            {t('recipient.findCaregivers.endOfResults') || 'You\'ve reached the end of the list'}
          </div>
        )}
      </div>
    </CareRecipientLayout>
  );
}
