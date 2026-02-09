'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import { X, Save, User, Mail, Phone, MapPin, Calendar } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type UserData = Record<string, any>;

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
  const [formData, setFormData] = useState<UserData>({});

  useEffect(() => {
    if (user) {
      setFormData(user);
    }
  }, [user]);

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

  const statusFields = [
    { key: 'isActive', label: t('admin.fields.isActive') },
    ...(userType === 'careGiver' ? [{ key: 'isVerified', label: t('admin.fields.isVerified') }] : []),
  ];

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
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-amber-700 font-semibold text-xl">
                  {String(formData.firstName || '')[0]}
                  {String(formData.lastName || '')[0]}
                </span>
              </div>
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

            {/* Status toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {statusFields.map((field) => (
                <div key={field.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{field.label}</span>
                  {mode === 'view' ? (
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        formData[field.key]
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {formData[field.key] ? t('admin.status.yes') : t('admin.status.no')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleChange(field.key, !formData[field.key])}
                      className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                        formData[field.key] ? 'bg-amber-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          formData[field.key] ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  )}
                </div>
              ))}
            </div>

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
