import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { Bricolage_Grotesque, Instrument_Sans, IBM_Plex_Mono } from "next/font/google";
import { BetaBanner } from "@/components/shared/BetaBanner";
import { WebSiteJsonLd } from "@/components/shared/JsonLd";
import { getBaseUrl } from "@/lib/seo";
import en from "../../../messages/en.json";
import pl from "../../../messages/pl.json";
import de from "../../../messages/de.json";

// Display: characterful grotesque with optical sizes — confident, editorial.
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin", "latin-ext"],
  axes: ["opsz", "wdth"],
  display: "swap",
});

// Body: crisp, warm humanist sans with full Polish/German diacritics.
const sans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

// Labels: "coffee bag" metadata — origins, cities, counts, coordinates.
const mono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const BETA_MESSAGES: Record<string, { message: string; dismiss: string }> = {
  en: en.beta,
  pl: pl.beta,
  de: de.beta,
};

/**
 * The <html>/<body> document shared by every route.
 *
 * The locale is passed in explicitly instead of read with getLocale(): reading
 * it from the request headers in the root layout opted EVERY page into dynamic
 * rendering and disabled ISR (`export const revalidate`) across the site.
 */
export function AppShell({ locale, children }: { locale: string; children: React.ReactNode }) {
  const beta = BETA_MESSAGES[locale] ?? BETA_MESSAGES.en;

  return (
    <html
      lang={locale}
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <BetaBanner message={beta.message} dismissLabel={beta.dismiss} />
        <WebSiteJsonLd
          name="Bean Map"
          url={getBaseUrl()}
          description="The global directory connecting cafés and coffee lovers with verified specialty roasters."
        />
        <ClerkProvider>{children}</ClerkProvider>
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
