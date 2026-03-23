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
            Rhoda Mutheu Fideler
            <br />
            MeritaCare
            <br />
            Im Hof 16
            <br />
            88069 Tettnang
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            {t('imprint.contact')}
          </h2>
          <p>
            {t('imprint.phone')}: +49 152/09465369
            <br />
            {t('imprint.email')}: info@merita.care
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            {t('imprint.vatId')}
          </h2>
          <p>
            {t('imprint.vatIdInfo')}:
            <br />
            DE313056089
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            {t('imprint.editoriallyResponsible')}
          </h2>
          <p>Rhoda Mutheu Fideler</p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            {t('imprint.designAndDevelopment')}
          </h2>
          <p>
            Made with ❤️ from TM-Solution GmbH
            <br />
            <a
              href="https://www.tm-solution.de"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-light transition-colors"
            >
              www.tm-solution.de
            </a>
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            {t('imprint.euDisputeResolution')}
          </h2>
          <p>
            {t('imprint.euDisputeResolutionText')}{' '}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:text-accent-light transition-colors"
            >
              https://ec.europa.eu/consumers/odr/
            </a>
            .
            <br />
            {t('imprint.emailInImprint')}
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            {t('imprint.consumerDispute')}
          </h2>
          <p>
            {t('imprint.consumerDisputeText')}
          </p>
        </div>
      </div>
    </main>
  );
}
