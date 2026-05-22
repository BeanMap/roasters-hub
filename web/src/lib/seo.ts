const LOCALES = ["en", "pl", "de"] as const;

export function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "https://beanmap.pl";
}

export function buildCanonical(locale: string, path?: string) {
  const segment = path ? `/${locale}${path}` : `/${locale}`;
  return `${getBaseUrl()}${segment}`;
}

export function buildAlternates(locale: string, path?: string) {
  const canonical = buildCanonical(locale, path);
  const languages: Record<string, string> = {};
  for (const l of LOCALES) {
    languages[l] = path ? `${getBaseUrl()}/${l}${path}` : `${getBaseUrl()}/${l}`;
  }
  return { canonical, languages };
}

export function buildOgImage(
  url: string,
  alt: string,
  width = 1200,
  height = 630
) {
  const imageUrl = url.startsWith("http") ? url : `${getBaseUrl()}${url}`;
  return { url: imageUrl, width, height, alt };
}

export function defaultOgImage() {
  return buildOgImage("/brand/beanmap-logo.png", "Bean Map", 590, 231);
}

export function buildOpenGraph(
  title: string,
  description: string,
  images?: { url: string; width: number; height: number; alt: string }[],
  type: "website" | "article" | "profile" = "website"
) {
  return {
    type,
    locale: "en_US",
    siteName: "Bean Map",
    title,
    description,
    ...(images?.length ? { images } : {}),
  };
}

export function buildTwitter(
  title: string,
  description: string,
  image?: { url: string; width: number; height: number; alt: string }
) {
  return {
    card: "summary_large_image" as const,
    site: "@beanmap",
    title,
    description,
    ...(image ? { images: [image] } : {}),
  };
}

export function seoKeywords(page: string): string[] {
  const base = [
    "specialty coffee",
    "coffee roasters",
    "specialty cafes",
    "coffee map",
    "coffee directory",
    "bean map",
  ];
  const pageKeywords: Record<string, string[]> = {
    home: [...base, "coffee discovery", "find roasters", "coffee community"],
    roasters: [
      ...base,
      "coffee roastery directory",
      "specialty coffee roasters",
      "find coffee roasters",
    ],
    cafes: [
      ...base,
      "specialty coffee cafe directory",
      "coffee shops",
      "find coffee cafes",
      "cafe discovery",
    ],
    map: [...base, "coffee map", "interactive coffee map", "coffee roaster map"],
    register: [
      ...base,
      "register roastery",
      "list coffee roastery",
      "add roaster",
    ],
    registerCafe: [
      ...base,
      "register cafe",
      "list coffee cafe",
      "add cafe",
    ],
    legal: [...base, "terms", "privacy", "cookie policy"],
  };
  return pageKeywords[page] || base;
}
