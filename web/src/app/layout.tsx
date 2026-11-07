import type { Metadata, Viewport } from "next";
import { defaultOgImage } from "@/lib/seo";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1f1611",
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

/**
 * Pass-through root layout. The <html> document lives in <AppShell>, rendered
 * by each top-level layout ([locale], sign-in, sign-up, dashboard) with an
 * explicit locale — so this layout reads no request headers and pages can be
 * statically generated / ISR-cached.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
