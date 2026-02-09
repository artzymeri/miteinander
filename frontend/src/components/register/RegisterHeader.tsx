'use client';

import { FC } from 'react';
import Link from 'next/link';
import { Home, LogIn } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { LogoBlack } from '@/components/Logo';

const RegisterHeader: FC = () => {
  const { t } = useTranslation();
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <LogoBlack width={48} height={40} className="w-10 h-8 sm:w-12 sm:h-10" />
          </Link>
          
          {/* Right: Home & Login */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Link 
              href="/" 
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-600 border-2 border-amber-600 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">{t('common.home')}</span>
            </Link>
            
            <Link 
              href="/login" 
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-amber-500 rounded-lg hover:bg-amber-600 transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">{t('nav.login')}</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default RegisterHeader;
