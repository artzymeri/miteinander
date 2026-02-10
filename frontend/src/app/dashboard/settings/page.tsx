'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import CareRecipientLayout from '@/components/dashboard/CareRecipientLayout';
import {
  User,
  Mail,
  Lock,
  Save,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  Heart,
  Globe,
  Handshake,
  Loader2,
} from 'lucide-react';
import ImageCropper from '@/components/shared/ImageCropper';
import LanguageSwitcher from '@/components/LanguageSwitcher';

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
  isSettled?: boolean;
  settledWithCaregiverId?: number | null;
  settledAt?: string | null;
  settledCaregiver?: {
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string | null;
  } | null;
}

type SettingsTab = 'profile' | 'careNeeds' | 'password' | 'email' | 'settlement' | 'language';

export default function CareRecipientSettingsPage() {
  const { t, language } = useTranslation();
  const { updateProfileImage } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [allCareNeeds, setAllCareNeeds] = useState<CareNeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Care needs form state
  const [selectedCareNeeds, setSelectedCareNeeds] = useState<number[]>([]);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Email form state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  // Settlement form state
  const [settlementEmail, setSettlementEmail] = useState('');
  const [isSettling, setIsSettling] = useState(false);
  const [isUnsettling, setIsUnsettling] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch profile and care needs in parallel
        const [profileRes, careNeedsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipient/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/care-needs`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!profileRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const profileData = await profileRes.json();
        const careNeedsData = careNeedsRes.ok ? await careNeedsRes.json() : { data: [] };

        const fetchedProfile = profileData.data.profile;
        setProfile(fetchedProfile);
        setAllCareNeeds(careNeedsData.data || []);

        // Initialize form state
        setFirstName(fetchedProfile.firstName || '');
        setLastName(fetchedProfile.lastName || '');
        setPhone(fetchedProfile.phone || '');
        setBio(fetchedProfile.bio || '');
        setProfileImageUrl(fetchedProfile.profileImageUrl || '');
        setSelectedCareNeeds(fetchedProfile.careNeeds?.map((s: CareNeed) => s.id) || []);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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

  const showMessage = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccessMessage(message);
      setErrorMessage(null);
    } else {
      setErrorMessage(message);
      setSuccessMessage(null);
    }
    setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 5000);
  };

  const handleImageChange = (croppedImageDataUrl: string) => {
    setPreviewImage(croppedImageDataUrl);
  };

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const newProfileImageUrl = previewImage || profileImageUrl;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipient/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          bio,
          profileImageUrl: newProfileImageUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update the profile image in the auth context (updates sidebar avatar)
      updateProfileImage(newProfileImageUrl);
      showMessage('success', t('recipient.settings.profileUpdated'));
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleCareNeedsSave = async () => {
    if (selectedCareNeeds.length === 0) {
      showMessage('error', t('recipient.settings.minOneCareNeed'));
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipient/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          careNeeds: selectedCareNeeds,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update care needs');
      }

      showMessage('success', t('recipient.settings.careNeedsUpdated'));
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      showMessage('error', t('recipient.settings.passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 8) {
      showMessage('error', t('recipient.settings.passwordTooShort'));
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipient/profile/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update password');
      }

      showMessage('success', t('recipient.settings.passwordUpdated'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || !emailPassword) {
      showMessage('error', t('recipient.settings.allFieldsRequired'));
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipient/profile/email`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: emailPassword,
          newEmail,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update email');
      }

      showMessage('success', t('recipient.settings.emailUpdated'));
      setNewEmail('');
      setEmailPassword('');
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleSettle = async () => {
    if (!settlementEmail) {
      showMessage('error', t('settlement.enterCaregiverEmail'));
      return;
    }

    setIsSettling(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipient/settle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ caregiverEmail: settlementEmail }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to settle');
      }

      // Refresh profile
      const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipient/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.data.profile);
      }
      setSettlementEmail('');
      showMessage('success', t('settlement.settleSuccess'));
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSettling(false);
    }
  };

  const handleUnsettle = async () => {
    setIsUnsettling(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipient/unsettle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to unsettle');
      }

      // Refresh profile
      const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipient/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData.data.profile);
      }
      showMessage('success', t('settlement.unsettleSuccess'));
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsUnsettling(false);
    }
  };

  const toggleCareNeed = (careNeedId: number) => {
    setSelectedCareNeeds(prev => {
      if (prev.includes(careNeedId)) {
        if (prev.length <= 1) return prev; // Must keep at least 1 care need
        return prev.filter(id => id !== careNeedId);
      }
      return [...prev, careNeedId];
    });
  };

  const tabs = [
    { key: 'profile' as SettingsTab, label: t('recipient.settings.tabs.profile'), icon: User },
    { key: 'careNeeds' as SettingsTab, label: t('recipient.settings.tabs.careNeeds'), icon: Heart },
    { key: 'settlement' as SettingsTab, label: t('settlement.tabTitle'), icon: Handshake },
    { key: 'password' as SettingsTab, label: t('recipient.settings.tabs.password'), icon: Lock },
    { key: 'email' as SettingsTab, label: t('recipient.settings.tabs.email'), icon: Mail },
    { key: 'language' as SettingsTab, label: t('settings.language'), icon: Globe },
  ];

  if (loading) {
    return (
      <CareRecipientLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
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
        >
          <h1 className="text-2xl font-bold text-gray-900">{t('recipient.settings.title')}</h1>
          <p className="text-gray-600 mt-1">{t('recipient.settings.subtitle')}</p>
        </motion.div>

        {/* Messages */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700"
          >
            <Check className="w-5 h-5" />
            {successMessage}
          </motion.div>
        )}

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
          >
            <AlertCircle className="w-5 h-5" />
            {errorMessage}
          </motion.div>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 bg-white p-2 rounded-xl border border-gray-200"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-amber-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Tab Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 lg:p-8"
        >
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Picture */}
              <ImageCropper
                currentImage={previewImage || profileImageUrl}
                onImageChange={handleImageChange}
                translationPrefix="recipient.settings"
              />

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('recipient.settings.firstName')}
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('recipient.settings.lastName')}
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('recipient.settings.phone')}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('recipient.settings.bio')}
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
                  placeholder={t('recipient.settings.bioPlaceholder')}
                />
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleProfileSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {t('recipient.settings.saveChanges')}
                </button>
              </div>
            </div>
          )}

          {/* Care Needs Tab */}
          {activeTab === 'careNeeds' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('recipient.settings.selectCareNeeds')}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t('recipient.settings.selectCareNeedsDesc')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allCareNeeds.map((careNeed) => (
                  <button
                    key={careNeed.id}
                    onClick={() => toggleCareNeed(careNeed.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      selectedCareNeeds.includes(careNeed.id)
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedCareNeeds.includes(careNeed.id)
                          ? 'border-amber-500 bg-amber-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedCareNeeds.includes(careNeed.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className={selectedCareNeeds.includes(careNeed.id) ? 'text-amber-700 font-medium' : 'text-gray-700'}>
                      {getCareNeedLabel(careNeed)}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleCareNeedsSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {t('recipient.settings.saveChanges')}
                </button>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="space-y-6 max-w-md">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('recipient.settings.changePassword')}
                </h3>
                <p className="text-gray-600">
                  {t('recipient.settings.changePasswordDesc')}
                </p>
              </div>

              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('recipient.settings.currentPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('recipient.settings.newPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">{t('recipient.settings.passwordMinLength')}</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('recipient.settings.confirmPassword')}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <X className="w-3 h-3" />
                    {t('recipient.settings.passwordsDoNotMatch')}
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handlePasswordChange}
                  disabled={saving || !currentPassword || !newPassword || newPassword !== confirmPassword}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Lock className="w-5 h-5" />
                  )}
                  {t('recipient.settings.updatePassword')}
                </button>
              </div>
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-6 max-w-md">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('recipient.settings.changeEmail')}
                </h3>
                <p className="text-gray-600">
                  {t('recipient.settings.changeEmailDesc')}
                </p>
              </div>

              {/* Current Email Display */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500">{t('recipient.settings.currentEmail')}</p>
                <p className="font-medium text-gray-900">{profile?.email}</p>
              </div>

              {/* New Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('recipient.settings.newEmail')}
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  placeholder="new@email.com"
                />
              </div>

              {/* Password Confirmation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('recipient.settings.confirmWithPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showEmailPassword ? 'text' : 'password'}
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    placeholder={t('recipient.settings.enterPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmailPassword(!showEmailPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showEmailPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleEmailChange}
                  disabled={saving || !newEmail || !emailPassword}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                  {t('recipient.settings.updateEmail')}
                </button>
              </div>
            </div>
          )}

          {/* Settlement Tab */}
          {activeTab === 'settlement' && (
            <div className="space-y-6 max-w-md">
              {profile?.isSettled ? (
                /* Currently settled - show status and unsettle option */
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Handshake className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{t('settlement.currentlySettled')}</h3>
                      <p className="text-sm text-gray-500">{t('settlement.currentlySettledDesc')}</p>
                    </div>
                  </div>

                  {profile.settledCaregiver && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-xl mb-6">
                      <p className="text-xs text-green-600 mb-1">{t('settlement.settledWith')}</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                          {profile.settledCaregiver.profileImageUrl ? (
                            <img src={profile.settledCaregiver.profileImageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <>{profile.settledCaregiver.firstName[0]}{profile.settledCaregiver.lastName[0]}</>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {profile.settledCaregiver.firstName} {profile.settledCaregiver.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{profile.settledCaregiver.email}</p>
                        </div>
                      </div>
                      {profile.settledAt && (
                        <p className="text-xs text-green-500 mt-2">
                          {t('settlement.settledSince')} {new Date(profile.settledAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
                    <p className="text-sm text-yellow-700">{t('settlement.unsettleWarning')}</p>
                  </div>

                  <button
                    onClick={handleUnsettle}
                    disabled={isUnsettling}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {isUnsettling ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <X className="w-5 h-5" />
                    )}
                    {t('settlement.unsettle')}
                  </button>
                </div>
              ) : (
                /* Not settled - show settle form */
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('settlement.settleTitle')}</h3>
                  <p className="text-gray-600 mb-6">{t('settlement.settleDesc')}</p>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                    <p className="text-sm text-amber-700">{t('settlement.settleInfo')}</p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('settlement.caregiverEmail')}
                    </label>
                    <input
                      type="email"
                      value={settlementEmail}
                      onChange={(e) => setSettlementEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                      placeholder={t('settlement.caregiverEmailPlaceholder')}
                    />
                  </div>

                  <button
                    onClick={handleSettle}
                    disabled={isSettling || !settlementEmail}
                    className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSettling ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Handshake className="w-5 h-5" />
                    )}
                    {t('settlement.settle')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Language Tab */}
          {activeTab === 'language' && (
            <div className="space-y-6 max-w-md">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('settings.language')}
                </h3>
                <p className="text-gray-600">
                  {t('settings.languageDesc')}
                </p>
              </div>

              <div className="pt-2">
                <LanguageSwitcher direction="down" fullWidth />
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </CareRecipientLayout>
  );
}
