'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, CheckCircle, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/LanguageContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const { token } = useAuth();
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSend = async () => {
    if (!message.trim()) {
      setError(t('feedback.emptyError'));
      return;
    }

    setStatus('sending');
    setError('');

    try {
      const res = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: message.trim() }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus('success');
        setTimeout(() => {
          setMessage('');
          setStatus('idle');
          onClose();
        }, 2000);
      } else {
        setStatus('error');
        setError(t('feedback.error'));
      }
    } catch {
      setStatus('error');
      setError(t('feedback.error'));
    }
  };

  const handleClose = () => {
    if (status === 'sending') return;
    setMessage('');
    setStatus('idle');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-amber-500" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{t('feedback.title')}</h3>
                    <p className="text-xs text-gray-500">{t('feedback.subtitle')}</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                {status === 'success' ? (
                  <div className="flex flex-col items-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                    <p className="text-lg font-medium text-gray-900">{t('feedback.success')}</p>
                  </div>
                ) : (
                  <>
                    <textarea
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        if (error) setError('');
                      }}
                      placeholder={t('feedback.placeholder')}
                      rows={5}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-gray-900 placeholder:text-gray-400 resize-none"
                      disabled={status === 'sending'}
                    />
                    {error && (
                      <p className="text-sm text-red-500 mt-2">{error}</p>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              {status !== 'success' && (
                <div className="px-6 pb-6">
                  <button
                    onClick={handleSend}
                    disabled={status === 'sending'}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white py-3 rounded-xl font-medium transition-colors cursor-pointer"
                  >
                    {status === 'sending' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('feedback.sending')}
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        {t('feedback.send')}
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
