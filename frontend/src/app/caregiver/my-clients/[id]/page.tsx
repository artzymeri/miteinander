'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import CareGiverLayout from '@/components/caregiver/CareGiverLayout';
import {
  ArrowLeft,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Heart,
  Loader2,
  AlertTriangle,
  User,
  Home,
} from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface CareNeed {
  id: number;
  key: string;
  labelEn: string;
  labelDe: string;
  labelFr: string;
}

interface ClientProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string | null;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  bio: string | null;
  profileImageUrl: string | null;
  settledAt: string;
  careNeeds: CareNeed[];
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
}

export default function SettledClientProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const { t, language } = useTranslation();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!token || !id) return;
    try {
      const res = await fetch(`${API_URL}/caregiver/my-clients/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.data.client);
      } else {
        setError('Not found');
      }
    } catch {
      setError('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, [token, id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const getCareNeedLabel = (need: CareNeed) => {
    switch (language) {
      case 'de': return need.labelDe;
      case 'fr': return need.labelFr;
      default: return need.labelEn;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <CareGiverLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
        </div>
      </CareGiverLayout>
    );
  }

  if (error || !profile) {
    return (
      <CareGiverLayout>
        <div className="text-center py-20">
          <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">{t('settlement.clientNotFound')}</h2>
          <Link
            href="/caregiver/my-clients"
            className="text-amber-600 hover:text-amber-700 text-sm font-medium"
          >
            {t('settlement.backToClients')}
          </Link>
        </div>
      </CareGiverLayout>
    );
  }

  return (
    <CareGiverLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">{t('settlement.backToClients')}</span>
        </button>

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-start gap-5">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-2xl flex-shrink-0 overflow-hidden">
              {profile.profileImageUrl ? (
                <img src={profile.profileImageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <>{profile.firstName[0]}{profile.lastName[0]}</>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {profile.firstName} {profile.lastName}
              </h1>
              <div className="flex items-center gap-2 mt-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium">{t('settlement.settledClient')}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {t('settlement.settledSince')} {formatDate(profile.settledAt)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('settlement.contactInfo')}</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">{t('register.email')}</p>
                <p className="text-sm text-gray-900">{profile.email}</p>
              </div>
            </div>
            {profile.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">{t('register.phone')}</p>
                  <p className="text-sm text-gray-900">{profile.phone}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Home className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-500">{t('register.address')}</p>
                <p className="text-sm text-gray-900">{profile.address}, {profile.postalCode} {profile.city}</p>
              </div>
            </div>
            {profile.dateOfBirth && (
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">{t('register.dateOfBirth')}</p>
                  <p className="text-sm text-gray-900">{formatDate(profile.dateOfBirth)}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Care Needs */}
        {profile.careNeeds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-amber-500" />
              {t('settlement.careNeeds')}
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.careNeeds.map(need => (
                <span
                  key={need.id}
                  className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium"
                >
                  {getCareNeedLabel(need)}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Bio */}
        {profile.bio && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('settlement.aboutClient')}</h2>
            <p className="text-gray-600 text-sm leading-relaxed">{profile.bio}</p>
          </motion.div>
        )}

        {/* Emergency Contact */}
        {(profile.emergencyContactName || profile.emergencyContactPhone) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-red-50 rounded-2xl border border-red-100 p-6"
          >
            <h2 className="text-lg font-semibold text-red-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {t('register.emergencyContact')}
            </h2>
            <div className="space-y-2">
              {profile.emergencyContactName && (
                <div>
                  <p className="text-xs text-red-500">{t('register.emergencyContactName')}</p>
                  <p className="text-sm text-red-800 font-medium">{profile.emergencyContactName}</p>
                </div>
              )}
              {profile.emergencyContactPhone && (
                <div>
                  <p className="text-xs text-red-500">{t('register.emergencyContactPhone')}</p>
                  <p className="text-sm text-red-800 font-medium">{profile.emergencyContactPhone}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </CareGiverLayout>
  );
}
