'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  MapPin, 
  Star,
  Briefcase,
  Calendar,
  Award,
  Loader2,
  AlertCircle,
  MessageSquare,
  User,
  Heart,
  X,
  Send,
  MessageCircle,
} from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import CareRecipientLayout from '@/components/dashboard/CareRecipientLayout';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface SkillData {
  id: number;
  key: string;
  labelEn: string;
  labelDe: string;
  labelFr: string;
}

interface CaregiverProfile {
  id: number;
  firstName: string;
  lastName: string;
  city: string;
  postalCode: string;
  country: string;
  skills: SkillData[];
  bio: string | null;
  experienceYears: number | null;
  occupation: string | null;
  certifications: string[];
  profileImageUrl: string | null;
  rating: number | null;
  reviewCount: number;
  isVerified: boolean;
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

export default function CaregiverProfilePage() {
  const { t, language } = useTranslation();
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const caregiverId = params.id;
  
  const [caregiver, setCaregiver] = useState<CaregiverProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showBioModal, setShowBioModal] = useState(false);

  // Review state
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const BIO_LIMIT = 700;

  useEffect(() => {
    const fetchCaregiver = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_URL}/recipient/caregivers/${caregiverId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setCaregiver(data.data.caregiver);
        } else if (response.status === 404) {
          setError('Caregiver not found');
        } else {
          setError('Failed to load caregiver profile');
        }
      } catch (error) {
        console.error('Failed to fetch caregiver:', error);
        setError('Failed to load caregiver profile');
      } finally {
        setIsLoading(false);
      }
    };

    if (caregiverId && token) {
      fetchCaregiver();
    }
  }, [caregiverId, token]);

  // Fetch reviews and check if already reviewed
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${API_URL}/recipient/reviews/${caregiverId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setReviews(data.data.reviews);
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      }
    };

    const checkReviewStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/recipient/reviews/${caregiverId}/check`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setHasReviewed(data.data.hasReviewed);
        }
      } catch (err) {
        console.error('Failed to check review status:', err);
      }
    };

    if (caregiverId && token) {
      fetchReviews();
      checkReviewStatus();
    }
  }, [caregiverId, token]);

  const handleSubmitReview = async () => {
    if (reviewRating === 0) {
      setReviewError(t('recipient.caregiverProfile.ratingRequired') || 'Please select a rating');
      return;
    }

    setIsSubmittingReview(true);
    setReviewError(null);

    try {
      const response = await fetch(`${API_URL}/recipient/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          caregiverId: Number(caregiverId),
          rating: reviewRating,
          comment: reviewComment.trim() || undefined,
        }),
      });

      if (response.ok) {
        setReviewSuccess(true);
        setHasReviewed(true);
        // Re-fetch reviews
        const reviewsRes = await fetch(`${API_URL}/recipient/reviews/${caregiverId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (reviewsRes.ok) {
          const data = await reviewsRes.json();
          setReviews(data.data.reviews);
        }
        // Re-fetch caregiver to update rating
        const caregiverRes = await fetch(`${API_URL}/recipient/caregivers/${caregiverId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (caregiverRes.ok) {
          const data = await caregiverRes.json();
          setCaregiver(data.data.caregiver);
        }
      } else {
        const data = await response.json();
        setReviewError(data.message || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      setReviewError('Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const formatReviewDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-US', {
      year: 'numeric',
      month: 'long',
    });
  };

  if (isLoading) {
    return (
      <CareRecipientLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
        </div>
      </CareRecipientLayout>
    );
  }

  if (error || !caregiver) {
    return (
      <CareRecipientLayout>
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
              {error || t('recipient.caregiverProfile.notFound')}
            </h2>
            <p className="text-gray-600 mb-6">
              {t('recipient.caregiverProfile.notFoundMessage')}
            </p>
            <button
              onClick={() => router.push('/dashboard/find-caregivers')}
              className="px-6 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors cursor-pointer"
            >
              {t('recipient.caregiverProfile.backToSearch')}
            </button>
          </div>
        </div>
      </CareRecipientLayout>
    );
  }

  return (
    <CareRecipientLayout>
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
                {caregiver.profileImageUrl ? (
                  <img
                    src={caregiver.profileImageUrl}
                    alt={`${caregiver.firstName} ${caregiver.lastName}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>{caregiver.firstName[0]}{caregiver.lastName[0]}</>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {caregiver.firstName} {caregiver.lastName[0]}.
              </h1>

              {caregiver.occupation && (
                <p className="text-amber-600 font-medium mt-1">{caregiver.occupation}</p>
              )}

              {/* Rating */}
              {caregiver.rating !== null && Number(caregiver.rating) > 0 ? (
                <div className="flex items-center gap-1.5 mt-3 justify-center sm:justify-start">
                  <span className="text-xl font-bold text-gray-900">{Number(caregiver.rating).toFixed(1)}</span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i <= Math.round(Number(caregiver.rating)) ? 'text-amber-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">({caregiver.reviewCount})</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 mt-3 justify-center sm:justify-start">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className="w-4 h-4 text-gray-200" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-400">
                    {t('recipient.caregiverProfile.noReviews') || 'No reviews yet'}
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-3 justify-center sm:justify-start">
                <div className="flex items-center gap-1.5 text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{caregiver.city}, {caregiver.postalCode}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">{t('recipient.caregiverProfile.memberSince')} {formatDate(caregiver.memberSince)}</span>
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
                        body: JSON.stringify({ otherUserId: caregiver.id }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        router.push(`/dashboard/messages?conversation=${data.data.conversation.id}`);
                      }
                    } catch (err) {
                      console.error('Failed to start conversation:', err);
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors cursor-pointer font-medium text-sm shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  {t('recipient.caregiverProfile.contactCaregiver')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Sections — two columns on larger screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Left Column — About */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8"
          >
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-500" />
              {t('recipient.caregiverProfile.aboutCaregiver')}
            </h2>
            {caregiver.bio ? (
              <>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                  {caregiver.bio.length > BIO_LIMIT
                    ? `${caregiver.bio.slice(0, BIO_LIMIT)}...`
                    : caregiver.bio}
                </p>
                {caregiver.bio.length > BIO_LIMIT && (
                  <button
                    onClick={() => setShowBioModal(true)}
                    className="text-amber-500 hover:text-amber-600 text-sm font-medium mt-3 cursor-pointer transition-colors"
                  >
                    {t('recipient.caregiverProfile.seeMore')}
                  </button>
                )}
              </>
            ) : (
              <p className="text-gray-400 text-sm italic">
                {t('recipient.caregiverProfile.noAdditionalInfo')}
              </p>
            )}
          </motion.div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Skills */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8"
            >
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-amber-500" />
                {t('recipient.caregiverProfile.skills')}
              </h2>
              {caregiver.skills && caregiver.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {caregiver.skills.map(skill => (
                    <span
                      key={skill.id}
                      className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium border border-amber-100"
                    >
                      {getSkillLabel(skill)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">
                  {t('recipient.caregiverProfile.noSkills')}
                </p>
              )}
            </motion.div>

            {/* Experience & Status */}
            {caregiver.experienceYears && caregiver.experienceYears > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8"
              >
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-amber-500" />
                  {t('recipient.caregiverProfile.experience')}
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-500">{t('recipient.caregiverProfile.yearsExperience')}</span>
                    <span className="text-sm font-semibold text-gray-900">{caregiver.experienceYears}</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Certifications */}
            {caregiver.certifications && caregiver.certifications.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8"
              >
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  {t('recipient.caregiverProfile.certifications')}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {caregiver.certifications.map((cert, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-100"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 mt-6"
        >
          <h2 className="text-base font-semibold text-gray-900 mb-5 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-amber-500" />
            {t('recipient.caregiverProfile.reviewsTitle') || 'Reviews'}
            {reviews.length > 0 && (
              <span className="text-sm font-normal text-gray-400">({reviews.length})</span>
            )}
          </h2>

          {/* Submit Review Form (only if settled with this caregiver & not yet reviewed) */}
          {!hasReviewed && !reviewSuccess && (
            <div className="mb-6 p-5 bg-gray-50 rounded-xl border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                {t('recipient.caregiverProfile.leaveReview') || 'Leave a Review'}
              </h3>

              {/* Star rating */}
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    onMouseEnter={() => setReviewHover(star)}
                    onMouseLeave={() => setReviewHover(0)}
                    className="p-0.5 cursor-pointer transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= (reviewHover || reviewRating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                {reviewRating > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    {reviewRating}/5
                  </span>
                )}
              </div>

              {/* Comment textarea */}
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={t('recipient.caregiverProfile.reviewPlaceholder') || 'Share your experience (optional)...'}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-400 resize-none"
                rows={3}
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{reviewComment.length}/500</span>
              </div>

              {reviewError && (
                <p className="text-sm text-red-500 mt-2">{reviewError}</p>
              )}

              <button
                onClick={handleSubmitReview}
                disabled={isSubmittingReview || reviewRating === 0}
                className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors cursor-pointer font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingReview ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {t('recipient.caregiverProfile.submitReview') || 'Submit Review'}
              </button>
            </div>
          )}

          {/* Success message */}
          {reviewSuccess && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-sm text-emerald-700 font-medium">
                {t('recipient.caregiverProfile.reviewSubmitted') || 'Thank you for your review!'}
              </p>
            </div>
          )}

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <div className="text-center py-8">
              <Star className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">
                {t('recipient.caregiverProfile.noReviews') || 'No reviews yet'}
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
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i <= review.rating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-200'
                            }`}
                          />
                        ))}
                      </div>

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
                  {t('recipient.caregiverProfile.aboutCaregiver')}
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
                  {caregiver.bio}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </CareRecipientLayout>
  );
}
