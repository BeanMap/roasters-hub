/* eslint-disable react/no-unescaped-entities */
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
  const title = t("cookiesTitle");
  const description = t("cookiesDesc");
  return {
    title,
    description,
    keywords: seoKeywords("legal"),
    alternates: buildAlternates(locale, "/cookies"),
    openGraph: buildOpenGraph(title, description),
  };
}

export default async function CookiesPage({
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
        {t("cookiesTitle")}
      </h1>
      <p className="text-sm text-stone-500 mb-10">
        {isPl
          ? "Ostatnia aktualizacja: 26 kwietnia 2026"
          : "Last updated: April 26, 2026"}
      </p>

      {isPl ? <CookiesPl /> : <CookiesEn />}
    </article>
  );
}

function CookiesPl() {
  return (
    <>
      <h2>1. Czym są ciasteczka (cookies)?</h2>
      <p>
        Ciasteczka to niewielkie pliki tekstowe zapisywane przez przeglądarkę
        internetową na urządzeniu użytkownika. Służą do przechowywania informacji
        niezbędnych do prawidłowego funkcjonowania strony internetowej lub
        zapamiętywania preferencji użytkownika.
      </p>

      <h2>2. Jakie ciasteczka wykorzystujemy?</h2>
      <p>
        Bean Map wykorzystuje wyłącznie <strong>niezbędne, funkcjonalne
        ciasteczka</strong>. Nie stosujemy ciasteczek śledzących (tracking),
        analitycznych wymagających zgody, ani reklamowych.
      </p>

      <h3>Lista wykorzystywanych ciasteczek</h3>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 pr-4">Nazwa</th>
            <th className="text-left py-2 pr-4">Dostawca</th>
            <th className="text-left py-2 pr-4">Cel</th>
            <th className="text-left py-2">Okres</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-2 pr-4 font-mono text-xs">__clerk_db_jwt</td>
            <td className="py-2 pr-4">Clerk</td>
            <td className="py-2 pr-4">
              Uwierzytelnianie sesji użytkownika — niezbędne do logowania i
              ochrony konta.
            </td>
            <td className="py-2">Sesja / 30 dni</td>
          </tr>
          <tr className="border-b">
            <td className="py-2 pr-4 font-mono text-xs">__client_uat</td>
            <td className="py-2 pr-4">Clerk</td>
            <td className="py-2 pr-4">
              Bezpieczeństwo sesji — pomaga wykryć nieautoryzowane próby dostępu.
            </td>
            <td className="py-2">Sesja</td>
          </tr>
          <tr className="border-b">
            <td className="py-2 pr-4 font-mono text-xs">NEXT_LOCALE</td>
            <td className="py-2 pr-4">Bean Map</td>
            <td className="py-2 pr-4">
              Zapamiętanie preferowanego języka interfejsu (PL / EN / DE).
            </td>
            <td className="py-2">Sesja</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Ciasteczka lokalne (localStorage)</h2>
      <p>
        Oprócz ciasteczek, Serwis wykorzystuje mechanizm <code>localStorage</code>
        przeglądarki w celu zapamiętania:
      </p>
      <ul>
        <li>
          <code>beanmap_beta_banner_dismissed</code> — informacji o zamknięciu
          banera beta (nie jest to ciasteczko, dane nie są wysyłane na serwer).
        </li>
      </ul>

      <h2>4. Analityka</h2>
      <p>
        Do analizy ruchu w Serwisie wykorzystujemy{" "}
        <a
          href="https://plausible.io"
          className="text-orange-600 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Plausible Analytics
        </a>
        — narzędzie analityczne szanujące prywatność, które:
      </p>
      <ul>
        <li><strong>nie używa ciasteczek</strong>,</li>
        <li><strong>nie identyfikuje indywidualnych użytkowników</strong>,</li>
        <li>zbiera wyłącznie anonimowe, zagregowane dane o ruchu.</li>
      </ul>
      <p>
        Ze względu na powyższe cechy, zastosowanie Plausible Analytics nie wymaga
        zgody użytkownika w rozumieniu przepisów o cookies.
      </p>

      <h2>5. Jak zarządzać ciasteczkami?</h2>
      <p>
        Użytkownik może w dowolnym momencie usunąć lub zablokować ciasteczka w
        ustawieniach swojej przeglądarki internetowej. Poniżej znajdują się linki do
        instrukcji dla najpopularniejszych przeglądarek:
      </p>
      <ul>
        <li>
          <a
            href="https://support.google.com/chrome/answer/95647"
            className="text-orange-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Chrome
          </a>
        </li>
        <li>
          <a
            href="https://support.mozilla.org/pl/kb/ciasteczka"
            className="text-orange-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mozilla Firefox
          </a>
        </li>
        <li>
          <a
            href="https://support.apple.com/pl-pl/guide/safari/sfri11471/mac"
            className="text-orange-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Safari
          </a>
        </li>
        <li>
          <a
            href="https://support.microsoft.com/pl-pl/microsoft-edge"
            className="text-orange-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Microsoft Edge
          </a>
        </li>
      </ul>
      <p>
        <strong>Uwaga:</strong> wyłączenie niezbędnych ciasteczek może uniemożliwić
        logowanie lub korzystanie z niektórych funkcji Serwisu.
      </p>

      <h2>6. Zmiany w Polityce Cookies</h2>
      <p>
        Zastrzegamy sobie prawo do aktualizacji niniejszej Polityki Cookies.
        O istotnych zmianach poinformujemy użytkowników poprzez komunikat w Serwisie.
      </p>

      <h2>7. Kontakt</h2>
      <p>
        W przypadku pytań dotyczących ciasteczek prosimy o kontakt:
        <br />
        E-mail:{" "}
        <a
          href="mailto:hello@beanmap.cafe"
          className="text-orange-600 hover:underline"
        >
          hello@beanmap.cafe
        </a>
      </p>
    </>
  );
}

function CookiesEn() {
  return (
    <>
      <h2>1. What Are Cookies?</h2>
      <p>
        Cookies are small text files stored by your web browser on your device. They
        are used to store information necessary for the proper functioning of a website
        or to remember user preferences.
      </p>

      <h2>2. What Cookies Do We Use?</h2>
      <p>
        Bean Map uses only <strong>essential, functional cookies</strong>. We do not
        use tracking, analytics-requiring-consent, or advertising cookies.
      </p>

      <h3>List of Cookies Used</h3>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 pr-4">Name</th>
            <th className="text-left py-2 pr-4">Provider</th>
            <th className="text-left py-2 pr-4">Purpose</th>
            <th className="text-left py-2">Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="py-2 pr-4 font-mono text-xs">__clerk_db_jwt</td>
            <td className="py-2 pr-4">Clerk</td>
            <td className="py-2 pr-4">
              User session authentication — essential for login and account
              protection.
            </td>
            <td className="py-2">Session / 30 days</td>
          </tr>
          <tr className="border-b">
            <td className="py-2 pr-4 font-mono text-xs">__client_uat</td>
            <td className="py-2 pr-4">Clerk</td>
            <td className="py-2 pr-4">
              Session security — helps detect unauthorized access attempts.
            </td>
            <td className="py-2">Session</td>
          </tr>
          <tr className="border-b">
            <td className="py-2 pr-4 font-mono text-xs">NEXT_LOCALE</td>
            <td className="py-2 pr-4">Bean Map</td>
            <td className="py-2 pr-4">
              Remembering the preferred interface language (PL / EN / DE).
            </td>
            <td className="py-2">Session</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Local Storage</h2>
      <p>
        In addition to cookies, the Service uses the browser&apos;s <code>localStorage</code>{" "}
        mechanism to remember:
      </p>
      <ul>
        <li>
          <code>beanmap_beta_banner_dismissed</code> — whether the beta banner has
          been dismissed (this is not a cookie; data is not sent to the server).
        </li>
      </ul>

      <h2>4. Analytics</h2>
      <p>
        We use{" "}
        <a
          href="https://plausible.io"
          className="text-orange-600 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          Plausible Analytics
        </a>{" "}
        — a privacy-friendly analytics tool that:
      </p>
      <ul>
        <li><strong>does not use cookies</strong>,</li>
        <li><strong>does not identify individual users</strong>,</li>
        <li>collects only anonymous, aggregated traffic data.</li>
      </ul>
      <p>
        Due to these characteristics, the use of Plausible Analytics does not require
        user consent under cookie regulations.
      </p>

      <h2>5. How to Manage Cookies?</h2>
      <p>
        You can delete or block cookies at any time in your web browser settings.
        Below are links to instructions for the most popular browsers:
      </p>
      <ul>
        <li>
          <a
            href="https://support.google.com/chrome/answer/95647"
            className="text-orange-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google Chrome
          </a>
        </li>
        <li>
          <a
            href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
            className="text-orange-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Mozilla Firefox
          </a>
        </li>
        <li>
          <a
            href="https://support.apple.com/guide/safari/sfri11471/mac"
            className="text-orange-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Safari
          </a>
        </li>
        <li>
          <a
            href="https://support.microsoft.com/en-us/microsoft-edge"
            className="text-orange-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Microsoft Edge
          </a>
        </li>
      </ul>
      <p>
        <strong>Note:</strong> disabling essential cookies may prevent login or use of
        certain Service features.
      </p>

      <h2>6. Changes to This Cookie Policy</h2>
      <p>
        We reserve the right to update this Cookie Policy. Users will be notified of
        material changes through a notice in the Service.
      </p>

      <h2>7. Contact</h2>
      <p>
        If you have any questions about cookies, please contact us:
        <br />
        Email:{" "}
        <a
          href="mailto:hello@beanmap.cafe"
          className="text-orange-600 hover:underline"
        >
          hello@beanmap.cafe
        </a>
      </p>
    </>
  );
}
