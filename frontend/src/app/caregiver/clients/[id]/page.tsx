'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import CareGiverLayout from '@/components/caregiver/CareGiverLayout';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  MessageSquare,
  Heart,
  Loader2,
  AlertCircle,
  User,
  X,
} from 'lucide-react';

interface CareNeedData {
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
  city: string;
  postalCode: string;
  country: string;
  careNeeds: CareNeedData[];
  bio: string | null;
  profileImageUrl: string | null;
  memberSince: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ClientProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { token } = useAuth();
  const { t, language } = useTranslation();
  
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBioModal, setShowBioModal] = useState(false);

  const BIO_LIMIT = 700;

  const clientId = params.id as string;

  useEffect(() => {
    const fetchClient = async () => {
      if (!token || !clientId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`${API_URL}/caregiver/clients/${clientId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setClient(data.data.client);
        } else if (response.status === 404) {
          setError('Client not found');
        } else {
          setError('Failed to load client profile');
        }
      } catch (err) {
        console.error('Failed to fetch client:', err);
        setError('Failed to load client profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClient();
  }, [token, clientId]);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  if (isLoading) {
    return (
      <CareGiverLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        </div>
      </CareGiverLayout>
    );
  }

  if (error || !client) {
    return (
      <CareGiverLayout>
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            {t('common.back')}
          </button>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Client not found'}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('caregiver.clientProfile.notFoundMessage')}
            </p>
            <button
              onClick={() => router.push('/caregiver/find-clients')}
              className="px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors cursor-pointer"
            >
              {t('caregiver.clientProfile.backToSearch')}
            </button>
          </div>
        </div>
      </CareGiverLayout>
    );
  }

  return (
    <CareGiverLayout>
      <div className="h-full overflow-y-auto p-4 md:p-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">{t('common.back')}</span>
        </button>

        {/* Profile Header — Photo left, Info right */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8"
        >
          <div className="flex flex-col sm:flex-row gap-6 md:gap-8">
            {/* Photo */}
            <div className="flex-shrink-0 mx-auto sm:mx-0">
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-5xl font-bold text-white overflow-hidden shadow-sm">
                {client.profileImageUrl ? (
                  <img
                    src={client.profileImageUrl}
                    alt={`${client.firstName} ${client.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>{client.firstName[0]}{client.lastName[0]}</>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {client.firstName} {client.lastName}
              </h1>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 justify-center sm:justify-start">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{client.city}, {client.postalCode}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{t('caregiver.clientProfile.memberSince')} {formatDate(client.memberSince)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 mt-5 justify-center sm:justify-start">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`${API_URL}/messages/conversations`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({ otherUserId: client.id }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        router.push(`/caregiver/messages?conversation=${data.data.conversation.id}`);
                      }
                    } catch (err) {
                      console.error('Failed to start conversation:', err);
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors cursor-pointer font-medium text-sm shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  {t('caregiver.clientProfile.sendMessage')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Sections — two columns on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* About */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8"
          >
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-500" />
              {t('caregiver.clientProfile.aboutClient')}
            </h2>
            {client.bio ? (
              <>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {client.bio.length > BIO_LIMIT
                    ? `${client.bio.slice(0, BIO_LIMIT)}...`
                    : client.bio}
                </p>
                {client.bio.length > BIO_LIMIT && (
                  <button
                    onClick={() => setShowBioModal(true)}
                    className="text-amber-500 hover:text-amber-600 text-sm font-medium mt-3 cursor-pointer transition-colors"
                  >
                    {t('caregiver.clientProfile.seeMore')}
                  </button>
                )}
              </>
            ) : (
              <p className="text-gray-400 text-sm italic">
                {t('caregiver.clientProfile.noAdditionalInfo')}
              </p>
            )}
          </motion.div>

          {/* Care Needs */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8"
            >
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-amber-500" />
                {t('caregiver.clientProfile.careNeeds')}
              </h2>
              {client.careNeeds && client.careNeeds.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {client.careNeeds.map(need => (
                    <span
                      key={need.id}
                      className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium border border-amber-100"
                    >
                      {getCareNeedLabel(need)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">
                  {t('caregiver.clientProfile.noCareNeeds')}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bio Modal */}
      <AnimatePresence>
        {showBioModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowBioModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-amber-500" />
                  {t('caregiver.clientProfile.aboutClient')}
                </h3>
                <button
                  onClick={() => setShowBioModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {client.bio}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </CareGiverLayout>
  );
}
