/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { buildAlternates, buildOpenGraph, seoKeywords } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });
  const title = t("termsTitle");
  const description = t("termsDesc");
  return {
    title,
    description,
    keywords: seoKeywords("legal"),
    alternates: buildAlternates(locale, "/terms"),
    openGraph: buildOpenGraph(title, description),
  };
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "legal" });

  const isPl = locale === "pl";

  return (
    <article className="prose prose-stone dark:prose-invert max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-display font-semibold mb-2">
        {t("termsTitle")}
      </h1>
      <p className="text-sm text-stone-500 mb-10">
        {isPl
          ? "Ostatnia aktualizacja: 26 kwietnia 2026"
          : "Last updated: April 26, 2026"}
      </p>

      {isPl ? <TermsPl /> : <TermsEn />}
    </article>
  );
}

function TermsPl() {
  return (
    <>
      <h2>§ 1. Postanowienia ogólne</h2>
      <p>
        1. Niniejszy Regulamin określa zasady korzystania z serwisu internetowego Bean
        Map, dostępnego pod adresami beanmap.pl oraz beanmap.cafe (dalej: „Serwis").
      </p>
      <p>
        2. Właścicielem i operatorem Serwisu jest Bean Map, prowadzący działalność
        gospodarczą pod adresem: [adres do uzupełnienia], NIP: [NIP do uzupełnienia]
        (dalej: „Operator").
      </p>
      <p>
        3. Korzystanie z Serwisu oznacza akceptację niniejszego Regulaminu oraz{" "}
        <Link href="/privacy" className="text-orange-600 hover:underline">
          Polityki Prywatności
        </Link>
        .
      </p>

      <h2>§ 2. Definicje</h2>
      <p>Użyte w Regulaminie terminy oznaczają:</p>
      <ul>
        <li>
          <strong>Użytkownik</strong> — osoba fizyczna korzystająca z Serwisu.
        </li>
        <li>
          <strong>Właściciel palarni / kawiarni</strong> — Użytkownik, który
          zarejestrował swoją palarnię lub kawiarnię w Serwisie.
        </li>
        <li>
          <strong>Katalog</strong> — zbiór profili palarni i kawiarni dostępnych w
          Serwisie.
        </li>
        <li>
          <strong>Treści użytkowników</strong> — recenzje, opisy, zdjęcia i inne
          materiały przesyłane przez Użytkowników.
        </li>
      </ul>

      <h2>§ 3. Zakres usług</h2>
      <p>Serwis umożliwia:</p>
      <ul>
        <li>Przeglądanie katalogu palarni i kawiarni specialty coffee.</li>
        <li>Wyszukiwanie i filtrowanie palarni i kawiarni według kryteriów.</li>
        <li>Rejestrację profilu palarni lub kawiarni.</li>
        <li>Dodawanie recenzji i ocen.</li>
        <li>Zapisywanie ulubionych palarni i kawiarni.</li>
        <li>Korzystanie z mapy interaktywnej.</li>
      </ul>

      <h2>§ 4. Rejestracja konta</h2>
      <p>
        1. Rejestracja konta wymaga podania prawdziwych danych kontaktowych oraz
        wyrażenia zgody na przetwarzanie danych osobowych i akceptacji Regulaminu.
      </p>
      <p>
        2. Operator zastrzega sobie prawo do weryfikacji zgłoszonych palarni i
        kawiarni przed ich opublikowaniem w Katalogu.
      </p>
      <p>
        3. Właściciel palarni / kawiarni oświadcza, że posiada prawo do
        reprezentowania zgłaszanego podmiotu lub uzyskał na to odpowiednie
        upoważnienie.
      </p>

      <h2>§ 5. Treści użytkowników</h2>
      <p>
        1. Użytkownik ponosi pełną odpowiedzialność za treści, które publikuje w
        Serwisie.
      </p>
      <p>2. Zabrania się publikowania treści:</p>
      <ul>
        <li>niezgodnych z prawem, w tym naruszających dobra osobiste innych osób;</li>
        <li>wulgarnych, obscenicznych lub nawołujących do nienawiści;</li>
        <li>reklamowych bez zgody Operatora;</li>
        <li>zawierających nieprawdziwe informacje o podmiotach w Katalogu.</li>
      </ul>
      <p>
        3. Operator zastrzega sobie prawo do moderacji, edycji lub usuwania treści
        naruszających niniejszy Regulamin.
      </p>

      <h2>§ 6. Własność intelektualna</h2>
      <p>
        1. Wszelkie prawa do treści, grafik, kodu źródłowego i innych elementów
        Serwisu przysługują Operatorowi lub jego licencjodawcom.
      </p>
      <p>
        2. Użytkownik udziela Operatorowi nieodpłatnej, nieekskluzywnej licencji na
        korzystanie z treści przesłanych do Serwisu w zakresie niezbędnym do
        funkcjonowania Katalogu.
      </p>
      <p>
        3. Logotypy, nazwy i inne znaki towarowe palarni oraz kawiarni pozostają
        własnością ich prawnych właścicieli.
      </p>

      <h2>§ 7. Odpowiedzialność</h2>
      <p>
        1. Operator nie ponosi odpowiedzialności za treści publikowane przez
        Użytkowników.
      </p>
      <p>
        2. Operator nie gwarantuje nieprzerwanego i bezbłędnego działania Serwisu.
      </p>
      <p>
        3. Operator nie ponosi odpowiedzialności za decyzje podjęte przez Użytkowników
        na podstawie informacji zawartych w Katalogu.
      </p>

      <h2>§ 8. RODO i ochrona danych</h2>
      <p>
        Szczegółowe informacje o przetwarzaniu danych osobowych znajdują się w{" "}
        <Link href="/privacy" className="text-orange-600 hover:underline">
          Polityce Prywatności
        </Link>
        .
      </p>

      <h2>§ 9. Newsletter</h2>
      <p>
        1. Użytkownik może zapisać się do newslettera, podając adres e-mail i
        wyrażając zgodę na otrzymywanie wiadomości marketingowych.
      </p>
      <p>
        2. Zgodę na newsletter można wycofać w dowolnym momencie, klikając link
        „wypisz" w treści wiadomości lub kontaktując się z Operatorem.
      </p>

      <h2>§ 10. Zmiany Regulaminu</h2>
      <p>
        1. Operator zastrzega sobie prawo do zmiany niniejszego Regulaminu w dowolnym
        momencie.
      </p>
      <p>
        2. O zmianach Regulaminu Użytkownicy zostaną poinformowani drogą
        elektroniczną lub poprzez komunikat w Serwisie.
      </p>
      <p>
        3. Kontynuowanie korzystania z Serwisu po wprowadzeniu zmian oznacza
        akceptację nowego Regulaminu.
      </p>

      <h2>§ 11. Postanowienia końcowe</h2>
      <p>
        1. Regulamin podlega prawu polskiemu.
      </p>
      <p>
        2. W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie mają
        przepisy Kodeksu cywilnego oraz ustawy o świadczeniu usług drogą
        elektroniczną.
      </p>
      <p>
        3. Wszelkie spory rozstrzygane będą przez sądy powszechne właściwe dla siedziby
        Operatora.
      </p>
      <p>
        4. Kontakt z Operatorem: e-mail:{" "}
        <a
          href="mailto:hello@beanmap.cafe"
          className="text-orange-600 hover:underline"
        >
          hello@beanmap.cafe
        </a>
        .
      </p>
    </>
  );
}

function TermsEn() {
  return (
    <>
      <h2>§ 1. General Provisions</h2>
      <p>
        1. These Terms of Service set out the rules for using the Bean Map website,
        available at beanmap.pl and beanmap.cafe (hereinafter: "Service").
      </p>
      <p>
        2. The owner and operator of the Service is Bean Map, conducting business
        activity at: [address to be completed], VAT ID: [VAT to be completed]
        (hereinafter: "Operator").
      </p>
      <p>
        3. Using the Service means accepting these Terms of Service and our{" "}
        <Link href="/privacy" className="text-orange-600 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      <h2>§ 2. Definitions</h2>
      <p>Terms used in these Terms mean:</p>
      <ul>
        <li>
          <strong>User</strong> — a natural person using the Service.
        </li>
        <li>
          <strong>Roastery / Café Owner</strong> — a User who has registered their
          roastery or café in the Service.
        </li>
        <li>
          <strong>Directory</strong> — a collection of roastery and café profiles
          available in the Service.
        </li>
        <li>
          <strong>User Content</strong> — reviews, descriptions, photos, and other
          materials submitted by Users.
        </li>
      </ul>

      <h2>§ 3. Scope of Services</h2>
      <p>The Service enables:</p>
      <ul>
        <li>Browsing the directory of specialty coffee roasteries and cafés.</li>
        <li>Searching and filtering roasteries and cafés by criteria.</li>
        <li>Registering a roastery or café profile.</li>
        <li>Adding reviews and ratings.</li>
        <li>Saving favorite roasteries and cafés.</li>
        <li>Using the interactive map.</li>
      </ul>

      <h2>§ 4. Account Registration</h2>
      <p>
        1. Account registration requires providing true contact details and expressing
        consent to the processing of personal data and acceptance of these Terms.
      </p>
      <p>
        2. The Operator reserves the right to verify submitted roasteries and cafés
        before publishing them in the Directory.
      </p>
      <p>
        3. The Roastery / Café Owner declares that they have the right to represent
        the submitted entity or have obtained appropriate authorization.
      </p>

      <h2>§ 5. User Content</h2>
      <p>
        1. The User bears full responsibility for the content they publish in the
        Service.
      </p>
      <p>2. It is prohibited to publish content that is:</p>
      <ul>
        <li>unlawful, including infringing on the personal rights of others;</li>
        <li>vulgar, obscene, or inciting hatred;</li>
        <li>advertising without the Operator's consent;</li>
        <li>containing false information about entities in the Directory.</li>
      </ul>
      <p>
        3. The Operator reserves the right to moderate, edit, or remove content that
        violates these Terms.
      </p>

      <h2>§ 6. Intellectual Property</h2>
      <p>
        1. All rights to content, graphics, source code, and other elements of the
        Service belong to the Operator or its licensors.
      </p>
      <p>
        2. The User grants the Operator a free, non-exclusive license to use the
        content submitted to the Service to the extent necessary for the Directory to
        function.
      </p>
      <p>
        3. Logos, names, and other trademarks of roasteries and cafés remain the
        property of their legal owners.
      </p>

      <h2>§ 7. Liability</h2>
      <p>
        1. The Operator is not liable for content published by Users.
      </p>
      <p>
        2. The Operator does not guarantee uninterrupted and error-free operation of
        the Service.
      </p>
      <p>
        3. The Operator is not liable for decisions made by Users based on
        information contained in the Directory.
      </p>

      <h2>§ 8. GDPR and Data Protection</h2>
      <p>
        For detailed information on personal data processing, please refer to our{" "}
        <Link href="/privacy" className="text-orange-600 hover:underline">
          Privacy Policy
        </Link>
        .
      </p>

      <h2>§ 9. Newsletter</h2>
      <p>
        1. The User may subscribe to the newsletter by providing an email address and
        expressing consent to receive marketing messages.
      </p>
      <p>
        2. Consent to the newsletter may be withdrawn at any time by clicking the
        "unsubscribe" link in the message or by contacting the Operator.
      </p>

      <h2>§ 10. Changes to Terms</h2>
      <p>
        1. The Operator reserves the right to change these Terms of Service at any
        time.
      </p>
      <p>
        2. Users will be notified of changes by electronic means or through a notice
        in the Service.
      </p>
      <p>
        3. Continued use of the Service after changes are introduced constitutes
        acceptance of the new Terms.
      </p>

      <h2>§ 11. Final Provisions</h2>
      <p>
        1. These Terms are governed by Polish law.
      </p>
      <p>
        2. Matters not regulated by these Terms shall be governed by the provisions
        of the Civil Code and the Act on Providing Services by Electronic Means.
      </p>
      <p>
        3. All disputes shall be resolved by common courts having jurisdiction over
        the Operator's registered office.
      </p>
      <p>
        4. Contact the Operator: email:{" "}
        <a
          href="mailto:hello@beanmap.cafe"
          className="text-orange-600 hover:underline"
        >
          hello@beanmap.cafe
        </a>
        .
      </p>
    </>
  );
}
