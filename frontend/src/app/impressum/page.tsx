'use client';

import Link from "next/link";
import { useTranslation } from "@/context/LanguageContext";

export default function Impressum() {
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
          {t('imprint.title')}
        </h1>

        <div className="prose prose-lg text-muted">
          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            {t('imprint.accordingTo')}
          </h2>
          <p>
            Miteinander GmbH
            <br />
            Musterstraße 123
            <br />
            10115 Berlin
            <br />
            Deutschland
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            {t('imprint.contact')}
          </h2>
          <p>
            Telefon: +49 (0) 30 12345678
            <br />
            E-Mail: info@miteinander.de
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            {t('imprint.representedBy')}
          </h2>
          <p>{t('imprint.managingDirector')}: Max Mustermann</p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            {t('imprint.registration')}
          </h2>
          <p>
            {t('imprint.registrationInfo')}
            <br />
            {t('imprint.registryCourt')}: Amtsgericht Berlin-Charlottenburg
            <br />
            {t('imprint.registryNumber')}: HRB 123456
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            {t('imprint.vatId')}
          </h2>
          <p>
            {t('imprint.vatIdInfo')}:
            <br />
            DE 123456789
          </p>
        </div>
      </div>
    </main>
  );
}
