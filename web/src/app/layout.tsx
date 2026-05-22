import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { ClerkProvider } from "@clerk/nextjs";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import { getLocale, getTranslations } from "next-intl/server";
import { BetaBanner } from "@/components/shared/BetaBanner";
import { WebSiteJsonLd } from "@/components/shared/JsonLd";
import { getBaseUrl, defaultOgImage } from "@/lib/seo";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#6f4e37",
};

export const metadata: Metadata = {
  title: {
    default: "Bean Map — Discover Specialty Coffee Roasters",
    template: "%s | Bean Map",
  },
  description:
    "The global directory connecting cafés and coffee lovers with verified specialty roasters.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://beanmap.pl"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bean Map",
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  keywords: [
    "specialty coffee",
    "coffee roasters",
    "specialty cafes",
    "coffee map",
    "coffee directory",
    "bean map",
    "coffee discovery",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Bean Map",
    title: "Bean Map — Discover Specialty Coffee Roasters",
    description:
      "The global directory connecting cafés and coffee lovers with verified specialty roasters.",
    images: [defaultOgImage()],
  },
  twitter: {
    card: "summary_large_image",
    site: "@beanmap",
    title: "Bean Map — Discover Specialty Coffee Roasters",
    description:
      "The global directory connecting cafés and coffee lovers with verified specialty roasters.",
    images: [defaultOgImage()],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let locale = "en";
  try {
    locale = await getLocale();
  } catch {
    // next-intl context missing on locale-free routes (/sign-in, /sign-up, /dashboard)
  }

  let betaMessage = "";
  let betaDismiss = "Dismiss";
  try {
    const t = await getTranslations({ locale, namespace: "beta" });
    betaMessage = t("message");
    betaDismiss = t("dismiss");
  } catch {
    // BetaBanner will be hidden when BETA_PASSWORD is not set anyway
  }

  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${sourceSans.variable} h-full scroll-smooth`}
    >
      <body className="min-h-full flex flex-col antialiased" suppressHydrationWarning>
        <BetaBanner message={betaMessage} dismissLabel={betaDismiss} />
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
