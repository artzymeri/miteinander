'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { X, User, Mail, Phone, MapPin, Calendar, CreditCard, Loader2, Star, MessageCircle, Handshake, Clock } from 'lucide-react';
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

interface SettlementPerson {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string | null;
}

interface RecipientSettlementData {
  isSettled: boolean;
  settledAt: string | null;
  settledWith: SettlementPerson | null;
  pendingRequest: {
    id: number;
    createdAt: string;
    careGiver: SettlementPerson | null;
  } | null;
}

interface CaregiverSettlementData {
  settledClientsCount: number;
  settledClients: (SettlementPerson & { settledAt: string })[];
  pendingRequestsCount: number;
  pendingRequests: {
    id: number;
    createdAt: string;
    careRecipient: SettlementPerson | null;
  }[];
}

interface SupportProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
  userType: 'careGiver' | 'careRecipient';
}

export default function SupportProfileModal({
  isOpen,
  onClose,
  user,
  userType,
}: SupportProfileModalProps) {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [subDetails, setSubDetails] = useState<SubscriptionDetails | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [reviews, setReviews] = useState<ReviewData[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [settlementData, setSettlementData] = useState<RecipientSettlementData | CaregiverSettlementData | null>(null);
  const [settlementLoading, setSettlementLoading] = useState(false);

  // Fetch subscription details from Stripe when modal opens
  useEffect(() => {
    if (!isOpen || !user || !token) {
      setSubDetails(null);
      return;
    }
    const fetchSubDetails = async () => {
      setSubLoading(true);
      try {
        const ut = userType === 'careGiver' ? 'care-giver' : 'care-recipient';
        const res = await fetch(`${API_URL}/support/subscription/${ut}/${user.id}`, {
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
        const res = await fetch(`${API_URL}/support/care-givers/${user.id}/reviews`, {
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

  // Fetch settlement details
  useEffect(() => {
    if (!isOpen || !user || !token) {
      setSettlementData(null);
      return;
    }
    const fetchSettlement = async () => {
      setSettlementLoading(true);
      try {
        const ut = userType === 'careGiver' ? 'care-giver' : 'care-recipient';
        const res = await fetch(`${API_URL}/support/settlement/${ut}/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setSettlementData(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch settlement details:', err);
      } finally {
        setSettlementLoading(false);
      }
    };
    fetchSettlement();
  }, [isOpen, user, token, userType]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

  const fields = [
    { key: 'firstName', label: t('admin.fields.firstName'), icon: User },
    { key: 'lastName', label: t('admin.fields.lastName'), icon: User },
    { key: 'email', label: t('admin.fields.email'), icon: Mail },
    { key: 'phone', label: t('admin.fields.phone'), icon: Phone },
    { key: 'address', label: t('admin.fields.address'), icon: MapPin },
    { key: 'city', label: t('admin.fields.city'), icon: MapPin },
    { key: 'postalCode', label: t('admin.fields.postalCode'), icon: MapPin },
    { key: 'dateOfBirth', label: t('admin.fields.dateOfBirth'), icon: Calendar },
  ];

  if (!isOpen || !user) return null;

  const accentColor = userType === 'careGiver' ? 'green' : 'purple';
  const bgColor = userType === 'careGiver' ? 'bg-green-100' : 'bg-purple-100';
  const textColor = userType === 'careGiver' ? 'text-green-700' : 'text-purple-700';

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
              {t('admin.modal.viewUser')}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* User avatar and basic info */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              {user.profileImageUrl ? (
                <img
                  src={String(user.profileImageUrl)}
                  alt={`${String(user.firstName || '')} ${String(user.lastName || '')}`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className={`w-16 h-16 rounded-full ${bgColor} flex items-center justify-center`}>
                  <span className={`${textColor} font-semibold text-xl`}>
                    {String(user.firstName || '')[0]}
                    {String(user.lastName || '')[0]}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {String(user.firstName || '')} {String(user.lastName || '')}
                </h3>
                <p className="text-gray-500">{String(user.email || '')}</p>
              </div>
            </div>

            {/* Subscription Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard size={18} className="text-gray-500" />
                <h4 className="text-sm font-semibold text-gray-700">{t('admin.fields.subscriptionInfo')}</h4>
              </div>
              {subLoading ? (
                <div className="flex items-center gap-2 text-gray-400 py-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">{t('admin.modal.loading')}</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t('admin.fields.subscribed')}</p>
                    <span className={`px-2 py-1 text-xs rounded-full ${getSubscriptionColor(subDetails?.subscriptionStatus || user.subscriptionStatus || 'none')}`}>
                      {t(`admin.status.subscription_${subDetails?.subscriptionStatus || user.subscriptionStatus || 'none'}`)}
                    </span>
                  </div>
                  {subDetails?.plan && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('admin.fields.plan')}</p>
                      <p className="text-sm text-gray-900 capitalize">{subDetails.plan}</p>
                    </div>
                  )}
                  {(subDetails?.subscriptionStatus === 'trial' || subDetails?.subscriptionStatus === 'expired' || (!subDetails && (user.subscriptionStatus === 'trial' || user.subscriptionStatus === 'expired'))) && (subDetails?.trialEndsAt || user.trialEndsAt) && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('admin.fields.trialEndsAt')}</p>
                      <p className="text-sm text-gray-900">{formatDate(String(subDetails?.trialEndsAt || user.trialEndsAt))}</p>
                    </div>
                  )}
                  {subDetails?.currentPeriodEnd && !subDetails.isCanceling && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('admin.fields.nextRenewal')}</p>
                      <p className="text-sm text-gray-900">{formatDate(subDetails.currentPeriodEnd)}</p>
                    </div>
                  )}
                  {subDetails?.isCanceling && subDetails.currentPeriodEnd && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('admin.fields.subscribedUntil')}</p>
                      <p className="text-sm text-orange-600 font-medium">{formatDate(subDetails.currentPeriodEnd)}</p>
                    </div>
                  )}
                </div>
              )}
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
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg">
                      <Icon size={18} className="text-gray-400" />
                      <span className="text-gray-900">
                        {field.key === 'dateOfBirth' && user[field.key]
                          ? formatDate(String(user[field.key]))
                          : String(user[field.key] || '-')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

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

            {/* Settlement Details */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <Handshake size={18} className="text-gray-500" />
                <h4 className="text-sm font-semibold text-gray-700">{t('admin.fields.settlementInfo')}</h4>
              </div>
              {settlementLoading ? (
                <div className="flex items-center gap-2 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  <span className="text-sm text-gray-400">{t('admin.modal.loading')}</span>
                </div>
              ) : !settlementData ? (
                <p className="text-xs text-gray-400">{t('admin.fields.noSettlement')}</p>
              ) : userType === 'careRecipient' ? (() => {
                const data = settlementData as RecipientSettlementData;
                return (
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('admin.fields.settlementStatus')}</p>
                      <span className={`px-2 py-1 text-xs rounded-full ${data.isSettled ? 'bg-green-100 text-green-700' : data.pendingRequest ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                        {data.isSettled ? t('settlement.settled') : data.pendingRequest ? t('settlement.pendingTitle') : t('admin.fields.notSettled')}
                      </span>
                    </div>
                    {data.isSettled && data.settledWith && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t('settlement.settledWith')}</p>
                        <div className="flex items-center gap-2">
                          {data.settledWith.profileImageUrl ? (
                            <img src={data.settledWith.profileImageUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-semibold">
                              {data.settledWith.firstName[0]}{data.settledWith.lastName[0]}
                            </div>
                          )}
                          <span className="text-sm text-gray-900">{data.settledWith.firstName} {data.settledWith.lastName}</span>
                          <span className="text-xs text-gray-400">({data.settledWith.email})</span>
                        </div>
                        {data.settledAt && (
                          <p className="text-xs text-gray-400 mt-1">
                            <Clock size={12} className="inline mr-1" />{t('settlement.settledSince')}: {formatDate(data.settledAt)}
                          </p>
                        )}
                      </div>
                    )}
                    {data.pendingRequest && data.pendingRequest.careGiver && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t('settlement.requestSentTo')}</p>
                        <p className="text-sm text-gray-900">
                          {data.pendingRequest.careGiver.firstName} {data.pendingRequest.careGiver.lastName}
                          <span className="text-xs text-gray-400 ml-1">({data.pendingRequest.careGiver.email})</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          <Clock size={12} className="inline mr-1" />{formatDate(data.pendingRequest.createdAt)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })() : (() => {
                const data = settlementData as CaregiverSettlementData;
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t('admin.fields.settledClients')}</p>
                        <p className="text-sm font-medium text-gray-900">{data.settledClientsCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t('admin.fields.pendingRequests')}</p>
                        <p className="text-sm font-medium text-gray-900">{data.pendingRequestsCount}</p>
                      </div>
                    </div>
                    {data.settledClients.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">{t('settlement.myClients')}</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {data.settledClients.map(client => (
                            <div key={client.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-gray-100">
                              {client.profileImageUrl ? (
                                <img src={client.profileImageUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-xs font-semibold">
                                  {client.firstName[0]}{client.lastName[0]}
                                </div>
                              )}
                              <span className="text-xs text-gray-900">{client.firstName} {client.lastName}</span>
                              <span className="text-xs text-gray-400 ml-auto">{formatDate(client.settledAt)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {data.pendingRequests.length > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-2">{t('admin.fields.pendingRequests')}</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {data.pendingRequests.map(req => req.careRecipient && (
                            <div key={req.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-yellow-100">
                              <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 text-xs font-semibold">
                                {req.careRecipient.firstName[0]}{req.careRecipient.lastName[0]}
                              </div>
                              <span className="text-xs text-gray-900">{req.careRecipient.firstName} {req.careRecipient.lastName}</span>
                              <span className="text-xs text-yellow-600 ml-auto">{formatDate(req.createdAt)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Metadata */}
            <div className="text-xs text-gray-400 space-y-1 border-t border-gray-100 pt-4">
              <p>{t('admin.fields.createdAt')}: {formatDateTime(String(user.createdAt || ''))}</p>
              <p>{t('admin.fields.lastLogin')}: {formatDateTime(String(user.lastLoginAt || ''))}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
