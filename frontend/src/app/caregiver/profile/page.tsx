'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import CareGiverLayout from '@/components/caregiver/CareGiverLayout';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Award,
  Star,
  Clock,
  Edit,
  MessageCircle,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { StarDisplay } from '@/components/shared/StarRating';

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
  bio?: string;
  skills: CareNeed[];
  certifications?: string[];
  experienceYears?: number;
  occupation?: string;
  profileImageUrl?: string;
  rating: number | null;
  reviewCount: number;
  memberSince: string;
}

interface ReviewData {
  id: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  careRecipient: {
    id: number;
    firstName: string;
    lastName: string;
    profileImageUrl: string | null;
  };
}

export default function CareGiverProfilePage() {
  const { t, language } = useTranslation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewData[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/caregiver/profile`, {
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

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/caregiver/reviews`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setReviews(data.data.reviews);
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      }
    };

    fetchReviews();
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

  const formatReviewDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(
      language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-US',
      { year: 'numeric', month: 'short', day: 'numeric' }
    );
  };

  if (loading) {
    return (
      <CareGiverLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
        </div>
      </CareGiverLayout>
    );
  }

  if (error || !profile) {
    return (
      <CareGiverLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-gray-600 mb-4">{error || 'Profile not found'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            {t('common.retry')}
          </button>
        </div>
      </CareGiverLayout>
    );
  }

  return (
    <CareGiverLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <h1 className="text-2xl font-bold text-gray-900">{t('caregiver.profile.title')}</h1>
          <Link
            href="/caregiver/settings"
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors"
          >
            <Edit className="w-4 h-4" />
            {t('caregiver.profile.editProfile')}
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
                
                {profile.occupation && (
                  <div className="flex items-center gap-2 text-gray-600 mb-3">
                    <Briefcase className="w-4 h-4" />
                    <span>{profile.occupation}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {profile.experienceYears && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm">
                      <Clock className="w-3.5 h-3.5" />
                      {profile.experienceYears} {t('caregiver.profile.yearsExperience')}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-full text-sm">
                    <Calendar className="w-3.5 h-3.5" />
                    {t('caregiver.profile.memberSince')} {formatDate(profile.memberSince)}
                  </span>
                </div>

                {/* Rating */}
                {profile.rating !== null && Number(profile.rating) > 0 ? (
                  <div className="flex items-center gap-1.5 mt-3">
                    <span className="text-lg font-bold text-gray-900">{Number(profile.rating).toFixed(1)}</span>
                    <StarDisplay rating={Number(profile.rating)} size="sm" />
                    <span className="text-sm text-gray-400">({profile.reviewCount} {profile.reviewCount === 1 ? (t('caregiver.profile.review') || 'review') : (t('caregiver.profile.reviews') || 'reviews')})</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mt-3">
                    <StarDisplay rating={0} size="sm" />
                    <span className="text-sm text-gray-400">
                      {t('caregiver.profile.noReviewsYet') || 'No reviews yet'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Contact & Location Info */}
          <div className="p-6 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                {t('caregiver.profile.contactInfo')}
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
                {t('caregiver.profile.location')}
              </h3>

              {(profile.city || profile.postalCode) && (
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <MapPin className="w-4 h-4 text-gray-500" />
                  </div>
                  <span>
                    {profile.postalCode && `${profile.postalCode}, `}
                    {profile.city}
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
              {t('caregiver.profile.aboutMe')}
            </h3>
            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
          </motion.div>
        )}

        {/* Skills Section */}
        {profile.skills && profile.skills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              {t('caregiver.profile.skills')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((skill) => (
                <span
                  key={skill.id}
                  className="px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium"
                >
                  {getCareNeedLabel(skill)}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Certifications Section */}
        {profile.certifications && profile.certifications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              {t('caregiver.profile.certifications')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.certifications.map((cert, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Award className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700">{cert}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-amber-500" />
            {t('caregiver.profile.reviewsTitle') || 'Reviews'}
            {reviews.length > 0 && (
              <span className="text-sm font-normal text-gray-400">({reviews.length})</span>
            )}
          </h3>

          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                {t('caregiver.profile.noReviewsYet') || 'No reviews yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map(review => (
                <div
                  key={review.id}
                  className="p-4 border border-gray-100 rounded-xl"
                >
                  <div className="flex items-start gap-3">
                    {/* Reviewer avatar */}
                    <div className="flex-shrink-0">
                      {review.careRecipient.profileImageUrl ? (
                        <img
                          src={review.careRecipient.profileImageUrl}
                          alt={review.careRecipient.firstName}
                          className="w-9 h-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-semibold">
                          {review.careRecipient.firstName[0]}{review.careRecipient.lastName[0]}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">
                          {review.careRecipient.firstName} {review.careRecipient.lastName[0]}.
                        </p>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {formatReviewDate(review.createdAt)}
                        </span>
                      </div>

                      {/* Stars */}
                      <StarDisplay rating={Number(review.rating)} size="xs" className="mt-1" />

                      {/* Comment */}
                      {review.comment && (
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </CareGiverLayout>
  );
}
