import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { buildAlternates, buildOpenGraph, seoKeywords } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  const title = t("impressumTitle");
  const description = t("impressumDesc");
  return {
    title,
    description,
    keywords: seoKeywords("legal"),
    alternates: buildAlternates(locale, "/impressum"),
    openGraph: buildOpenGraph(title, description),
  };
}

export default async function ImpressumPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  const isPl = locale === "pl";
  const isDe = locale === "de";

  return (
    <article className="prose prose-stone dark:prose-invert max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-display font-semibold mb-2">
        {t("impressumTitle")}
      </h1>
      <p className="text-sm text-stone-500 mb-10">
        {isPl
          ? "Ostatnia aktualizacja: 26 kwietnia 2026"
          : isDe
          ? "Zuletzt aktualisiert: 26. April 2026"
          : "Last updated: April 26, 2026"}
      </p>

      {isPl ? <ImpressumPl /> : isDe ? <ImpressumDe /> : <ImpressumEn />}
    </article>
  );
}

function ImpressumPl() {
  return (
    <>
      <h2>1. Informacje o serwisie</h2>
      <p>
        Bean Map to internetowy katalog palarni i kawiarni kawy specialty,
        umożliwiający użytkownikom wyszukiwanie, przeglądanie i rejestrowanie
        profili roasting facilities oraz kawiarni na całym świecie.
      </p>
      <p>
        Serwis dostępny jest pod adresem: beanmap.pl oraz beanmap.cafe.
      </p>

      <h2>2. Operator serwisu</h2>
      <p>
        Administratorem danych osobowych i operatorem serwisu jest:
      </p>
      <p className="pl-4 border-l-4 border-stone-200 dark:border-stone-700">
        <strong>Bean Map</strong><br />
        [Imię i nazwisko do uzupełnienia]<br />
        [Adres do uzupełnienia]<br />
        [Kod pocztowy, Miasto do uzupełnienia]<br />
        NIP: [NIP do uzupełnienia]<br />
        REGON: [REGON do uzupełnienia]<br />
        E-mail: <a href="mailto:hello@beanmap.cafe" className="text-orange-600 hover:underline">hello@beanmap.cafe</a>
      </p>

      <h2>3. Kontakt</h2>
      <p>
        W sprawach dotyczących serwisu, w tym w zakresie ochrony danych osobowych,
        prosimy o kontakt:
      </p>
      <ul>
        <li>E-mail: <a href="mailto:hello@beanmap.cafe" className="text-orange-600 hover:underline">hello@beanmap.cafe</a></li>
      </ul>

      <h2>4. Odpowiedzialność za treści</h2>
      <p>
        Serwis Bean Map pełni funkcję katalogu informacyjnego. Treści zamieszczane
        przez użytkowników (recenzje, opisy) nie są weryfikowane przez operatora
        przed publikacją, z wyjątkiem profili zgłoszonych do rejestracji.
      </p>
      <p>
        Operator nie ponosi odpowiedzialności za treści udostępniane przez
        użytkowników serwisu ani za aktualność danych w katalogu.
      </p>

      <h2>5. Prawa własności intelektualnej</h2>
      <p>
        Wszystkie prawa do elementów serwisu, w tym design, kod źródłowy i znaki
        towarowe, należą do operatora lub są używane za zgodą ich właścicieli.
      </p>

      <h2>6. Rozstrzyganie sporów</h2>
      <p>
        W sprawach spornych związanych z korzystaniem z serwisu, prosimy o
        kontakt mailowy w celu rozwiązania problemu. W przypadku braku porozumienia,
        spory rozstrzygane są przez właściwe sądy powszechne.
      </p>
    </>
  );
}

function ImpressumEn() {
  return (
    <>
      <h2>1. About the Service</h2>
      <p>
        Bean Map is an online directory of specialty coffee roasters and cafés,
        enabling users to search, browse, and register profiles of roasting facilities
        and cafés worldwide.
      </p>
      <p>
        The service is available at: beanmap.pl and beanmap.cafe.
      </p>

      <h2>2. Service Operator</h2>
      <p>
        The data controller and service operator is:
      </p>
      <p className="pl-4 border-l-4 border-stone-200 dark:border-stone-700">
        <strong>Bean Map</strong><br />
        [Name to be completed]<br />
        [Address to be completed]<br />
        [Postal code, City to be completed]<br />
        VAT ID: [VAT ID to be completed]<br />
        E-mail: <a href="mailto:hello@beanmap.cafe" className="text-orange-600 hover:underline">hello@beanmap.cafe</a>
      </p>

      <h2>3. Contact</h2>
      <p>
        For matters related to the service, including data protection, please contact:
      </p>
      <ul>
        <li>Email: <a href="mailto:hello@beanmap.cafe" className="text-orange-600 hover:underline">hello@beanmap.cafe</a></li>
      </ul>

      <h2>4. Content Responsibility</h2>
      <p>
        Bean Map serves as an information directory. Content posted by users (reviews,
        descriptions) is not verified by the operator before publication, except for
        profiles submitted for registration.
      </p>
      <p>
        The operator is not responsible for content shared by service users or for
        the accuracy of data in the directory.
      </p>

      <h2>5. Intellectual Property</h2>
      <p>
        All rights to service elements, including design, source code, and trademarks,
        belong to the operator or are used with the consent of their owners.
      </p>

      <h2>6. Dispute Resolution</h2>
      <p>
        For disputes related to the use of the service, please contact us via email
        to resolve the issue. If no agreement is reached, disputes are resolved by
        competent courts.
      </p>
    </>
  );
}

function ImpressumDe() {
  return (
    <>
      <h2>1. Über den Dienst</h2>
      <p>
        Bean Map ist ein Online-Verzeichnis von Specialty-Coffee-Röstereien und Cafés,
        das Nutzern ermöglicht, Röstereien und Cafés weltweit zu suchen, zu durchsuchen
        und Profile zu registrieren.
      </p>
      <p>
        Der Dienst ist verfügbar unter: beanmap.pl und beanmap.cafe.
      </p>

      <h2>2. Dienstanbieter</h2>
      <p>
        Verantwortlicher für personenbezogene Daten und Dienstanbieter ist:
      </p>
      <p className="pl-4 border-l-4 border-stone-200 dark:border-stone-700">
        <strong>Bean Map</strong><br />
        [Name einzutragen]<br />
        [Adresse einzutragen]<br />
        [Postleitzahl, Stadt einzutragen]<br />
        USt-IdNr.: [USt-IdNr. einzutragen]<br />
        E-Mail: <a href="mailto:hello@beanmap.cafe" className="text-orange-600 hover:underline">hello@beanmap.cafe</a>
      </p>

      <h2>3. Kontakt</h2>
      <p>
        Bei Fragen zum Dienst, einschließlich Datenschutz, kontaktieren Sie uns bitte:
      </p>
      <ul>
        <li>E-Mail: <a href="mailto:hello@beanmap.cafe" className="text-orange-600 hover:underline">hello@beanmap.cafe</a></li>
      </ul>

      <h2>4. Verantwortung für Inhalte</h2>
      <p>
        Bean Map dient als Informationsverzeichnis. Inhalte, die von Nutzern
        veröffentlicht werden (Bewertungen, Beschreibungen), werden vom Anbieter vor
        der Veröffentlichung nicht überprüft, mit Ausnahme von Profilen, die zur
        Registrierung eingereicht wurden.
      </p>
      <p>
        Der Anbieter ist nicht verantwortlich für Inhalte, die von Nutzern des
        Dienstes geteilt werden, oder für die Aktualität der Daten im Verzeichnis.
      </p>

      <h2>5. Geistiges Eigentum</h2>
      <p>
        Alle Rechte an Dienstelementen, einschließlich Design, Quellcode und Marken,
        gehören dem Anbieter oder werden mit Zustimmung ihrer Eigentümer verwendet.
      </p>

      <h2>6. Streitbeilegung</h2>
      <p>
        Bei Streitigkeiten im Zusammenhang mit der Nutzung des Dienstes kontaktieren
        Sie uns bitte per E-Mail, um das Problem zu lösen. Falls keine Einigung
        erzielt wird, werden Streitigkeiten von zuständigen Gerichten entschieden.
      </p>

      <h2>7. Hinweis gemäß § 5 TMG</h2>
      <p>
        Für deutsche Nutzer: Dieser Dienst richtet sich an Nutzer innerhalb der
        Europäischen Union. Bean Map ist ein in Polen niedergelassenes Unternehmen.
        Gemäß Art. 27 DSGVO bestellen wir keinen Vertreter in Deutschland, da wir
        keine Waren oder Dienstleistungen anbieten, die sich an deutsche Verbraucher
        richten, und keine systematische Überwachung von Verhaltensmustern in
        Deutschland durchführen.
      </p>
    </>
  );
}
