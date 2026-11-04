"use client";

import { useSyncExternalStore, useEffect, useState, useRef, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CERTIFICATION_LABELS, type Certification } from "@/types/certifications";
import "leaflet/dist/leaflet.css";

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

const DEFAULT_CENTER: [number, number] = [51.9, 19.1];
const DEFAULT_ZOOM = 5;

function useGeolocation() {
  const [position, setPosition] = useState<[number, number] | null>(null);
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => {}
    );
  }, []);
  return position;
}

function TileAltObserver() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof HTMLImageElement && node.classList.contains("leaflet-tile") && !node.alt) {
            node.alt = "";
          }
        }
      }
    });
    observer.observe(container, { childList: true, subtree: true });
    container.querySelectorAll("img.leaflet-tile").forEach((img) => {
      if (!(img as HTMLImageElement).alt) (img as HTMLImageElement).alt = "";
    });
    return () => observer.disconnect();
  }, [map]);
  return null;
}

interface PointItem {
  id: string;
  lat: number;
  lng: number;
  type: "roaster" | "cafe";
}

function BoundsReporter({
  allItems,
  onBoundsChange,
}: {
  allItems: PointItem[];
  onBoundsChange: (visibleIds: Set<string>) => void;
}) {
  const map = useMap();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const update = useCallback(() => {
    const bounds = map.getBounds() as L.LatLngBounds;
    const visible = new Set<string>();
    for (const item of allItems) {
      if (bounds.contains([item.lat, item.lng])) {
        visible.add(item.id);
      }
    }
    onBoundsChange(visible);
  }, [map, allItems, onBoundsChange]);

  useEffect(() => {
    update();
    const handler = () => {
      if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(update, 150);
    };
    map.on("moveend zoomend", handler);
    return () => {
      map.off("moveend zoomend", handler);
      if (timeoutRef.current != null) clearTimeout(timeoutRef.current);
    };
  }, [map, update]);

  return null;
}

export interface MapRoaster {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  image?: string;
  verified: boolean;
  certifications: string[];
  rating: number | null;
}

export interface MapCafe {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  logoUrl?: string | null;
  coverImageUrl?: string | null;
  services: string[];
  rating: number | null;
}

const roasterIcon = new L.DivIcon({
  className: "custom-marker",
  html: `<div style="
    background: #974400;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(151,68,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 16px;
  ">&#9749;</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
});

const cafeIcon = new L.DivIcon({
  className: "custom-marker",
  html: `<div style="
    background: #f97316;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 4px 12px rgba(249,115,22,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 14px;
  ">&#9787;</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -18],
});

function FlyToCenter({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

/** Opens the popup of the marker at the focused coordinates (deep link from a profile). */
function FocusMarker({ focus }: { focus: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      let best: L.Marker | null = null;
      let bestDist = Infinity;
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          const p = layer.getLatLng();
          const d = Math.hypot(p.lat - focus.lat, p.lng - focus.lng);
          if (d < bestDist) {
            bestDist = d;
            best = layer;
          }
        }
      });
      if (best && bestDist < 0.01) (best as L.Marker).openPopup();
    }, 400);
    return () => clearTimeout(timer);
  }, [map, focus.lat, focus.lng]);
  return null;
}

function RoasterPopup({ roaster }: { roaster: MapRoaster }) {
  const t = useTranslations("map");
  const topTag = roaster.certifications[0];
  const hasRating = roaster.rating != null;
  return (
    <div className="min-w-[220px] max-w-[260px]">
      {roaster.image && (
        <div className="w-full h-28 mb-2 overflow-hidden rounded-lg">
          <Image
            src={roaster.image}
            alt={roaster.name}
            width={260}
            height={112}
            className="w-full h-full object-cover"
            sizes="260px"
          />
        </div>
      )}
      <h4 className="font-bold text-sm mb-0.5">{roaster.name}</h4>
      <p className="label-mono text-outline mb-2">{roaster.city} — {roaster.country}</p>
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        {roaster.verified && (
          <span className="label-mono inline-block bg-secondary text-on-secondary text-[9px] px-1.5 py-0.5 rounded-full">
            {t("verified")}
          </span>
        )}
        {hasRating && (
          <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-on-surface-variant">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {roaster.rating!.toFixed(1)}
          </span>
        )}
        {topTag && (
          <span className="label-mono inline-block border border-outline-variant text-on-surface-variant text-[9px] px-1.5 py-0.5 rounded-full">
            {CERTIFICATION_LABELS[topTag as Certification] ?? topTag}
          </span>
        )}
      </div>
      <Link href={`/roasters/${roaster.slug}`} className="text-xs text-primary font-semibold hover:underline">
        {t("viewProfile")} &rarr;
      </Link>
    </div>
  );
}

function CafePopup({ cafe }: { cafe: MapCafe }) {
  const t = useTranslations("map");
  const tf = useTranslations("filters");
  const serviceLabel = (s: string) => (tf.has(`amenity.${s}`) ? tf(`amenity.${s}` as "amenity.wifi") : s);
  const imageUrl = cafe.logoUrl ?? cafe.coverImageUrl;
  const topServices = cafe.services.slice(0, 3);
  const hasRating = cafe.rating != null;
  return (
    <div className="min-w-[220px] max-w-[260px]">
      {imageUrl && (
        <div className="w-full h-28 mb-2 overflow-hidden rounded-lg bg-surface-container">
          <Image
            src={imageUrl}
            alt={cafe.name}
            width={260}
            height={112}
            className="w-full h-full object-cover"
            sizes="260px"
          />
        </div>
      )}
      <h4 className="font-bold text-sm mb-0.5">{cafe.name}</h4>
      <p className="label-mono text-outline mb-2">{cafe.city} — {cafe.country}</p>
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {hasRating && (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-on-surface-variant">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {cafe.rating!.toFixed(1)}
            </span>
          )}
        {topServices.length > 0 && (
          <>
            {topServices.map((s) => (
              <span
                key={s}
                className="inline-block border border-outline-variant text-on-surface-variant text-[10px] px-1.5 py-0.5 rounded-full"
              >
                {serviceLabel(s)}
              </span>
            ))}
            {cafe.services.length > 3 && (
              <span className="text-[10px] text-outline">+{cafe.services.length - 3}</span>
            )}
          </>
        )}
      </div>
      <Link href={`/cafes/${cafe.slug}`} className="text-xs text-primary font-semibold hover:underline">
        {t("viewCafe")} &rarr;
      </Link>
    </div>
  );
}

interface RoasterMapProps {
  roasters: MapRoaster[];
  cafes: MapCafe[];
  visibleRoasterIds?: Set<string>;
  visibleCafeIds?: Set<string>;
  onBoundsChange?: (visibleIds: { roasterIds: Set<string>; cafeIds: Set<string> }) => void;
  /** Center the map on one place and open its popup (e.g. /map?lat=..&lng=..&zoom=14). */
  focus?: { lat: number; lng: number; zoom?: number };
}

export function RoasterMap({
  roasters,
  cafes = [],
  visibleRoasterIds,
  visibleCafeIds,
  onBoundsChange,
  focus,
}: RoasterMapProps) {
  const t = useTranslations("map");
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const userPosition = useGeolocation();

  const allPoints: PointItem[] = useMemo(
    () => [
      ...roasters.map((r) => ({ id: r.id, lat: r.lat, lng: r.lng, type: "roaster" as const })),
      ...cafes.map((c) => ({ id: c.id, lat: c.lat, lng: c.lng, type: "cafe" as const })),
    ],
    [roasters, cafes]
  );

  const handleBoundsChange = useCallback(
    (visibleIds: Set<string>) => {
      if (!onBoundsChange) return;
      const roasterIds = new Set<string>();
      const cafeIds = new Set<string>();
      for (const item of allPoints) {
        if (visibleIds.has(item.id)) {
          if (item.type === "roaster") roasterIds.add(item.id);
          else cafeIds.add(item.id);
        }
      }
      onBoundsChange({ roasterIds, cafeIds });
    },
    [allPoints, onBoundsChange]
  );

  const shouldShowRoaster = useCallback(
    (id: string) => !visibleRoasterIds || visibleRoasterIds.has(id),
    [visibleRoasterIds]
  );
  const shouldShowCafe = useCallback(
    (id: string) => !visibleCafeIds || visibleCafeIds.has(id),
    [visibleCafeIds]
  );

  if (!mounted) {
    return (
      <div className="w-full h-full bg-surface-container-low flex items-center justify-center">
        <p className="text-on-surface-variant/60 text-sm">{t("loading")}</p>
      </div>
    );
  }

  const center: [number, number] = userPosition ?? DEFAULT_CENTER;
  const zoom = userPosition ? 10 : DEFAULT_ZOOM;

  return (
    <MapContainer
      center={focus ? [focus.lat, focus.lng] : DEFAULT_CENTER}
      zoom={focus ? focus.zoom ?? 14 : DEFAULT_ZOOM}
      style={{ width: "100%", height: "100%" }}
      zoomControl={false}
    >
      {userPosition && !focus && <FlyToCenter center={center} zoom={zoom} />}
      {focus && <FocusMarker focus={focus} />}
      <TileAltObserver />
      {onBoundsChange && <BoundsReporter allItems={allPoints} onBoundsChange={handleBoundsChange} />}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {roasters.filter((r) => shouldShowRoaster(r.id)).map((roaster) => (
        <Marker key={roaster.id} position={[roaster.lat, roaster.lng]} icon={roasterIcon}>
          <Popup>
            <RoasterPopup roaster={roaster} />
          </Popup>
        </Marker>
      ))}
      {cafes.filter((c) => shouldShowCafe(c.id)).map((cafe) => (
        <Marker key={cafe.id} position={[cafe.lat, cafe.lng]} icon={cafeIcon}>
          <Popup>
            <CafePopup cafe={cafe} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
