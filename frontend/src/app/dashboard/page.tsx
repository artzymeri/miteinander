'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import CareRecipientLayout from '@/components/dashboard/CareRecipientLayout';
import {
  Search,
  Heart,
  MessageSquare,
  ArrowRight,
  User,
  MapPin,
  Loader2,
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
  city: string | null;
  postalCode: string | null;
  country: string | null;
  bio: string | null;
  careNeeds: SkillData[];
  profileImageUrl: string | null;
  memberSince: string;
}

export default function CareRecipientDashboard() {
  const { user, token } = useAuth();
  const { t, language } = useTranslation();
  const router = useRouter();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`${API_URL}/recipient/profile`, {
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

  const getCareNeedLabel = (careNeed: SkillData) => {
    switch (language) {
      case 'de':
        return careNeed.labelDe;
      case 'fr':
        return careNeed.labelFr;
      default:
        return careNeed.labelEn;
    }
  };

  const stats = [
    {
      label: t('recipient.stats.careNeeds') || 'My Care Needs',
      value: profile?.careNeeds?.length || 0,
      icon: Heart,
      color: 'bg-pink-500',
    },
    {
      label: t('recipient.stats.profileViews') || 'Profile Views',
      value: '12',
      icon: User,
      color: 'bg-amber-500',
    },
    {
      label: t('recipient.stats.connections') || 'Connections',
      value: '5',
      icon: Search,
      color: 'bg-blue-500',
    },
    {
      label: t('recipient.stats.messages') || 'Messages',
      value: '3',
      icon: MessageSquare,
      color: 'bg-green-500',
    },
  ];

  if (isLoading) {
    return (
      <CareRecipientLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      </CareRecipientLayout>
    );
  }

  return (
    <CareRecipientLayout>
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
                {t('recipient.welcome') || 'Welcome'}, {user?.firstName}! 👋
              </h1>
              <p className="text-amber-100">
                {t('recipient.welcomeMessage') || 'Here\'s an overview of your care profile'}
              </p>
              {profile?.city && (
                <div className="flex items-center gap-1 text-amber-100 mt-2 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.city}{profile.postalCode ? `, ${profile.postalCode}` : ''}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
              >
                <div className={`p-3 rounded-xl ${stat.color} w-fit mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                <p className="text-xs lg:text-sm text-gray-500">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Find Caregivers CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-xl">
                <Search className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('recipient.findNewCaregivers') || 'Find Caregivers'}</h3>
                <p className="text-sm text-gray-600">{t('recipient.findNewCaregiversDesc') || 'Browse caregivers matching your needs'}</p>
              </div>
            </div>
            <button 
              onClick={() => router.push('/dashboard/find-caregivers')}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium transition-colors cursor-pointer"
            >
              {t('recipient.searchNow') || 'Search Now'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Care Needs */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('recipient.myCareNeeds') || 'My Care Needs'}
                </h2>
                <Heart className="w-5 h-5 text-pink-500" />
              </div>
            </div>
            <div className="p-6">
              {profile?.careNeeds && profile.careNeeds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.careNeeds.map((need) => (
                    <span
                      key={need.id}
                      className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm"
                    >
                      {getCareNeedLabel(need)}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>{t('recipient.noCareNeedsYet') || 'No care needs specified yet'}</p>
                </div>
              )}
              <button 
                onClick={() => router.push('/dashboard/settings')}
                className="w-full py-3 text-center text-amber-600 hover:text-amber-700 font-medium text-sm mt-4 cursor-pointer"
              >
                {t('recipient.editCareNeeds') || 'Edit Care Needs'} →
              </button>
            </div>
          </motion.div>

          {/* Profile Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('recipient.profileSummary') || 'Profile Summary'}
                </h2>
                <User className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
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
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{profile?.firstName} {profile?.lastName}</p>
                  {profile?.city && (
                    <p className="text-sm text-gray-500">{profile.city}</p>
                  )}
                  {profile?.bio ? (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{profile.bio}</p>
                  ) : (
                    <p className="text-sm text-gray-400 mt-1 italic">
                      {t('recipient.noBioYet') || 'No bio added yet'}
                    </p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => router.push('/dashboard/profile')}
                className="w-full py-3 text-center text-amber-600 hover:text-amber-700 font-medium text-sm cursor-pointer"
              >
                {t('recipient.viewProfile') || 'View Profile'} →
              </button>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('recipient.quickActions') || 'Quick Actions'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button 
              onClick={() => router.push('/dashboard/find-caregivers')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all cursor-pointer"
            >
              <Search className="w-6 h-6 text-amber-600" />
              <span className="text-sm text-gray-700">{t('recipient.action.findCaregivers') || 'Find Caregivers'}</span>
            </button>
            <button 
              onClick={() => router.push('/dashboard/messages')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all cursor-pointer"
            >
              <MessageSquare className="w-6 h-6 text-amber-600" />
              <span className="text-sm text-gray-700">{t('recipient.action.messages') || 'Messages'}</span>
            </button>
            <button 
              onClick={() => router.push('/dashboard/profile')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all cursor-pointer"
            >
              <User className="w-6 h-6 text-amber-600" />
              <span className="text-sm text-gray-700">{t('recipient.action.profile') || 'My Profile'}</span>
            </button>
            <button 
              onClick={() => router.push('/dashboard/settings')}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all cursor-pointer"
            >
              <Heart className="w-6 h-6 text-amber-600" />
              <span className="text-sm text-gray-700">{t('recipient.action.careNeeds') || 'Care Needs'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </CareRecipientLayout>
  );
}
