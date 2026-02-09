'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslation } from '@/context/LanguageContext';
import { API_URL } from '@/lib/api';
import { Mail, ArrowLeft, Loader2, CheckCircle, RefreshCw } from 'lucide-react';

export default function VerifyEmailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-submit when all 6 digits are entered
  useEffect(() => {
    const fullCode = code.join('');
    if (fullCode.length === 6 && !code.includes('')) {
      handleVerify(fullCode);
    }
  }, [code]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only digits
    
    const newCode = [...code];
    newCode[index] = value.slice(-1); // Only last character
    setCode(newCode);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
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

  const handleVerify = async (fullCode?: string) => {
    const verificationCode = fullCode || code.join('');
    if (verificationCode.length !== 6) {
      setError(t('verify.enterAllDigits'));
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorCode = data.error?.code;
        if (errorCode === 'INVALID_CODE') {
          setError(t('verify.invalidCode'));
        } else if (errorCode === 'CODE_EXPIRED') {
          setError(t('verify.codeExpired'));
        } else {
          setError(data.error?.message || t('verify.verificationFailed'));
        }
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      setVerified(true);

      // If token returned, store it for auto-login
      if (data.data?.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify({ ...data.data.user, role: data.data.role }));
      }

      // Redirect after brief success display
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch {
      setError(t('verify.verificationFailed'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setResendCooldown(60);
      }
    } catch {
      setError(t('verify.resendFailed'));
    } finally {
      setIsResending(false);
    }
  };

  if (!email) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 px-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t('verify.noEmail')}</p>
          <a href="/registrieren" className="text-amber-600 hover:text-amber-700 font-medium">
            {t('verify.goToRegister')}
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-orange-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10">
          {verified ? (
            <div className="text-center py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {t('verify.verified')}
              </h2>
              <p className="text-gray-600">
                {t('verify.redirecting')}
              </p>
            </div>
          ) : (
            <>
              {/* Icon */}
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-amber-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {t('verify.title')}
                </h1>
                <p className="text-gray-600 text-sm">
                  {t('verify.subtitle')}
                </p>
                <p className="text-amber-600 font-medium text-sm mt-1">{email}</p>
              </div>

              {/* Code Inputs */}
              <div className="flex justify-center gap-2 sm:gap-3 mb-6" onPaste={handlePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold rounded-xl border-2 outline-none transition-all ${
                      error
                        ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-gray-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
                    }`}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
                  {error}
                </div>
              )}

              {/* Verify Button */}
              <button
                onClick={() => handleVerify()}
                disabled={isVerifying || code.join('').length !== 6}
                className="w-full py-3.5 bg-amber-500 text-white rounded-xl font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('verify.verifying')}
                  </>
                ) : (
                  t('verify.verifyButton')
                )}
              </button>

              {/* Resend */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500 mb-2">
                  {t('verify.noCode')}
                </p>
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isResending}
                  className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center justify-center gap-1.5 mx-auto cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {resendCooldown > 0
                    ? `${t('verify.resendIn')} ${resendCooldown}s`
                    : t('verify.resendCode')
                  }
                </button>
              </div>

              {/* Back */}
              <div className="mt-6 text-center">
                <a
                  href="/registrieren"
                  className="text-sm text-gray-500 hover:text-gray-700 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('verify.backToRegister')}
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
