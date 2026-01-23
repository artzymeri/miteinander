import Link from "next/link";

export default function AGB() {
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
          Allgemeine Geschäftsbedingungen
        </h1>

        <div className="prose prose-lg text-muted space-y-6">
          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            § 1 Geltungsbereich
          </h2>
          <p>
            Diese Allgemeinen Geschäftsbedingungen gelten für alle
            Geschäftsbeziehungen zwischen der Miteinander GmbH und ihren Nutzern.
            Maßgeblich ist die jeweils bei Vertragsschluss gültige Fassung.
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            § 2 Vertragspartner
          </h2>
          <p>
            Der Vertrag kommt zustande mit:
            <br />
            <br />
            Miteinander GmbH
            <br />
            Musterstraße 123
            <br />
            10115 Berlin
            <br />
            Deutschland
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            § 3 Leistungsbeschreibung
          </h2>
          <p>
            Die Plattform Miteinander ermöglicht die Vermittlung zwischen
            pflegebedürftigen Personen bzw. deren Angehörigen und unabhängigen
            Pflegekräften. Miteinander tritt dabei lediglich als
            Vermittlungsplattform auf und ist nicht Vertragspartner der
            zwischen Nutzern geschlossenen Pflegevereinbarungen.
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            § 4 Registrierung
          </h2>
          <p>
            Für die Nutzung bestimmter Funktionen ist eine Registrierung
            erforderlich. Der Nutzer ist verpflichtet, bei der Registrierung
            wahrheitsgemäße Angaben zu machen und diese aktuell zu halten.
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            § 5 Haftung
          </h2>
          <p>
            Miteinander haftet nicht für die Qualität der über die Plattform
            vermittelten Pflegeleistungen. Die Verantwortung für die
            ordnungsgemäße Erbringung der Pflegeleistungen liegt allein bei den
            jeweiligen Pflegekräften.
          </p>
        </div>
      </div>
    </main>
  );
}
