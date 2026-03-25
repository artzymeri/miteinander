'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import CareGiverLayout from '@/components/caregiver/CareGiverLayout';
import {
  Users,
  Star,
  TrendingUp,
  MessageSquare,
  Search,
  User,
  ArrowRight,
  MapPin,
  Briefcase,
  Award,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface SkillData {
  id: number;
  key: string;
  labelEn: string;
  labelDe: string;
  labelFr: string;
}

interface ProfileData {
  id: number;
  firstName: string;
  lastName: string;
  postalCode: string | null;
  bio: string | null;
  skills: SkillData[];
  certifications: string[];
  experienceYears: number | null;
  occupation: string | null;
  profileImageUrl: string | null;
  memberSince: string;
}

export default function CareGiverDashboard() {
  const { user, token } = useAuth();
  const { t, language } = useTranslation();
  const router = useRouter();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/caregiver/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfile(data.data.profile);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) {
      fetchProfile();
    }
  }, [token]);

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

  // Calculate profile completion percentage and missing items
  const calculateProfileCompletion = () => {
    if (!profile) return { percentage: 0, missingItems: [], completedItems: [] };
    
    const fields = [
      { key: 'name', check: !!(profile.firstName && profile.lastName), label: t('caregiver.profileFields.name') || 'Full Name' },
      { key: 'postalCode', check: !!profile.postalCode, label: t('caregiver.profileFields.postalCode') || 'Postal Code' },
      { key: 'bio', check: !!profile.bio, label: t('caregiver.profileFields.bio') || 'Bio / Description' },
      { key: 'skills', check: !!(profile.skills && profile.skills.length > 0), label: t('caregiver.profileFields.skills') || 'Skills' },
      { key: 'certifications', check: !!(profile.certifications && profile.certifications.length > 0), label: t('caregiver.profileFields.certifications') || 'Certifications' },
      { key: 'experience', check: !!profile.experienceYears, label: t('caregiver.profileFields.experience') || 'Experience Years' },
      { key: 'profileImage', check: !!profile.profileImageUrl, label: t('caregiver.profileFields.profileImage') || 'Profile Photo' },
    ];

    const completedItems = fields.filter(f => f.check);
    const missingItems = fields.filter(f => !f.check);
    const percentage = Math.round((completedItems.length / fields.length) * 100);

    return { percentage, missingItems, completedItems };
  };

  const { percentage: profileCompletion, missingItems, completedItems } = calculateProfileCompletion();

  const stats = [
    {
      label: t('caregiver.stats.skills') || 'Skills',
      value: profile?.skills?.length || 0,
      icon: Award,
      color: 'bg-blue-500',
      trend: t('caregiver.stats.expertise') || 'Expertise areas',
    },
    {
      label: t('caregiver.stats.experience') || 'Experience',
      value: profile?.experienceYears ? `${profile.experienceYears} ${profile.experienceYears === 1 ? 'year' : 'years'}` : '-',
      icon: TrendingUp,
      color: 'bg-green-500',
      trend: t('caregiver.stats.yearsOfCare') || 'Years of care',
    },
    {
      label: t('caregiver.stats.certifications') || 'Certifications',
      value: profile?.certifications?.length || 0,
      icon: Star,
      color: 'bg-yellow-500',
      trend: t('caregiver.stats.credentials') || 'Credentials',
    },
  ];

  if (isLoading) {
    return (
      <CareGiverLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      </CareGiverLayout>
    );
  }

  return (
    <CareGiverLayout>
      <div className="space-y-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-6 lg:p-8 text-white"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {profile?.profileImageUrl ? (
              <img
                src={profile.profileImageUrl}
                alt={`${profile.firstName} ${profile.lastName}`}
                className="w-16 h-16 rounded-full object-cover border-3 border-white/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
            )}
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1">
                {t('caregiver.welcome') || 'Welcome'}, {user?.firstName}! 👋
              </h1>
              <p className="text-amber-100">
                {t('caregiver.welcomeMessage') || 'Here\'s an overview of your caregiver profile'}
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-amber-100">
                {profile?.postalCode && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.postalCode}</span>
                  </div>
                )}
                {profile?.occupation && (
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-4 h-4" />
                    <span>{profile.occupation}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Find Clients CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-xl">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('caregiver.findClientsNow')}</h3>
                <p className="text-sm text-gray-600">{t('caregiver.findClientsNowDesc')}</p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/caregiver/find-clients')}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors cursor-pointer"
            >
              {t('caregiver.browseClients') || 'Browse Clients'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
                <p className="text-xs text-gray-400">{stat.trend}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Profile Completion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('caregiver.yourProfile') || 'Your Profile'}
                </h2>
                <User className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {profile?.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt="Profile"
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-semibold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{profile?.firstName} {profile?.lastName}</h3>
                  <p className="text-sm text-gray-500">{profile?.occupation || t('caregiver.role') || 'Caregiver'}</p>
                </div>
              </div>
              
              {/* Skills preview */}
              {profile?.skills && profile.skills.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1.5">
                    {profile.skills.slice(0, 4).map(skill => (
                      <span
                        key={skill.id}
                        className="px-2 py-1 bg-amber-50 text-amber-700 rounded-full text-xs"
                      >
                        {getSkillLabel(skill)}
                      </span>
                    ))}
                    {profile.skills.length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        +{profile.skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{t('caregiver.profileCompletion') || 'Profile Completion'}</span>
                  <span className="font-medium text-amber-600">{profileCompletion}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all" 
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                {profileCompletion === 100 ? (
                  <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t('caregiver.profileComplete') || 'Your profile is complete!'}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500">{t('caregiver.completeProfileHint') || 'Complete your profile to attract more clients'}</p>
                )}
              </div>

              {/* Missing & Completed Items Checklist */}
              {profileCompletion < 100 && missingItems.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    {t('caregiver.missingFields') || 'What\'s left to do:'}
                  </p>
                  {missingItems.map((item) => (
                    <div key={item.key} className="flex items-center gap-2 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <span className="text-gray-600">{item.label}</span>
                    </div>
                  ))}
                  {completedItems.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-gray-100 space-y-1.5">
                      {completedItems.map((item) => (
                        <div key={item.key} className="flex items-center gap-2 text-xs">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          <span className="text-gray-400 line-through">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={() => router.push('/caregiver/profile')}
                className="w-full mt-6 py-3 text-center bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl font-medium text-sm transition-colors cursor-pointer"
              >
                {profileCompletion < 100 
                  ? (t('caregiver.completeProfile') || 'Complete Profile')
                  : (t('caregiver.viewProfile') || 'View Profile')
                } →
              </button>
            </div>
          </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('caregiver.quickActions') || 'Quick Actions'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button 
              onClick={() => router.push('/caregiver/find-clients')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all cursor-pointer"
            >
              <Search className="w-6 h-6 text-amber-600" />
              <span className="text-sm text-gray-700">{t('caregiver.action.findClients') || 'Find Clients'}</span>
            </button>
            <button 
              onClick={() => router.push('/caregiver/messages')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all cursor-pointer"
            >
              <MessageSquare className="w-6 h-6 text-amber-600" />
              <span className="text-sm text-gray-700">{t('caregiver.action.messages') || 'Messages'}</span>
            </button>
            <button 
              onClick={() => router.push('/caregiver/profile')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all cursor-pointer"
            >
              <User className="w-6 h-6 text-amber-600" />
              <span className="text-sm text-gray-700">{t('caregiver.action.profile') || 'My Profile'}</span>
            </button>
            <button 
              onClick={() => router.push('/caregiver/settings')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all cursor-pointer"
            >
              <Award className="w-6 h-6 text-amber-600" />
              <span className="text-sm text-gray-700">{t('caregiver.action.settings') || 'Settings'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </CareGiverLayout>
  );
}
