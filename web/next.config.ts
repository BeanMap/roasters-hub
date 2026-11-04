import type { NextConfig } from "next";
import { version } from "./package.json";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  // Cities were renamed to local names (Warszawa, München…); keep old URLs working with a real 308.
  async redirects() {
    const legacy: [string, string][] = [["warsaw", "warszawa"], ["munich", "munchen"], ["cracow", "krakow"], ["cologne", "koln"], ["nuremberg", "nurnberg"]];
    return legacy.flatMap(([from, to]) => [
      { source: `/:locale(en|pl|de)/cafes/country/:country/city/${from}`, destination: `/:locale/cafes/country/:country/city/${to}`, permanent: true },
      { source: `/cafes/country/:country/city/${from}`, destination: `/cafes/country/:country/city/${to}`, permanent: true },
    ]);
  },
  // Build uses Turbopack (default for Next.js 16)
  images: {
    formats: ["image/avif", "image/webp"],
    // Remote photos (Unsplash, UploadThing) never change under the same URL.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
      {
        protocol: "https",
        hostname: "europeancoffeetrip.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
