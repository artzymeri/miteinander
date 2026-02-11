'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, ArrowRight, Loader2, CheckCircle, RefreshCw, KeyRound } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import Logo from '@/components/Logo';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

type Step = 'email' | 'code' | 'password' | 'success';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // ─── Step 1: Send reset code ───
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setStep('code');
        setResendCooldown(60);
      } else {
        const data = await response.json();
        setError(data.error?.message || t('forgotPassword.sendFailed'));
      }
    } catch {
      setError(t('forgotPassword.sendFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Code input handlers ───
  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError('');
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newCode = [...code];
      for (let i = 0; i < 6; i++) {
        newCode[i] = pasted[i] || '';
      }
      setCode(newCode);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  // ─── Step 2: Verify code → go to password step ───
  const handleVerifyCode = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError(t('forgotPassword.enterAllDigits'));
      return;
    }
    // We don't verify against the backend here — we'll send the code along
    // with the new password in step 3. Just advance the UI.
    setError('');
    setStep('password');
  };

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 6 && !code.includes('') && step === 'code') {
      handleVerifyCode();
    }
  }, [code, step]);

  // ─── Step 3: Reset password ───
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError(t('register.passwordMinLength') || 'Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t('register.passwordsDoNotMatch') || 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: code.join(''),
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStep('success');
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        const errorCode = data.error?.code;
        if (errorCode === 'INVALID_CODE') {
          setError(t('forgotPassword.invalidCode'));
          setStep('code');
          setCode(['', '', '', '', '', '']);
        } else if (errorCode === 'CODE_EXPIRED') {
          setError(t('forgotPassword.codeExpired'));
          setStep('code');
          setCode(['', '', '', '', '', '']);
        } else {
          setError(data.error?.message || t('forgotPassword.resetFailed'));
        }
      }
    } catch {
      setError(t('forgotPassword.resetFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Resend code ───
  const handleResend = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResendCooldown(60);
        setCode(['', '', '', '', '', '']);
      }
    } catch {
      setError(t('forgotPassword.sendFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Logo mainStroke="orangered" accentStroke="orangered" width={48} height={40} className="w-10 h-8 sm:w-12 sm:h-10" />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
            >
              {t('forgotPassword.backToLogin')}
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
            {/* ─── SUCCESS ─── */}
            {step === 'success' && (
              <div className="text-center py-4">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  {t('forgotPassword.successTitle')}
                </h2>
                <p className="text-gray-600 text-sm">
                  {t('forgotPassword.successMessage')}
                </p>
              </div>
            )}

            {/* ─── STEP 1: EMAIL ─── */}
            {step === 'email' && (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <KeyRound className="w-8 h-8 text-amber-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {t('forgotPassword.title')}
                  </h1>
                  <p className="text-gray-600 text-sm">
                    {t('forgotPassword.subtitle')}
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSendCode} className="space-y-5">
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

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className={`
                      w-full py-4 px-6 rounded-xl font-semibold text-white
                      flex items-center justify-center gap-2 transition-all duration-200
                      ${isLoading
                        ? 'bg-amber-400 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30'
                      }
                    `}
                    whileHover={!isLoading ? { scale: 1.02 } : {}}
                    whileTap={!isLoading ? { scale: 0.98 } : {}}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {t('forgotPassword.sendCode')}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </form>

                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('forgotPassword.backToLogin')}
                  </Link>
                </div>
              </>
            )}

            {/* ─── STEP 2: CODE ─── */}
            {step === 'code' && (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-8 h-8 text-amber-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {t('forgotPassword.checkEmail')}
                  </h1>
                  <p className="text-gray-600 text-sm">
                    {t('forgotPassword.codeSent')}
                  </p>
                  <p className="text-amber-600 font-medium text-sm mt-1">{email}</p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Code Inputs */}
                <div className="flex justify-center gap-2 sm:gap-3 mb-6" onPaste={handleCodePaste}>
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleCodeChange(i, e.target.value)}
                      onKeyDown={e => handleCodeKeyDown(i, e)}
                      className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all ${
                        error
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
                      }`}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>

                <button
                  onClick={handleVerifyCode}
                  disabled={code.join('').length !== 6}
                  className="w-full py-3.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {t('forgotPassword.verifyCode')}
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Resend */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-500 mb-2">
                    {t('forgotPassword.noCode')}
                  </p>
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || isLoading}
                    className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center justify-center gap-1.5 mx-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    {resendCooldown > 0
                      ? `${t('forgotPassword.resendIn')} ${resendCooldown}s`
                      : t('forgotPassword.resendCode')
                    }
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <button
                    onClick={() => { setStep('email'); setError(''); setCode(['', '', '', '', '', '']); }}
                    className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {t('forgotPassword.changeEmail')}
                  </button>
                </div>
              </>
            )}

            {/* ─── STEP 3: NEW PASSWORD ─── */}
            {step === 'password' && (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-amber-600" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {t('forgotPassword.newPasswordTitle')}
                  </h1>
                  <p className="text-gray-600 text-sm">
                    {t('forgotPassword.newPasswordSubtitle')}
                  </p>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-5">
                  {/* New Password */}
                  <div className="space-y-2">
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                      {t('forgotPassword.newPassword')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('forgotPassword.newPasswordPlaceholder')}
                        className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
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
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      {t('register.confirmPassword')}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('forgotPassword.confirmPasswordPlaceholder')}
                        className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className={`
                      w-full py-4 px-6 rounded-xl font-semibold text-white
                      flex items-center justify-center gap-2 transition-all duration-200
                      ${isLoading
                        ? 'bg-amber-400 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-500/30'
                      }
                    `}
                    whileHover={!isLoading ? { scale: 1.02 } : {}}
                    whileTap={!isLoading ? { scale: 0.98 } : {}}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {t('forgotPassword.resetPassword')}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </main>
  );
}
