'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from '@/context/LanguageContext';

const languages = [
  { code: 'de' as const, label: 'DE', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'en' as const, label: 'EN', flag: '🇬🇧', name: 'English' },
  { code: 'fr' as const, label: 'FR', flag: '🇫🇷', name: 'Français' },
];

interface LanguageSwitcherProps {
  direction?: 'up' | 'down';
  fullWidth?: boolean;
}

export default function LanguageSwitcher({ direction = 'down', fullWidth = false }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === locale);

  const dropdownPosition = direction === 'up' 
    ? 'bottom-full mb-2' 
    : 'top-full mt-2';

  const animationY = direction === 'up' ? 10 : -10;

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''}`}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`${fullWidth ? 'w-full justify-between' : ''} flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors ${fullWidth ? 'border border-gray-200' : ''}`}
        whileHover={{ scale: fullWidth ? 1.01 : 1.05 }}
        whileTap={{ scale: fullWidth ? 0.99 : 0.95 }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{currentLanguage?.flag}</span>
          <span className={`text-sm font-medium ${fullWidth ? 'text-gray-700' : 'text-primary hidden sm:inline'}`}>
            {fullWidth ? currentLanguage?.name : currentLanguage?.label}
          </span>
        </div>
        <motion.svg
          className={`w-4 h-4 ${fullWidth ? 'text-gray-500' : 'text-primary'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              className={`absolute ${fullWidth ? 'left-0 right-0' : 'right-0 w-40'} ${dropdownPosition} bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50`}
              initial={{ opacity: 0, y: animationY }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: animationY }}
              transition={{ duration: 0.2 }}
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLocale(lang.code);
                    setIsOpen(false);
                  }}
                  className={`
                    w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer
                    ${locale === lang.code ? 'bg-amber-50' : ''}
                  `}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className={`
                    text-sm font-medium flex-1 text-left
                    ${locale === lang.code ? 'text-amber-600' : 'text-gray-700'}
                  `}>
                    {lang.name}
                  </span>
                  {locale === lang.code && (
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
