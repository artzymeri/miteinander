'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { X, Save, User, Mail, Phone, MapPin, Calendar, CreditCard, Loader2, Star, MessageCircle } from 'lucide-react';
import { StarDisplay } from '@/components/shared/StarRating';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UserData = Record<string, any>;

interface SubscriptionDetails {
  subscriptionStatus: string;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  currentPeriodEnd: string | null;
  plan: string | null;
  isCanceling: boolean;
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

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (data: UserData) => void;
  user: UserData | null;
  mode: 'view' | 'edit';
  userType: 'support' | 'careGiver' | 'careRecipient';
}

export default function UserModal({
  isOpen,
  onClose,
  onSave,
  user,
  mode,
  userType,
}: UserModalProps) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [formData, setFormData] = useState<UserData>({});
  const [subDetails, setSubDetails] = useState<SubscriptionDetails | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

  // Fetch subscription details from Stripe when modal opens for care givers/recipients
  useEffect(() => {
    if (!isOpen || !user || !token || userType === 'support') {
      setSubDetails(null);
      return;
    }
    const fetchSubDetails = async () => {
      setSubLoading(true);
      try {
        const ut = userType === 'careGiver' ? 'care-giver' : 'care-recipient';
        const res = await fetch(`${API_URL}/admin/subscription/${ut}/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setSubDetails(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch subscription details:', err);
      } finally {
        setSubLoading(false);
      }
    };
    fetchSubDetails();
  }, [isOpen, user, token, userType]);

  // Fetch reviews for care givers
  useEffect(() => {
    if (!isOpen || !user || !token || userType !== 'careGiver') {
      setReviews([]);
      return;
    }
    const fetchReviews = async () => {
      setReviewsLoading(true);
      try {
        const res = await fetch(`${API_URL}/admin/care-givers/${user.id}/reviews`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setReviews(json.data.reviews);
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        setReviewsLoading(false);
      }
    };
    fetchReviews();
  }, [isOpen, user, token, userType]);

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave && mode === 'edit') {
      onSave(formData);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const fields = [
    { key: 'firstName', label: t('admin.fields.firstName'), icon: User, type: 'text' },
    { key: 'lastName', label: t('admin.fields.lastName'), icon: User, type: 'text' },
    { key: 'email', label: t('admin.fields.email'), icon: Mail, type: 'email', disabled: true },
    { key: 'phone', label: t('admin.fields.phone'), icon: Phone, type: 'tel' },
    ...(userType !== 'support'
      ? [
          { key: 'address', label: t('admin.fields.address'), icon: MapPin, type: 'text' },
          { key: 'city', label: t('admin.fields.city'), icon: MapPin, type: 'text' },
          { key: 'postalCode', label: t('admin.fields.postalCode'), icon: MapPin, type: 'text' },
          { key: 'dateOfBirth', label: t('admin.fields.dateOfBirth'), icon: Calendar, type: 'date' },
        ]
      : []),
  ];

  const getSubscriptionColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      trial: 'bg-blue-100 text-blue-700',
      past_due: 'bg-yellow-100 text-yellow-700',
      canceled: 'bg-red-100 text-red-700',
      none: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || colors.none;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between z-10">
            <h2 className="text-xl font-semibold text-gray-900">
              {mode === 'view' ? t('admin.modal.viewUser') : t('admin.modal.editUser')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6">
            {/* User avatar and basic info */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              {formData.profileImageUrl ? (
                <img
                  src={String(formData.profileImageUrl)}
                  alt={`${String(formData.firstName || '')} ${String(formData.lastName || '')}`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                  <span className="text-amber-700 font-semibold text-xl">
                    {String(formData.firstName || '')[0]}
                    {String(formData.lastName || '')[0]}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {String(formData.firstName || '')} {String(formData.lastName || '')}
                </h3>
                <p className="text-gray-500">{String(formData.email || '')}</p>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {fields.map((field) => {
                const Icon = field.icon;
                return (
                  <div key={field.key} className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700">
                      {field.label}
                    </label>
                    {mode === 'view' || field.disabled ? (
                      <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg">
                        <Icon size={18} className="text-gray-400" />
                        <span className="text-gray-900">
                          {field.type === 'date' && formData[field.key]
                            ? new Date(String(formData[field.key])).toLocaleDateString('de-DE')
                            : String(formData[field.key] || '-')}
                        </span>
                      </div>
                    ) : (
                      <div className="relative">
                        <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type={field.type}
                          value={String(formData[field.key] || '')}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Subscription Info (for care givers and care recipients) */}
            {userType !== 'support' && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard size={18} className="text-gray-500" />
                  <h4 className="text-sm font-semibold text-gray-700">{t('admin.fields.subscriptionInfo')}</h4>
                </div>
                {subLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-400">{t('admin.modal.loading')}</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('admin.fields.subscribed')}</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${getSubscriptionColor((subDetails?.subscriptionStatus) || formData.subscriptionStatus || 'none')}`}>
                        {t(`admin.status.subscription_${(subDetails?.subscriptionStatus) || formData.subscriptionStatus || 'none'}`)}
                      </span>
                    </div>
                    {subDetails?.plan && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t('admin.fields.plan')}</p>
                        <p className="text-sm text-gray-900 capitalize">{subDetails.plan}</p>
                      </div>
                    )}
                    {(subDetails?.subscriptionStatus === 'trial' || subDetails?.subscriptionStatus === 'expired') && (subDetails?.trialEndsAt || formData.trialEndsAt) && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t('admin.fields.trialEndsAt')}</p>
                        <p className="text-sm text-gray-900">{new Date(String(subDetails?.trialEndsAt || formData.trialEndsAt)).toLocaleDateString('de-DE')}</p>
                      </div>
                    )}
                    {subDetails?.currentPeriodEnd && !subDetails.isCanceling && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t('admin.fields.nextRenewal')}</p>
                        <p className="text-sm text-gray-900">{new Date(subDetails.currentPeriodEnd).toLocaleDateString('de-DE')}</p>
                      </div>
                    )}
                    {subDetails?.isCanceling && subDetails.currentPeriodEnd && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t('admin.fields.subscribedUntil')}</p>
                        <p className="text-sm text-orange-600 font-medium">{new Date(subDetails.currentPeriodEnd).toLocaleDateString('de-DE')}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reviews (care givers only) */}
            {userType === 'careGiver' && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle size={18} className="text-gray-500" />
                  <h4 className="text-sm font-semibold text-gray-700">
                    {t('admin.fields.reviews') || 'Reviews'}
                    {reviews.length > 0 && (
                      <span className="ml-1 font-normal text-gray-400">({reviews.length})</span>
                    )}
                  </h4>
                </div>
                {reviewsLoading ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-sm text-gray-400">{t('admin.modal.loading')}</span>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-4">
                    <Star className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">{t('admin.fields.noReviews') || 'No reviews yet'}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {reviews.map(review => (
                      <div key={review.id} className="p-3 bg-white rounded-lg border border-gray-100">
                        <div className="flex items-start gap-2.5">
                          {review.careRecipient.profileImageUrl ? (
                            <img
                              src={review.careRecipient.profileImageUrl}
                              alt={review.careRecipient.firstName}
                              className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-semibold flex-shrink-0">
                              {review.careRecipient.firstName[0]}{review.careRecipient.lastName[0]}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-medium text-gray-900">
                                {review.careRecipient.firstName} {review.careRecipient.lastName[0]}.
                              </p>
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                {new Date(review.createdAt).toLocaleDateString('de-DE')}
                              </span>
                            </div>
                            <StarDisplay rating={Number(review.rating)} size="xs" className="mt-0.5" />
                            {review.comment && (
                              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{review.comment}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Metadata */}
            <div className="text-xs text-gray-400 space-y-1 border-t border-gray-100 pt-4">
              <p>{t('admin.fields.createdAt')}: {formatDate(String(formData.createdAt || ''))}</p>
              <p>{t('admin.fields.lastLogin')}: {formatDate(String(formData.lastLoginAt || ''))}</p>
            </div>

            {/* Actions */}
            {mode === 'edit' && (
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  {t('admin.modal.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
                >
                  <Save size={18} />
                  {t('admin.modal.save')}
                </button>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
