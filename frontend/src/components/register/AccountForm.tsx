'use client';

import { FC } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/context/LanguageContext';

interface AccountFormProps {
  email: string;
  password: string;
  confirmPassword: string;
  onChange: (updates: { email?: string; password?: string; confirmPassword?: string }) => void;
}

const AccountForm: FC<AccountFormProps> = ({ email, password, confirmPassword, onChange }) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch = password === confirmPassword;
  const passwordLongEnough = password.length >= 8;

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('register.accountDataTitle')}</h2>
        <p className="mt-2 text-gray-600">{t('register.fillAccountFields')}</p>
      </div>

      <div className="space-y-4">
        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            {t('register.email')} *
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="ihre@email.de"
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
              required
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            {t('register.password')} *
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => onChange({ password: e.target.value })}
              placeholder="••••••••"
              className={`w-full pl-12 pr-12 py-3.5 rounded-xl border ${
                password && !passwordLongEnough ? 'border-red-300' : 'border-gray-200'
              } focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400`}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {password && !passwordLongEnough && (
            <p className="text-sm text-red-500">{t('register.passwordMinLength')}</p>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            {t('register.confirmPassword')} *
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => onChange({ confirmPassword: e.target.value })}
              placeholder="••••••••"
              className={`w-full pl-12 pr-12 py-3.5 rounded-xl border ${
                confirmPassword && !passwordsMatch ? 'border-red-300' : 'border-gray-200'
              } focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400`}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {confirmPassword && !passwordsMatch && (
            <p className="text-sm text-red-500">{t('register.passwordsDoNotMatch')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountForm;
