'use client';

import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

export default function AGB() {
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
          {t('terms.title')}
        </h1>

        <div className="prose prose-lg text-muted space-y-6">
          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            {t('terms.scope')}
          </h2>
          <p>
            {t('terms.scopeText')}
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            {t('terms.contractPartner')}
          </h2>
          <p>
            {t('terms.contractPartnerText')}
            <br />
            <br />
            MyHelper GmbH
            <br />
            Musterstraße 123
            <br />
            10115 Berlin
            <br />
            Deutschland
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            {t('terms.serviceDescription')}
          </h2>
          <p>
            {t('terms.serviceDescriptionText')}
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            {t('terms.registration')}
          </h2>
          <p>
            {t('terms.registrationText')}
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            {t('terms.liability')}
          </h2>
          <p>
            {t('terms.liabilityText')}
          </p>
        </div>
      </div>
    </main>
  );
}
