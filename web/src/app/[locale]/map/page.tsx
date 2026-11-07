import { Suspense } from "react";
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { buildAlternates, buildOpenGraph, seoKeywords } from "@/lib/seo";
import { MapContent } from "./MapContent";
import { CARD_IMAGE } from "@/lib/card-image";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "map" });
  const title = t("title");
  const description = t("description");
  return {
    title,
    description,
    keywords: seoKeywords("map"),
    alternates: buildAlternates(locale, "/map"),
    openGraph: buildOpenGraph(title, description),
  };
}

export const revalidate = 3600;

export default async function MapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [roasters, cafes] = await Promise.all([
    db.roaster.findMany({
    where: {
      status: "VERIFIED",
      lat: { not: null },
      lng: { not: null },
    },
    include: {
      images: CARD_IMAGE,
      reviews: { select: { rating: true } },
    },
    }),
    db.cafe.findMany({
    where: { status: "VERIFIED", lat: { not: null }, lng: { not: null } },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      country: true,
      lat: true,
      lng: true,
      logoUrl: true,
      coverImageUrl: true,
      services: true,
      reviews: { select: { rating: true } },
    },
    }),
  ]);

  return (
    // MapContent reads ?lat=&lng=&zoom= (deep links from profiles).
    <Suspense fallback={null}>
      <MapContent roasters={roasters} cafes={cafes} />
    </Suspense>
  );
}
