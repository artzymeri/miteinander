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
  bio: string | null;
  skills: SkillData[];
  certifications: string[];
  experienceYears: number | null;
  occupation: string | null;
  profileImageUrl: string | null;
  memberSince: string;
}

interface ConversationMessage {
  id: number;
  content: string;
  senderRole: string;
  senderId: number;
  isRead: boolean;
  createdAt: string;
}

interface ConversationData {
  id: number;
  careGiver: { id: number; firstName: string; lastName: string; profileImageUrl: string | null };
  careRecipient: { id: number; firstName: string; lastName: string; profileImageUrl: string | null };
  lastMessage: ConversationMessage | null;
  unreadCount: number;
}

export default function CareGiverDashboard() {
  const { user, token } = useAuth();
  const { t, language } = useTranslation();
  const router = useRouter();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [recentConversations, setRecentConversations] = useState<ConversationData[]>([]);

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

    const fetchConversations = async () => {
      try {
        const response = await fetch(`${API_URL}/messages/conversations`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setRecentConversations((data.data.conversations || []).slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
      }
    };

    if (token) {
      fetchProfile();
      fetchConversations();
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

  // Calculate profile completion percentage
  const calculateProfileCompletion = () => {
    if (!profile) return 0;
    let completed = 0;
    const total = 7;
    
    if (profile.firstName && profile.lastName) completed++;
    if (profile.city) completed++;
    if (profile.bio) completed++;
    if (profile.skills && profile.skills.length > 0) completed++;
    if (profile.certifications && profile.certifications.length > 0) completed++;
    if (profile.experienceYears) completed++;
    if (profile.profileImageUrl) completed++;
    
    return Math.round((completed / total) * 100);
  };

  const profileCompletion = calculateProfileCompletion();

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

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('common.justNow') || 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'en-US', { month: 'short', day: 'numeric' });
  };

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
                {profile?.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.city}{profile.postalCode ? `, ${profile.postalCode}` : ''}</span>
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

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Messages */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100"
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('caregiver.recentMessages')}
                </h2>
                <MessageSquare className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <div className="p-6 space-y-4">
              {recentConversations.length > 0 ? (
                recentConversations.map((conv) => {
                  const otherUser = conv.careRecipient;
                  if (!otherUser) return null;
                  const displayName = `${otherUser.firstName} ${otherUser.lastName?.[0] || ''}.`;
                  const initials = `${otherUser.firstName?.[0] || ''}${otherUser.lastName?.[0] || ''}`;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => router.push('/caregiver/messages')}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      {otherUser.profileImageUrl ? (
                        <img src={otherUser.profileImageUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                          {initials}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`font-medium text-gray-900 ${conv.unreadCount > 0 ? 'font-bold' : ''}`}>{displayName}</p>
                          <p className="text-xs text-gray-400">{conv.lastMessage ? formatTimeAgo(conv.lastMessage.createdAt) : ''}</p>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{conv.lastMessage?.content || t('messages.noMessages') || 'No messages yet'}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="bg-amber-500 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-1">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">{t('messages.noMessages') || 'No messages yet'}</p>
                </div>
              )}
              <button 
                onClick={() => router.push('/caregiver/messages')}
                className="w-full py-3 text-center text-amber-600 hover:text-amber-700 font-medium text-sm"
              >
                {t('caregiver.viewAllMessages')} →
              </button>
            </div>
          </motion.div>

          {/* Profile Completion */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
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
                <p className="text-xs text-gray-500">{t('caregiver.completeProfileHint') || 'Complete your profile to attract more clients'}</p>
              </div>

              <button 
                onClick={() => router.push('/caregiver/profile')}
                className="w-full mt-6 py-3 text-center bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-xl font-medium text-sm transition-colors cursor-pointer"
              >
                {t('caregiver.viewProfile') || 'View Profile'} →
              </button>
            </div>
          </motion.div>
        </div>

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
