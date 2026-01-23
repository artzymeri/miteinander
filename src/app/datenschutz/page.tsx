import Link from "next/link";

export default function Datenschutz() {
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
          Datenschutzerklärung
        </h1>

        <div className="prose prose-lg text-muted space-y-6">
          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            1. Datenschutz auf einen Blick
          </h2>
          <h3 className="text-xl font-serif text-primary mt-6 mb-3">
            Allgemeine Hinweise
          </h3>
          <p>
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was
            mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website
            besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie
            persönlich identifiziert werden können.
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            2. Allgemeine Hinweise und Pflichtinformationen
          </h2>
          <h3 className="text-xl font-serif text-primary mt-6 mb-3">
            Datenschutz
          </h3>
          <p>
            Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen
            Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten
            vertraulich und entsprechend der gesetzlichen
            Datenschutzvorschriften sowie dieser Datenschutzerklärung.
          </p>

          <h3 className="text-xl font-serif text-primary mt-6 mb-3">
            Hinweis zur verantwortlichen Stelle
          </h3>
          <p>
            Die verantwortliche Stelle für die Datenverarbeitung auf dieser
            Website ist:
          </p>
          <p>
            Miteinander GmbH
            <br />
            Musterstraße 123
            <br />
            10115 Berlin
            <br />
            Deutschland
          </p>
          <p>
            Telefon: +49 (0) 30 12345678
            <br />
            E-Mail: datenschutz@miteinander.de
          </p>

          <h2 className="text-2xl font-serif text-primary mt-8 mb-4">
            3. Datenerfassung auf dieser Website
          </h2>
          <h3 className="text-xl font-serif text-primary mt-6 mb-3">
            Cookies
          </h3>
          <p>
            Unsere Internetseiten verwenden so genannte „Cookies". Cookies sind
            kleine Textdateien und richten auf Ihrem Endgerät keinen Schaden an.
            Sie werden entweder vorübergehend für die Dauer einer Sitzung
            (Session-Cookies) oder dauerhaft (permanente Cookies) auf Ihrem
            Endgerät gespeichert.
          </p>

          <h3 className="text-xl font-serif text-primary mt-6 mb-3">
            Kontaktformular
          </h3>
          <p>
            Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden
            Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort
            angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den
            Fall von Anschlussfragen bei uns gespeichert.
          </p>
        </div>
      </div>
    </main>
  );
}
