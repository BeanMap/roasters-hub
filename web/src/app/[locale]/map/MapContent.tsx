"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Header } from "@/components/shared/Header";
import { RoasterCard } from "@/components/roasters/RoasterCard";
import { filterByCert, filterByService } from "@/lib/map-filters";
import type { Roaster, Image as PrismaImage } from "@prisma/client";

const RoasterMap = dynamic(
  () => import("@/components/roasters/RoasterMap").then((mod) => mod.RoasterMap),
  { ssr: false, loading: () => <div className="w-full h-full bg-surface-container-low animate-pulse" /> }
);

type RoasterWithImages = Roaster & { images: PrismaImage[] };

type CafeMapItem = {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  lat: number | null;
  lng: number | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  services: string[];
};

const ENTITY_TYPE_KEY = "beanmap_entity_type";
const CAFE_FILTER_CHIPS = ["Free Wi-Fi", "Laptop Friendly", "Vegan Options", "Dog Friendly", "Outdoor Seating"];
const ROASTER_CERT_CHIPS: { label: string; value: string | null }[] = [
  { label: "ALL", value: null },
  { label: "DIRECT TRADE", value: "DIRECT_TRADE" },
  { label: "ORGANIC", value: "ORGANIC" },
];

function CafeMapCard({ cafe }: { cafe: CafeMapItem }) {
  return (
    <Link
      href={`/cafes/${cafe.slug}`}
      className="group bg-surface-container-lowest p-3 rounded-xl border border-transparent hover:border-secondary/20 hover:shadow-xl hover:shadow-secondary/5 transition-all block"
    >
      <div className="flex gap-4">
        <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 relative bg-surface-container">
          {(cafe.logoUrl ?? cafe.coverImageUrl) ? (
            <Image
              src={(cafe.logoUrl ?? cafe.coverImageUrl)!}
              alt={cafe.name}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="96px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30 text-3xl">
              ☺
            </div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center py-0.5">
          <h3 className="font-headline font-bold text-lg text-on-surface leading-tight group-hover:text-secondary transition-colors">
            {cafe.name}
          </h3>
          <p className="text-sm text-on-surface-variant/60">
            {cafe.city}, {cafe.country}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function MapContent({ roasters, cafes }: { roasters: RoasterWithImages[]; cafes: CafeMapItem[] }) {
  const t = useTranslations("map");
  const [showSidebar, setShowSidebar] = useState(false);
  const [showRoasters, setShowRoasters] = useState(true);
  const [showCafes, setShowCafes] = useState(true);
  const [entityType, setEntityType] = useState<"roasters" | "cafes">(() => {
    if (typeof window === "undefined") return "cafes";
    const stored = localStorage.getItem(ENTITY_TYPE_KEY);
    return stored === "roasters" || stored === "cafes" ? stored : "cafes";
  });
  const [activeCert, setActiveCert] = useState<string | null>(null);
  const [activeService, setActiveService] = useState<string | null>(null);
  const [boundsRoasterIds, setBoundsRoasterIds] = useState<Set<string> | null>(null);
  const [boundsCafeIds, setBoundsCafeIds] = useState<Set<string> | null>(null);

  const handleEntityToggle = (type: "roasters" | "cafes") => {
    setEntityType(type);
    setActiveCert(null);
    setActiveService(null);
    localStorage.setItem(ENTITY_TYPE_KEY, type);
  };

  const handleBoundsChange = useCallback(
    ({ roasterIds, cafeIds }: { roasterIds: Set<string>; cafeIds: Set<string> }) => {
      setBoundsRoasterIds(roasterIds);
      setBoundsCafeIds(cafeIds);
    },
    []
  );

  const mapData = useMemo(
    () =>
      roasters.map((r) => {
        const reviews = (r as unknown as { reviews: { rating: number }[] }).reviews ?? [];
        const avgRating =
          reviews.length > 0
            ? reviews.reduce((s, rev) => s + rev.rating, 0) / reviews.length
            : null;
        return {
          id: r.id,
          name: r.name,
          slug: r.slug,
          city: r.city,
          country: r.country,
          lat: r.lat!,
          lng: r.lng!,
          image: r.images[0]?.url,
          verified: r.status === "VERIFIED",
          certifications: r.certifications,
          rating: avgRating,
        };
      }),
    [roasters]
  );

  const enrichedCafes = useMemo(() => {
    return cafes.map((c) => {
      const reviews = (c as unknown as { reviews: { rating: number }[] }).reviews ?? [];
      const avgRating = reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : null;
      return { ...c, rating: avgRating };
    });
  }, [cafes]);

  const mapCafes = useMemo(
    () => enrichedCafes.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      city: c.city,
      country: c.country,
      lat: c.lat!,
      lng: c.lng!,
      logoUrl: c.logoUrl,
      coverImageUrl: c.coverImageUrl,
      services: c.services,
      rating: c.rating,
    })),
    [enrichedCafes]
  );

  const certFilteredRoasters = useMemo(
    () => filterByCert(roasters, activeCert),
    [roasters, activeCert]
  );
  const serviceFilteredCafes = useMemo(
    () => filterByService(enrichedCafes, activeService),
    [enrichedCafes, activeService]
  );

  const visibleRoasters = useMemo(() => {
    if (!boundsRoasterIds) return certFilteredRoasters;
    return certFilteredRoasters.filter((r) => boundsRoasterIds.has(r.id));
  }, [certFilteredRoasters, boundsRoasterIds]);

  const visibleCafes = useMemo(() => {
    if (!boundsCafeIds) return serviceFilteredCafes;
    return serviceFilteredCafes.filter((c) => boundsCafeIds.has(c.id));
  }, [serviceFilteredCafes, boundsCafeIds]);

  const visibleRoasterIds = useMemo(() => {
    if (!boundsRoasterIds) return undefined;
    const set = new Set<string>();
    for (const r of visibleRoasters) set.add(r.id);
    return set;
  }, [visibleRoasters, boundsRoasterIds]);

  const visibleCafeIds = useMemo(() => {
    if (!boundsCafeIds) return undefined;
    const set = new Set<string>();
    for (const c of visibleCafes) set.add(c.id);
    return set;
  }, [visibleCafes, boundsCafeIds]);

  const totalRoasters = roasters.length;
  const totalCafes = cafes.length;
  const onMapRoasters = boundsRoasterIds ? visibleRoasters.length : totalRoasters;
  const onMapCafes = boundsCafeIds ? visibleCafes.length : totalCafes;

  return (
    <div className="h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex overflow-hidden relative">
        <h1 className="sr-only">{t("title")}</h1>

        {/* Map area */}
        <section className="relative w-full lg:w-[70%] h-full">
          <RoasterMap
            roasters={showRoasters ? mapData : []}
            cafes={showCafes ? mapCafes : []}
            visibleRoasterIds={visibleRoasterIds}
            visibleCafeIds={visibleCafeIds}
            onBoundsChange={handleBoundsChange}
          />

          {/* Map marker toggles */}
          <div className="absolute top-4 left-4 z-[500] flex gap-2">
            <button
              onClick={() => setShowRoasters((v) => !v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shadow ${
                showRoasters ? "bg-primary text-on-primary" : "bg-surface text-on-surface-variant border border-outline/30"
              }`}
            >
              {t("roastersCount", { count: onMapRoasters })}
            </button>
            <button
              onClick={() => setShowCafes((v) => !v)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors shadow ${
                showCafes ? "bg-secondary text-on-secondary" : "bg-surface text-on-surface-variant border border-outline/30"
              }`}
            >
              {t("cafesCount", { count: onMapCafes })}
            </button>
          </div>

          {/* Mobile drawer trigger */}
          <button
            className="lg:hidden absolute bottom-6 right-4 z-[500] flex items-center gap-2 bg-primary text-on-primary rounded-full px-4 py-2.5 shadow-lg text-sm font-semibold"
            onClick={() => setShowSidebar(true)}
            aria-label={t("showList")}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            {entityType === "roasters"
              ? t("roastersCount", { count: onMapRoasters })
              : t("cafesCount", { count: onMapCafes })}
          </button>
        </section>

        {/* Mobile backdrop */}
        {showSidebar && (
          <div
            className="lg:hidden fixed inset-0 z-[600] bg-black/40"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={[
            "bg-surface-container flex flex-col border-l border-outline-variant/10",
            "lg:relative lg:flex lg:w-[30%] lg:h-full lg:translate-x-0",
            "fixed inset-y-0 right-0 z-[700] w-[85vw] max-w-sm h-full transition-transform duration-300",
            showSidebar ? "translate-x-0" : "translate-x-full lg:translate-x-0",
          ].join(" ")}
        >
          {/* Sidebar header */}
          <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low space-y-3">
            {/* Entity toggle row */}
            <div className="flex items-center gap-2">
              <div className="flex gap-1 p-1 bg-surface-container-high rounded-full flex-1">
                <button
                  onClick={() => handleEntityToggle("roasters")}
                  className={`flex-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    entityType === "roasters"
                      ? "bg-primary text-on-primary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  ☕ {t("roastersCount", { count: onMapRoasters })}
                </button>
                <button
                  onClick={() => handleEntityToggle("cafes")}
                  className={`flex-1 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                    entityType === "cafes"
                      ? "bg-secondary text-on-secondary"
                      : "text-on-surface-variant hover:text-on-surface"
                  }`}
                >
                  ☺ {t("cafesCount", { count: onMapCafes })}
                </button>
              </div>
              <Link
                href={entityType === "roasters" ? "/roasters" : "/cafes"}
                className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 hover:text-primary transition-colors whitespace-nowrap"
              >
                {t("all")}
              </Link>
              <button
                className="lg:hidden text-on-surface-variant hover:text-on-surface transition-colors"
                onClick={() => setShowSidebar(false)}
                aria-label={t("closeList")}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Roaster filter chips */}
            {entityType === "roasters" && (
              <div className="flex gap-2 flex-wrap">
                {ROASTER_CERT_CHIPS.map(({ label, value }) => (
                  <button
                    key={label}
                    onClick={() => setActiveCert(value)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                      activeCert === value
                        ? "bg-primary text-white"
                        : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Cafe filter chips */}
            {entityType === "cafes" && (
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setActiveService(null)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                    activeService === null
                      ? "bg-secondary text-on-secondary"
                      : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant"
                  }`}
                >
                  ALL
                </button>
                {CAFE_FILTER_CHIPS.map((svc) => (
                  <button
                    key={svc}
                    onClick={() => setActiveService(activeService === svc ? null : svc)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                      activeService === svc
                        ? "bg-secondary text-on-secondary"
                        : "bg-surface-container-high text-on-surface-variant hover:bg-surface-variant"
                    }`}
                  >
                    {svc.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {entityType === "roasters" ? (
              visibleRoasters.length > 0 ? (
                visibleRoasters.map((roaster) => (
                  <RoasterCard key={roaster.id} roaster={roaster} variant="compact" />
                ))
              ) : (
                <p className="text-center text-on-surface-variant/60 text-sm py-8">
                  {t("noRoastersFilter")}
                </p>
              )
            ) : visibleCafes.length > 0 ? (
              visibleCafes.map((cafe) => <CafeMapCard key={cafe.id} cafe={cafe} />)
            ) : (
              <p className="text-center text-on-surface-variant/60 text-sm py-8">
                {t("noCafesFilter")}
              </p>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
