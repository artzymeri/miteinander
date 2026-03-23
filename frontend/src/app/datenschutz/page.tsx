'use client';

import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

export default function Datenschutz() {
  const { t } = useTranslation();
  
  return (
    <main className="min-h-screen bg-background py-20">
      <div className="max-w-3xl mx-auto px-6">
        <Link
          href="/"
          className="text-accent hover:text-accent-light transition-colors mb-8 inline-block"
        >
          {t('common.backToHome')}
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-serif text-primary mb-8">
          {t('privacy.title')}
        </h1>

        <div className="prose prose-lg text-muted space-y-6">
          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            {t('privacy.overview')}
          </h2>
          <h3 className="text-xl font-serif text-primary mt-6 mb-3">
            {t('privacy.generalInfo')}
          </h3>
          <p>
            {t('privacy.generalInfoText')}
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            {t('privacy.generalAndMandatory')}
          </h2>
          <h3 className="text-xl font-serif text-primary mt-6 mb-3">
            {t('privacy.dataProtection')}
          </h3>
          <p>
            {t('privacy.dataProtectionText')}
          </p>

          <h3 className="text-xl font-serif text-primary mt-6 mb-3">
            {t('privacy.responsibleParty')}
          </h3>
          <p>
            {t('privacy.responsiblePartyText')}
          </p>
          <p>
            Rhoda Mutheu Fideler
            <br />
            MeritaCare
            <br />
            Im Hof 16
            <br />
            88069 Tettnang
          </p>
          <p>
            {t('imprint.phone')}: +49 152/09465369
            <br />
            {t('imprint.email')}: info@merita.care
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            {t('privacy.dataCollection')}
          </h2>
          <h3 className="text-xl font-serif text-primary mt-6 mb-3">
            {t('privacy.cookies')}
          </h3>
          <p>
            {t('privacy.cookiesText')}
          </p>

          <h3 className="text-xl font-serif text-primary mt-6 mb-3">
            {t('privacy.contactForm')}
          </h3>
          <p>
            {t('privacy.contactFormText')}
          </p>
        </div>
      </div>
    </main>
  );
}
