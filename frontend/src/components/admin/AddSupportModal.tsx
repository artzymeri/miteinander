'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import { X, UserPlus, Mail, Phone, Lock, User, Eye, EyeOff } from 'lucide-react';
import { SupportFormData } from '@/lib/api';

interface AddSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SupportFormData) => Promise<void>;
  isLoading?: boolean;
}

export default function AddSupportModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: AddSupportModalProps) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<SupportFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  });

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', password: '', phone: '' });
    setErrors({});
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = t('admin.addSupport.errors.firstNameRequired');
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = t('admin.addSupport.errors.lastNameRequired');
    }
    if (!formData.email.trim()) {
      newErrors.email = t('admin.addSupport.errors.emailRequired');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('admin.addSupport.errors.emailInvalid');
    }
    if (!formData.password) {
      newErrors.password = t('admin.addSupport.errors.passwordRequired');
    } else if (formData.password.length < 8) {
      newErrors.password = t('admin.addSupport.errors.passwordMin');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (key: keyof SupportFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      await onSubmit(formData);
      resetForm();
    } catch {
      // Error handling done by parent
    }
  };

  if (!isOpen) return null;

  const fields = [
    { key: 'firstName' as const, label: t('admin.fields.firstName'), icon: User, type: 'text', required: true },
    { key: 'lastName' as const, label: t('admin.fields.lastName'), icon: User, type: 'text', required: true },
    { key: 'email' as const, label: t('admin.fields.email'), icon: Mail, type: 'email', required: true },
    { key: 'phone' as const, label: t('admin.fields.phone'), icon: Phone, type: 'tel', required: false },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={handleClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <UserPlus className="text-amber-600" size={20} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                {t('admin.addSupport.title')}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <p className="text-sm text-gray-500 mb-2">
              {t('admin.addSupport.description')}
            </p>

            {/* Text fields */}
            {fields.map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.key} className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  <div className="relative">
                    <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.label}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${
                        errors[field.key] ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-amber-500 focus:ring-amber-500/20'
                      } focus:ring-2 outline-none transition-all`}
                    />
                  </div>
                  {errors[field.key] && (
                    <p className="text-xs text-red-500">{errors[field.key]}</p>
                  )}
                </div>
              );
            })}

            {/* Password field */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {t('admin.addSupport.password')}
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  placeholder={t('admin.addSupport.passwordPlaceholder')}
                  className={`w-full pl-10 pr-12 py-2.5 rounded-lg border ${
                    errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:border-amber-500 focus:ring-amber-500/20'
                  } focus:ring-2 outline-none transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
              <p className="text-xs text-gray-400">{t('admin.addSupport.passwordHint')}</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {t('admin.modal.cancel')}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                <UserPlus size={18} />
                {isLoading ? t('admin.addSupport.creating') : t('admin.addSupport.create')}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
