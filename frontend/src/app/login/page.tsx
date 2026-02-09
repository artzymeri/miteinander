'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, UserPlus } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { LogoBlack } from '@/components/Logo';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'support') {
        router.push('/support');
      } else if (user.role === 'care_giver') {
        router.push('/caregiver');
      } else if (user.role === 'care_recipient') {
        router.push('/dashboard');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const result = await login(email, password);
      
      if (result.success && result.role) {
        // Redirect based on role returned from API
        if (result.role === 'admin') {
          router.push('/admin');
        } else if (result.role === 'support') {
          router.push('/support');
        } else if (result.role === 'care_giver') {
          router.push('/caregiver');
        } else {
          router.push('/dashboard');
        }
      } else if (result.code === 'EMAIL_NOT_VERIFIED' && result.data?.email) {
        // Redirect to email verification
        router.push(`/verify-email?email=${encodeURIComponent(result.data.email)}`);
      } else {
        setError(result.error || t('login.invalidCredentials'));
      }
    } catch {
      setError(t('login.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
  }

  // Don't render if authenticated (will redirect)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - far left */}
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <LogoBlack width={48} height={40} className="w-10 h-8 sm:w-12 sm:h-10" />
            </Link>
            
            {/* Register button - filled style */}
            <Link 
              href="/registrieren" 
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t('login.registerNow')}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center pt-24 pb-16 px-4">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl shadow-xl p-8 sm:p-10"
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-3">
                {t('login.welcome')}
              </h1>
              <p className="text-gray-600">
                {t('login.subtitle')}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
              >
                {error}
              </motion.div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  {t('register.email')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('login.emailPlaceholder')}
                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    {t('register.password')}
                  </label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    {t('login.forgotPassword')}
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('login.passwordPlaceholder')}
                    className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                className={`
                  w-full py-4 px-6 rounded-xl font-semibold text-white
                  flex items-center justify-center gap-2
                  transition-all duration-200
                  ${isLoading 
                    ? 'bg-amber-400 cursor-not-allowed' 
                    : 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30'
                  }
                `}
                whileHover={!isLoading ? { scale: 1.02 } : {}}
                whileTap={!isLoading ? { scale: 0.98 } : {}}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    {t('login.loginButton')}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-500">{t('login.or')}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* Register Link */}
            <div className="text-center">
              <p className="text-gray-600">
                {t('login.noAccount')}{' '}
                <Link 
                  href="/registrieren" 
                  className="text-amber-600 hover:text-amber-700 font-medium transition-colors"
                >
                  {t('login.registerNow')}
                </Link>
              </p>
            </div>
          </motion.div>

          {/* Terms */}
          <p className="mt-6 text-center text-xs text-gray-500">
            {t('register.termsAgree')}{' '}
            <Link href="/agb" className="text-amber-600 hover:underline">{t('footer.terms')}</Link>
            {' '}{t('register.and')}{' '}
            <Link href="/datenschutz" className="text-amber-600 hover:underline">{t('footer.privacy')}</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
