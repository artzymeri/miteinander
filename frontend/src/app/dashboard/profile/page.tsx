'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import CareRecipientLayout from '@/components/dashboard/CareRecipientLayout';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  Edit,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface CareNeed {
  id: number;
  key: string;
  labelEn: string;
  labelDe: string;
  labelFr: string;
}

interface Profile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  bio?: string;
  careNeeds: CareNeed[];
  profileImageUrl?: string;
  memberSince: string;
}

export default function CareRecipientProfilePage() {
  const { t, language } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipient/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        setProfile(data.data.profile);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const getCareNeedLabel = (careNeed: CareNeed): string => {
    switch (language) {
      case 'de':
        return careNeed.labelDe;
      case 'fr':
        return careNeed.labelFr;
      default:
        return careNeed.labelEn;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-US',
      { year: 'numeric', month: 'long', day: 'numeric' }
    );
  };

  if (loading) {
    return (
      <CareRecipientLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
        </div>
      </CareRecipientLayout>
    );
  }

  if (error || !profile) {
    return (
      <CareRecipientLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-gray-600 mb-4">{error || 'Profile not found'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            {t('common.retry')}
          </button>
        </div>
      </CareRecipientLayout>
    );
  }

  return (
    <CareRecipientLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <h1 className="text-2xl font-bold text-gray-900">{t('recipient.profile.title')}</h1>
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors"
          >
            <Edit className="w-4 h-4" />
            {t('recipient.profile.editProfile')}
          </Link>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          {/* Profile Header */}
          <div className="p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                {profile.profileImageUrl ? (
                  <Image
                    src={profile.profileImageUrl}
                    alt={`${profile.firstName} ${profile.lastName}`}
                    width={120}
                    height={120}
                    className="rounded-2xl object-cover"
                  />
                ) : (
                  <div className="w-[120px] h-[120px] rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">
                      {profile.firstName?.[0]}{profile.lastName?.[0]}
                    </span>
                  </div>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {profile.firstName} {profile.lastName}
                </h2>
                
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm">
                    <Calendar className="w-3.5 h-3.5" />
                    {t('recipient.profile.memberSince')} {formatDate(profile.memberSince)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Contact & Location Info */}
          <div className="p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {t('recipient.profile.contactInfo')}
              </h3>
              
              <div className="flex items-center gap-3 text-gray-700">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Mail className="w-4 h-4 text-gray-500" />
                </div>
                <span>{profile.email}</span>
              </div>

              {profile.phone && (
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Phone className="w-4 h-4 text-gray-500" />
                  </div>
                  <span>{profile.phone}</span>
                </div>
              )}

              {profile.dateOfBirth && (
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-500" />
                  </div>
                  <span>{formatDate(profile.dateOfBirth)}</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {t('recipient.profile.location')}
              </h3>

              {(profile.city || profile.postalCode || profile.country) && (
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <MapPin className="w-4 h-4 text-gray-500" />
                  </div>
                  <span>
                    {profile.postalCode && `${profile.postalCode}, `}
                    {profile.city}
                    {profile.country && `, ${profile.country}`}
                  </span>
                </div>
              )}

              {profile.address && (
                <div className="flex items-start gap-3 text-gray-700">
                  <div className="p-2 bg-gray-100 rounded-lg mt-0.5">
                    <MapPin className="w-4 h-4 text-gray-500" />
                  </div>
                  <span>{profile.address}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Bio Section */}
        {profile.bio && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-500" />
              {t('recipient.profile.aboutMe')}
            </h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
          </motion.div>
        )}

        {/* Care Needs Section */}
        {profile.careNeeds && profile.careNeeds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-amber-500" />
              {t('recipient.profile.careNeeds')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.careNeeds.map((need) => (
                <span
                  key={need.id}
                  className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium"
                >
                  {getCareNeedLabel(need)}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </CareRecipientLayout>
  );
}
