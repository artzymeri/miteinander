'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Import translations
import enCommon from '@/locales/en/common.json';
import deCommon from '@/locales/de/common.json';
import frCommon from '@/locales/fr/common.json';

type Locale = 'en' | 'de' | 'fr';

type Translations = typeof deCommon;

const translations: Record<Locale, Translations> = {
  en: enCommon,
  de: deCommon,
  fr: frCommon,
};

interface LanguageContextType {
  locale: Locale;
  language: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'miteinander-locale';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('de');
  const [isHydrated, setIsHydrated] = useState(false);

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (savedLocale && ['en', 'de', 'fr'].includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
    setIsHydrated(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
  };

  // Translation function - supports nested keys like "nav.howItWorks"
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: unknown = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = (value as Record<string, unknown>)[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  // Prevent hydration mismatch by showing nothing until hydrated
  if (!isHydrated) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ locale, language: locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}

export function useLocale() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLocale must be used within a LanguageProvider');
  }
  return { locale: context.locale, setLocale: context.setLocale };
}
