import Link from "next/link";

export default function Impressum() {
  return (
    <main className="min-h-screen bg-background py-20">
      <div className="max-w-3xl mx-auto px-6">
        <Link
          href="/"
          className="text-accent hover:text-accent-light transition-colors mb-8 inline-block"
        >
          ← Zurück zur Startseite
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-serif text-primary mb-8">
          Impressum
        </h1>

        <div className="prose prose-lg text-muted">
          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            Angaben gemäß § 5 TMG
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
            Kontakt
          </h2>
          <p>
            Telefon: +49 (0) 30 12345678
            <br />
            E-Mail: info@miteinander.de
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            Vertreten durch
          </h2>
          <p>Geschäftsführer: Max Mustermann</p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            Registereintrag
          </h2>
          <p>
            Eintragung im Handelsregister.
            <br />
            Registergericht: Amtsgericht Berlin-Charlottenburg
            <br />
            Registernummer: HRB 123456
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            Umsatzsteuer-ID
          </h2>
          <p>
            Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:
            <br />
            DE 123456789
          </p>
        </div>
      </div>
    </main>
  );
}
