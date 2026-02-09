'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';
import CareGiverLayout from '@/components/caregiver/CareGiverLayout';
import {
  Users,
  MapPin,
  Calendar,
  Heart,
  Loader2,
  MessageSquare,
  ChevronRight,
  User,
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

interface SettledClient {
  id: number;
  firstName: string;
  lastName: string;
  city: string;
  postalCode: string;
  country: string;
  bio: string | null;
  profileImageUrl: string | null;
  settledAt: string;
  careNeeds: CareNeed[];
}

export default function MyClientsPage() {
  const { token } = useAuth();
  const { t, language } = useTranslation();
  const [clients, setClients] = useState<SettledClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/caregiver/my-clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.data.clients || []);
      } else {
        setError('Failed to fetch clients');
      }
    } catch {
      setError('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

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

  return (
    <CareGiverLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-amber-500" />
            {t('settlement.myClients')}
          </h1>
          <p className="text-gray-600 mt-1">{t('settlement.myClientsDesc')}</p>
        </motion.div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
          </div>
        ) : clients.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-700 mb-2">{t('settlement.noClients')}</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">{t('settlement.noClientsDesc')}</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  {/* Client Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0 overflow-hidden">
                      {client.profileImageUrl ? (
                        <img src={client.profileImageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <>{client.firstName[0]}{client.lastName[0]}</>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {client.firstName} {client.lastName}
                      </h3>
                      <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{client.postalCode} {client.city}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{t('settlement.settledSince')} {formatDate(client.settledAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Care Needs */}
                  {client.careNeeds.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Heart className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-medium text-gray-600">{t('settlement.careNeeds')}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {client.careNeeds.slice(0, 4).map(need => (
                          <span
                            key={need.id}
                            className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium"
                          >
                            {getCareNeedLabel(need)}
                          </span>
                        ))}
                        {client.careNeeds.length > 4 && (
                          <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                            +{client.careNeeds.length - 4}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  {client.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{client.bio}</p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/caregiver/my-clients/${client.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      {t('settlement.viewProfile')}
                    </Link>
                    <Link
                      href={`/caregiver/messages`}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </CareGiverLayout>
  );
}
