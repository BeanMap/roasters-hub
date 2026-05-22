interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

interface OrganizationJsonLdProps {
  name: string;
  url: string;
  description: string;
  logo?: string;
}

export function OrganizationJsonLd({
  name,
  url,
  description,
  logo,
}: OrganizationJsonLdProps) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    description,
  };
  if (logo) data.logo = logo;
  return <JsonLd data={data} />;
}

interface LocalBusinessJsonLdProps {
  name: string;
  url: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  image?: string | null;
  telephone?: string | null;
  email?: string | null;
  sameAs?: string[];
  type?: "Store" | "CafeOrCoffeeShop";
}

export function LocalBusinessJsonLd({
  name,
  url,
  description,
  address,
  city,
  country,
  image,
  telephone,
  email,
  sameAs,
  type = "Store",
}: LocalBusinessJsonLdProps) {
  const addressLocality = city ?? undefined;
  const addressCountry = country ?? undefined;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    name,
    url,
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    ...(telephone ? { telephone } : {}),
    ...(email ? { email } : {}),
    ...(sameAs?.length ? { sameAs } : {}),
  };

  if (address || addressLocality || addressCountry) {
    data.address = {
      "@type": "PostalAddress",
      ...(address ? { streetAddress: address } : {}),
      ...(addressLocality ? { addressLocality } : {}),
      ...(addressCountry ? { addressCountry } : {}),
    };
  }

  return <JsonLd data={data} />;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList" as const,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem" as const,
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
  return <JsonLd data={data} />;
}

interface ItemListJsonLdProps {
  items: { name: string; url: string }[];
  listName?: string;
}

export function ItemListJsonLd({ items, listName }: ItemListJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    ...(listName ? { name: listName } : {}),
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: item.url,
    })),
  };
  return <JsonLd data={data} />;
}

interface WebSiteJsonLdProps {
  name: string;
  url: string;
  description?: string;
}

export function WebSiteJsonLd({ name, url, description }: WebSiteJsonLdProps) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name,
    url,
    ...(description ? { description } : {}),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/roasters?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
  return <JsonLd data={data} />;
}

interface ReviewJsonLdProps {
  itemReviewed: string;
  url: string;
  author: string;
  rating: number;
  reviewBody?: string | null;
  datePublished: string;
}

export function ReviewJsonLd({
  itemReviewed,
  url,
  author,
  rating,
  reviewBody,
  datePublished,
}: ReviewJsonLdProps) {
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "LocalBusiness",
      name: itemReviewed,
      url,
    },
    author: {
      "@type": "Person",
      name: author,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: rating,
      bestRating: 5,
      worstRating: 1,
    },
    datePublished,
    ...(reviewBody ? { reviewBody } : {}),
  };
  return <JsonLd data={data} />;
}

export type { BreadcrumbItem };
