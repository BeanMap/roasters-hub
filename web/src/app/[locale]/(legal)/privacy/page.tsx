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
  const title = t("privacyTitle");
  const description = t("privacyDesc");
  return {
    title,
    description,
    keywords: seoKeywords("legal"),
    alternates: buildAlternates(locale, "/privacy"),
    openGraph: buildOpenGraph(title, description),
  };
}

export default async function PrivacyPage({
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
        {t("privacyTitle")}
      </h1>
      <p className="text-sm text-stone-500 mb-10">
        {isPl
          ? "Ostatnia aktualizacja: 26 kwietnia 2026"
          : "Last updated: April 26, 2026"}
      </p>

      {isPl ? <PrivacyPl /> : <PrivacyEn />}
    </article>
  );
}

function PrivacyPl() {
  return (
    <>
      <h2>1. Informacje ogólne</h2>
      <p>
        Niniejsza Polityka Prywatności określa zasady przetwarzania danych osobowych
        użytkowników serwisu Bean Map (dalej: Serwis), dostępnego pod adresem
        beanmap.pl oraz beanmap.cafe.
      </p>
      <p>
        Administratorem danych osobowych jest Bean Map, prowadzący działalność
        gospodarczą pod adresem: [adres do uzupełnienia], NIP: [NIP do uzupełnienia],
        REGON: [REGON do uzupełnienia].
      </p>
      <p>
        W sprawach związanych z ochroną danych osobowych można kontaktować się z nami
        pod adresem e-mail:{" "}
        <a
          href="mailto:hello@beanmap.cafe"
          className="text-orange-600 hover:underline"
        >
          hello@beanmap.cafe
        </a>
        .
      </p>

      <h2>2. Jakie dane zbieramy?</h2>
      <p>Zbieramy następujące kategorie danych osobowych:</p>
      <ul>
        <li>
          <strong>Dane kontaktowe:</strong> adres e-mail, imię i nazwisko (podczas
          rejestracji konta, zgłaszania palarni/kawiarni, zapisu do newslettera).
        </li>
        <li>
          <strong>Dane profilowe:</strong> nazwa palarni/kawiarni, miasto, kraj, adres,
          opis działalności, certyfikaty, strona WWW, profile w mediach społecznościowych.
        </li>
        <li>
          <strong>Dane uwierzytelniania:</strong> identyfikator użytkownika, sesja logowania
          (przetwarzane przez Clerk).
        </li>
        <li>
          <strong>Dane analityczne:</strong> anonimowe dane o ruchu na stronie
          (przetwarzane przez Plausible Analytics — bez użycia cookies i bez
          identyfikacji użytkowników).
        </li>
      </ul>

      <h2>3. Podstawa prawna przetwarzania</h2>
      <p>Dane osobowe przetwarzamy na podstawie:</p>
      <ul>
        <li>
          <strong>Art. 6 ust. 1 lit. a RODO</strong> — wyraźnej zgody użytkownika
          (np. przy rejestracji, zapisie do newslettera).
        </li>
        <li>
          <strong>Art. 6 ust. 1 lit. b RODO</strong> — wykonania umowy lub podjęcia
          działań na żądanie użytkownika przed zawarciem umowy (np. utworzenie konta
          właściciela palarni).
        </li>
        <li>
          <strong>Art. 6 ust. 1 lit. f RODO</strong> — prawnie uzasadnionego interesu
          administratora (np. zapewnienie bezpieczeństwa Serwisu, analiza ruchu).
        </li>
      </ul>

      <h2>4. Cel przetwarzania danych</h2>
      <p>Twoje dane przetwarzamy w następujących celach:</p>
      <ul>
        <li>Utworzenie i zarządzanie kontem użytkownika.</li>
        <li>Rejestracja i weryfikacja palarni oraz kawiarni w katalogu.</li>
        <li>Wysyłka newslettera (tylko po wyrażeniu osobnej zgody).</li>
        <li>Kontakt z użytkownikiem w sprawach związanych z Serwisem.</li>
        <li>Zapewnienie bezpieczeństwa technicznego Serwisu.</li>
        <li>Analiza anonimowego ruchu w celu doskonalenia Serwisu.</li>
      </ul>

      <h2>5. Odbiorcy danych</h2>
      <p>
        Twoje dane mogą być przekazywane podmiotom współpracującym z nami w zakresie
        niezbędnym do świadczenia usług:
      </p>
      <ul>
        <li>
          <strong>Clerk</strong> — uwierzytelnianie i zarządzanie kontami użytkowników.
        </li>
        <li>
          <strong>Vercel / Neon</strong> — hosting i przechowywanie danych w bazie
          danych.
        </li>
        <li>
          <strong>Resend</strong> — wysyłka wiadomości e-mail (powiadomienia,
          newsletter).
        </li>
        <li>
          <strong>Plausible Analytics</strong> — anonimowa analiza ruchu (nie
          przetwarza danych osobowych).
        </li>
      </ul>
      <p>
        Wszystkie podmioty przetwarzają dane na podstawie umów powiernictwa (DPA) i
        gwarantują odpowiedni poziom bezpieczeństwa.
      </p>

      <h2>6. Okres przechowywania danych</h2>
      <p>
        Dane przechowujemy przez okres niezbędny do realizacji celów, dla których
        zostały zebrane:
      </p>
      <ul>
        <li>Dane konta użytkownika — do momentu usunięcia konta.</li>
        <li>Dane rejestracji palarni/kawiarni — do momentu wycofania zgody lub usunięcia wpisu.</li>
        <li>Dane newslettera — do momentu wycofania zgody na otrzymywanie wiadomości.</li>
        <li>Dane analityczne — 2 lata (anonimowe).</li>
      </ul>

      <h2>7. Twoje prawa</h2>
      <p>Na podstawie RODO przysługują Ci następujące prawa:</p>
      <ul>
        <li>Prawo dostępu do swoich danych (art. 15 RODO).</li>
        <li>Prawo do sprostowania danych (art. 16 RODO).</li>
        <li>Prawo do usunięcia danych (prawo do bycia zapomnianym, art. 17 RODO).</li>
        <li>Prawo do ograniczenia przetwarzania (art. 18 RODO).</li>
        <li>Prawo do przenoszenia danych (art. 20 RODO).</li>
        <li>Prawo do sprzeciwu wobec przetwarzania (art. 21 RODO).</li>
        <li>Prawo do wycofania zgody w dowolnym momencie (bez wpływu na zgodność z prawem przetwarzania przed wycofaniem).</li>
      </ul>
      <p>
        Aby skorzystać ze swoich praw, skontaktuj się z nami pod adresem:{" "}
        <a
          href="mailto:hello@beanmap.cafe"
          className="text-orange-600 hover:underline"
        >
          hello@beanmap.cafe
        </a>
        .
      </p>

      <h2>8. Ciasteczka (cookies)</h2>
      <p>
        Serwis wykorzystuje wyłącznie niezbędne, funkcjonalne ciasteczka. Nie
        stosujemy ciasteczek śledzących ani reklamowych. Szczegółową listę
        wykorzystywanych ciasteczek znajdziesz w naszej{" "}
        <Link href="/cookies" className="text-orange-600 hover:underline">
          Polityce Cookies
        </Link>
        .
      </p>

      <h2>9. Bezpieczeństwo danych</h2>
      <p>
        Stosujemy odpowiednie środki techniczne i organizacyjne w celu ochrony danych
        osobowych przed nieuprawnionym dostępem, utratą lub zniszczeniem. Dane są
        przechowywane w zaszyfrowanej bazie danych (Neon / Vercel Postgres).
      </p>

      <h2>10. Zmiany w Polityce Prywatności</h2>
      <p>
        Zastrzegamy sobie prawo do wprowadzania zmian w niniejszej Polityce
        Prywatności. O istotnych zmianach poinformujemy użytkowników drogą
        elektroniczną lub poprzez komunikat w Serwisie.
      </p>

      <h2>11. Kontakt</h2>
      <p>
        W przypadku pytań lub wątpliwości dotyczących przetwarzania danych osobowych
        prosimy o kontakt:
      </p>
      <ul>
        <li>
          E-mail:{" "}
          <a
            href="mailto:hello@beanmap.cafe"
            className="text-orange-600 hover:underline"
          >
            hello@beanmap.cafe
          </a>
        </li>
        <li>
          Inspektor Ochrony Danych: [imię i nazwisko do uzupełnienia, jeśli
          wyznaczony]
        </li>
      </ul>
      <p>
        Masz prawo wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych (PUODO)
        w sprawach związanych z przetwarzaniem Twoich danych osobowych.
      </p>
    </>
  );
}

function PrivacyEn() {
  return (
    <>
      <h2>1. General Information</h2>
      <p>
        This Privacy Policy sets out the rules for processing personal data of users
        of the Bean Map service (hereinafter: Service), available at beanmap.pl
        and beanmap.cafe.
      </p>
      <p>
        The data controller is Bean Map, conducting business activity at: [address to
        be completed], VAT ID: [VAT to be completed].
      </p>
      <p>
        For matters related to data protection, please contact us at:{" "}
        <a
          href="mailto:hello@beanmap.cafe"
          className="text-orange-600 hover:underline"
        >
          hello@beanmap.cafe
        </a>
        .
      </p>

      <h2>2. What Data Do We Collect?</h2>
      <p>We collect the following categories of personal data:</p>
      <ul>
        <li>
          <strong>Contact data:</strong> email address, name (during account
          registration, roastery/café submission, newsletter signup).
        </li>
        <li>
          <strong>Profile data:</strong> roastery/café name, city, country, address,
          business description, certifications, website, social media profiles.
        </li>
        <li>
          <strong>Authentication data:</strong> user identifier, login session
          (processed by Clerk).
        </li>
        <li>
          <strong>Analytics data:</strong> anonymous traffic data (processed by
          Plausible Analytics — cookie-free and without user identification).
        </li>
      </ul>

      <h2>3. Legal Basis for Processing</h2>
      <p>We process personal data on the basis of:</p>
      <ul>
        <li>
          <strong>Art. 6(1)(a) GDPR</strong> — explicit consent of the user (e.g.,
          during registration, newsletter signup).
        </li>
        <li>
          <strong>Art. 6(1)(b) GDPR</strong> — performance of a contract or taking
          steps at the request of the user prior to entering into a contract (e.g.,
          creating a roastery owner account).
        </li>
        <li>
          <strong>Art. 6(1)(f) GDPR</strong> — legitimate interests of the controller
          (e.g., ensuring Service security, traffic analysis).
        </li>
      </ul>

      <h2>4. Purpose of Processing</h2>
      <p>We process your data for the following purposes:</p>
      <ul>
        <li>Creating and managing user accounts.</li>
        <li>Registering and verifying roasteries and cafés in the directory.</li>
        <li>Newsletter delivery (only after separate consent).</li>
        <li>Contacting users regarding Service-related matters.</li>
        <li>Ensuring technical security of the Service.</li>
        <li>Analyzing anonymous traffic to improve the Service.</li>
      </ul>

      <h2>5. Data Recipients</h2>
      <p>
        Your data may be transferred to entities cooperating with us to the extent
        necessary to provide services:
      </p>
      <ul>
        <li>
          <strong>Clerk</strong> — authentication and user account management.
        </li>
        <li>
          <strong>Vercel / Neon</strong> — hosting and data storage in the database.
        </li>
        <li>
          <strong>Resend</strong> — email delivery (notifications, newsletter).
        </li>
        <li>
          <strong>Plausible Analytics</strong> — anonymous traffic analysis (does not
          process personal data).
        </li>
      </ul>
      <p>
        All entities process data on the basis of data processing agreements (DPA)
        and guarantee an appropriate level of security.
      </p>

      <h2>6. Data Retention Period</h2>
      <p>
        We store data for the period necessary to achieve the purposes for which it
        was collected:
      </p>
      <ul>
        <li>User account data — until account deletion.</li>
        <li>Roastery/café registration data — until consent withdrawal or entry removal.</li>
        <li>Newsletter data — until consent for receiving messages is withdrawn.</li>
        <li>Analytics data — 2 years (anonymous).</li>
      </ul>

      <h2>7. Your Rights</h2>
      <p>Under the GDPR, you have the following rights:</p>
      <ul>
        <li>Right of access to your data (Art. 15 GDPR).</li>
        <li>Right to rectification (Art. 16 GDPR).</li>
        <li>Right to erasure (right to be forgotten, Art. 17 GDPR).</li>
        <li>Right to restriction of processing (Art. 18 GDPR).</li>
        <li>Right to data portability (Art. 20 GDPR).</li>
        <li>Right to object to processing (Art. 21 GDPR).</li>
        <li>Right to withdraw consent at any time (without affecting the lawfulness of processing before withdrawal).</li>
      </ul>
      <p>
        To exercise your rights, please contact us at:{" "}
        <a
          href="mailto:hello@beanmap.cafe"
          className="text-orange-600 hover:underline"
        >
          hello@beanmap.cafe
        </a>
        .
      </p>

      <h2>8. Cookies</h2>
      <p>
        The Service uses only essential, functional cookies. We do not use tracking
        or advertising cookies. For a detailed list, please see our{" "}
        <Link href="/cookies" className="text-orange-600 hover:underline">
          Cookie Policy
        </Link>
        .
      </p>

      <h2>9. Data Security</h2>
      <p>
        We apply appropriate technical and organizational measures to protect personal
        data against unauthorized access, loss, or destruction. Data is stored in an
        encrypted database (Neon / Vercel Postgres).
      </p>

      <h2>10. Changes to This Privacy Policy</h2>
      <p>
        We reserve the right to make changes to this Privacy Policy. We will notify
        users of material changes by electronic means or through a notice in the
        Service.
      </p>

      <h2>11. Contact</h2>
      <p>
        If you have any questions or concerns regarding the processing of your
        personal data, please contact us:
      </p>
      <ul>
        <li>
          Email:{" "}
          <a
            href="mailto:hello@beanmap.cafe"
            className="text-orange-600 hover:underline"
          >
            hello@beanmap.cafe
          </a>
        </li>
      </ul>
      <p>
        You have the right to lodge a complaint with the supervisory authority in
        matters related to the processing of your personal data.
      </p>
    </>
  );
}
