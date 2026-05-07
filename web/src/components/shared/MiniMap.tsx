"use client";

import { useSyncExternalStore } from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const ICON = new L.DivIcon({
  className: "mini-map-marker",
  html: `<div style="
    background: #d97706;
    width: 28px;
    height: 28px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(151,68,0,0.4);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

interface MiniMapProps {
  lat: number;
  lng: number;
}

export function MiniMap({ lat, lng }: MiniMapProps) {
  const mounted = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  if (!mounted) {
    return (
      <div className="h-[200px] w-full animate-pulse rounded-lg bg-gray-100" />
    );
  }

  return (
    <div className="h-[200px] w-full overflow-hidden rounded-lg border border-gray-200">
      <MapContainer
        center={[lat, lng]}
        zoom={15}
        className="h-full w-full"
        dragging={false}
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} icon={ICON} />
      </MapContainer>
    </div>
  );
}
