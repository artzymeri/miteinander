'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import CareGiverLayout from '@/components/caregiver/CareGiverLayout';
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
  Briefcase,
  Star,
  Award,
  Plus,
  Trash2,
  Globe,
  CreditCard,
} from 'lucide-react';
import ImageCropper from '@/components/shared/ImageCropper';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SubscriptionTab from '@/components/shared/SubscriptionTab';

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
  memberSince: string;
}

type SettingsTab = 'profile' | 'skills' | 'certifications' | 'password' | 'email' | 'subscription' | 'language';

export default function CareGiverSettingsPage() {
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
  const [occupation, setOccupation] = useState('');
  const [experienceYears, setExperienceYears] = useState<number | ''>('');
  const [bio, setBio] = useState('');
  const [profileImageUrl, setProfileImageUrl] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Skills form state
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Certifications form state
  const [certifications, setCertifications] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState('');

  // Email form state
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch profile and care needs in parallel
        const [profileRes, careNeedsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/caregiver/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/caregiver/clients/filters`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!profileRes.ok || !careNeedsRes.ok) {
          throw new Error('Failed to fetch data');
        }

        const profileData = await profileRes.json();
        const careNeedsData = await careNeedsRes.json();

        const fetchedProfile = profileData.data.profile;
        setProfile(fetchedProfile);
        setAllCareNeeds(careNeedsData.data.careNeeds || []);

        // Initialize form state
        setFirstName(fetchedProfile.firstName || '');
        setLastName(fetchedProfile.lastName || '');
        setPhone(fetchedProfile.phone || '');
        setOccupation(fetchedProfile.occupation || '');
        setExperienceYears(fetchedProfile.experienceYears || '');
        setBio(fetchedProfile.bio || '');
        setProfileImageUrl(fetchedProfile.profileImageUrl || '');
        setSelectedSkills(fetchedProfile.skills?.map((s: CareNeed) => s.id) || []);
        setCertifications(fetchedProfile.certifications || []);
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/caregiver/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          occupation,
          experienceYears: experienceYears === '' ? null : experienceYears,
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
      showMessage('success', t('caregiver.settings.profileUpdated'));
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleSkillsSave = async () => {
    if (selectedSkills.length === 0) {
      showMessage('error', t('caregiver.settings.minOneSkill'));
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/caregiver/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          skills: selectedSkills,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update skills');
      }

      showMessage('success', t('caregiver.settings.skillsUpdated'));
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      showMessage('error', t('caregiver.settings.passwordsDoNotMatch'));
      return;
    }

    if (newPassword.length < 8) {
      showMessage('error', t('caregiver.settings.passwordTooShort'));
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/caregiver/profile/password`, {
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

      showMessage('success', t('caregiver.settings.passwordUpdated'));
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
      showMessage('error', t('caregiver.settings.allFieldsRequired'));
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/caregiver/profile/email`, {
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

      showMessage('success', t('caregiver.settings.emailUpdated'));
      setNewEmail('');
      setEmailPassword('');
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const toggleSkill = (skillId: number) => {
    setSelectedSkills(prev => {
      if (prev.includes(skillId)) {
        if (prev.length <= 1) return prev; // Must keep at least 1 skill
        return prev.filter(id => id !== skillId);
      }
      return [...prev, skillId];
    });
  };

  const addCertification = () => {
    if (newCertification.trim() && !certifications.includes(newCertification.trim())) {
      setCertifications([...certifications, newCertification.trim()]);
      setNewCertification('');
    }
  };

  const removeCertification = (index: number) => {
    setCertifications(certifications.filter((_, i) => i !== index));
  };

  const handleCertificationsSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/caregiver/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          certifications: JSON.stringify(certifications),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update certifications');
      }

      showMessage('success', t('caregiver.settings.certificationsUpdated'));
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { key: 'profile' as SettingsTab, label: t('caregiver.settings.tabs.profile'), icon: User },
    { key: 'skills' as SettingsTab, label: t('caregiver.settings.tabs.skills'), icon: Star },
    { key: 'certifications' as SettingsTab, label: t('caregiver.settings.tabs.certifications'), icon: Award },
    { key: 'password' as SettingsTab, label: t('caregiver.settings.tabs.password'), icon: Lock },
    { key: 'email' as SettingsTab, label: t('caregiver.settings.tabs.email'), icon: Mail },
    { key: 'subscription' as SettingsTab, label: t('plans.manageSubscription'), icon: CreditCard },
    { key: 'language' as SettingsTab, label: t('settings.language'), icon: Globe },
  ];

  if (loading) {
    return (
      <CareGiverLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
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
        >
          <h1 className="text-2xl font-bold text-gray-900">{t('caregiver.settings.title')}</h1>
          <p className="text-gray-600 mt-1">{t('caregiver.settings.subtitle')}</p>
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
                translationPrefix="caregiver.settings"
              />

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('caregiver.settings.firstName')}
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
                    {t('caregiver.settings.lastName')}
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
                  {t('caregiver.settings.phone')}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
              </div>

              {/* Occupation & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('caregiver.settings.occupation')}
                  </label>
                  <input
                    type="text"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('caregiver.settings.experienceYears')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('caregiver.settings.bio')}
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all resize-none"
                  placeholder={t('caregiver.settings.bioPlaceholder')}
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
                  {t('caregiver.settings.saveChanges')}
                </button>
              </div>
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('caregiver.settings.selectSkills')}
                </h3>
                <p className="text-gray-600 mb-4">
                  {t('caregiver.settings.selectSkillsDesc')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allCareNeeds.map((careNeed) => (
                  <button
                    key={careNeed.id}
                    onClick={() => toggleSkill(careNeed.id)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      selectedSkills.includes(careNeed.id)
                        ? 'border-amber-500 bg-amber-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedSkills.includes(careNeed.id)
                          ? 'border-amber-500 bg-amber-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedSkills.includes(careNeed.id) && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span className={selectedSkills.includes(careNeed.id) ? 'text-amber-700 font-medium' : 'text-gray-700'}>
                      {getCareNeedLabel(careNeed)}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSkillsSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {t('caregiver.settings.saveChanges')}
                </button>
              </div>
            </div>
          )}

          {/* Certifications Tab */}
          {activeTab === 'certifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('caregiver.settings.manageCertifications')}
                </h3>
                <p className="text-gray-600">
                  {t('caregiver.settings.manageCertificationsDesc')}
                </p>
              </div>

              {/* Add New Certification */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newCertification}
                  onChange={(e) => setNewCertification(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCertification()}
                  placeholder={t('caregiver.settings.certificationPlaceholder')}
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                />
                <button
                  onClick={addCertification}
                  disabled={!newCertification.trim()}
                  className="flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5" />
                  {t('caregiver.settings.addCertification')}
                </button>
              </div>

              {/* Certifications List */}
              <div className="space-y-3">
                {certifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>{t('caregiver.settings.noCertifications')}</p>
                  </div>
                ) : (
                  certifications.map((cert, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Award className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-gray-700 font-medium">{cert}</span>
                      </div>
                      <button
                        onClick={() => removeCertification(index)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleCertificationsSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  {t('caregiver.settings.saveChanges')}
                </button>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="space-y-6 max-w-md">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('caregiver.settings.changePassword')}
                </h3>
                <p className="text-gray-600">
                  {t('caregiver.settings.changePasswordDesc')}
                </p>
              </div>

              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('caregiver.settings.currentPassword')}
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
                  {t('caregiver.settings.newPassword')}
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
                <p className="text-xs text-gray-500 mt-1">{t('caregiver.settings.passwordMinLength')}</p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('caregiver.settings.confirmPassword')}
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
                    {t('caregiver.settings.passwordsDoNotMatch')}
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
                  {t('caregiver.settings.updatePassword')}
                </button>
              </div>
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-6 max-w-md">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('caregiver.settings.changeEmail')}
                </h3>
                <p className="text-gray-600">
                  {t('caregiver.settings.changeEmailDesc')}
                </p>
              </div>

              {/* Current Email Display */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500">{t('caregiver.settings.currentEmail')}</p>
                <p className="font-medium text-gray-900">{profile?.email}</p>
              </div>

              {/* New Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('caregiver.settings.newEmail')}
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
                  {t('caregiver.settings.confirmWithPassword')}
                </label>
                <div className="relative">
                  <input
                    type={showEmailPassword ? 'text' : 'password'}
                    value={emailPassword}
                    onChange={(e) => setEmailPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    placeholder={t('caregiver.settings.enterPassword')}
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
                  {t('caregiver.settings.updateEmail')}
                </button>
              </div>
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <SubscriptionTab />
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
    </CareGiverLayout>
  );
}
