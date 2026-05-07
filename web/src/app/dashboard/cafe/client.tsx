"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  addCafeRoasterRelation,
  removeCafeRoasterRelation,
  searchVerifiedRoasters,
} from "@/actions/cafe-relation.actions";
import { UploadButton } from "@/lib/uploadthing";
import { updateCafeCoverImage, updateCafeProfile } from "@/actions/cafe.actions";
import { DeleteAccountSection } from "@/components/shared/DeleteAccountSection";
import { DashboardGallery } from "@/components/shared/DashboardGallery";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import dynamic from "next/dynamic";
const MiniMap = dynamic(() => import("@/components/shared/MiniMap").then((m) => m.MiniMap), { ssr: false });
import { MarketingConsentToggle } from "@/components/shared/MarketingConsentToggle";
import type { GalleryImage } from "@/components/shared/DashboardGallery";

type Cafe = {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  status: string;
  description: string;
  address: string;
  lat: number | null;
  lng: number | null;
  website: string;
  email: string;
  instagram: string;
  phone: string;
  coverImageUrl: string | null;
};

type LinkedRoaster = { id: string; name: string; slug: string; city: string };
type SearchResult = { id: string; name: string; slug: string; city: string; country: string };
type Stats = { pageViews: number; websiteClicks: number; contactClicks: number };

export function CafeDashboardClient({
  cafe,
  linkedRoasters: initialLinked,
  galleryImages,
  marketingConsent,
  stats,
}: {
  cafe: Cafe;
  linkedRoasters: LinkedRoaster[];
  galleryImages: GalleryImage[];
  marketingConsent: boolean;
  stats: Stats;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [linked, setLinked] = useState(initialLinked);
  const [editAddress, setEditAddress] = useState(cafe.address);
  const [editLat, setEditLat] = useState(cafe.lat?.toString() ?? "");
  const [editLng, setEditLng] = useState(cafe.lng?.toString() ?? "");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    const result = await updateCafeProfile(cafe.id, formData);
    if (result.success) {
      setMessage({ type: "success", text: "Profile updated!" });
      setEditing(false);
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error });
    }
    setSaving(false);
  };

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    const r = await searchVerifiedRoasters(q);
    setResults(r);
  };

  const handleAdd = (roaster: SearchResult) => {
    startTransition(async () => {
      const result = await addCafeRoasterRelation(cafe.id, roaster.id, cafe.slug, roaster.slug);
      if (result.success) {
        setLinked((prev) => [...prev, { id: roaster.id, name: roaster.name, slug: roaster.slug, city: roaster.city }]);
        setMessage({ type: "success", text: `Added ${roaster.name}` });
        setQuery("");
        setResults([]);
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  };

  const handleRemove = (r: LinkedRoaster) => {
    startTransition(async () => {
      const result = await removeCafeRoasterRelation(cafe.id, r.id, cafe.slug, r.slug);
      if (result.success) {
        setLinked((prev) => prev.filter((lr) => lr.id !== r.id));
        setMessage({ type: "success", text: `Removed ${r.name}` });
      } else {
        setMessage({ type: "error", text: result.error });
      }
    });
  };

  const statusColor =
    cafe.status === "VERIFIED"
      ? "text-green-700 bg-green-100"
      : cafe.status === "PENDING"
        ? "text-amber-700 bg-amber-100"
        : "text-red-700 bg-red-100";

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="flex items-start justify-between mb-12">
        <div>
          <h1 className="font-headline text-4xl tracking-tight mb-2">
            {cafe.name}
          </h1>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${statusColor}`}>
              {cafe.status}
            </span>
            <span className="text-sm text-on-surface-variant/60">
              {cafe.city}, {cafe.country}
            </span>
          </div>
        </div>
        <Link
          href={`/cafes/${cafe.slug}`}
          className="text-xs uppercase tracking-widest font-bold text-primary pb-1 border-b-2 border-primary/20 hover:border-primary transition-all"
        >
          View Public Profile
        </Link>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-16">
        {[
          { label: "Page Views", value: stats.pageViews },
          { label: "Website Clicks", value: stats.websiteClicks },
          { label: "Contact Clicks", value: stats.contactClicks },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-surface-container-lowest editorial-shadow rounded-xl p-6 border border-outline-variant/10"
          >
            <p className="text-3xl font-bold tracking-tight mb-1">{stat.value}</p>
            <p className="text-xs uppercase tracking-widest text-on-surface-variant/60">
              {stat.label}
            </p>
          </div>
        ))}
      </section>

      {/* Message */}
      {message && (
        <div
          className={`mb-8 p-4 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {cafe.status === "PENDING" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-8">
          Your profile is pending review. Changes will be visible after verification.
        </div>
      )}

      {/* Cover Image Section */}
      <section className="bg-surface-container-lowest editorial-shadow rounded-2xl p-8 border border-outline-variant/10 mb-8">
        <h2 className="font-headline text-2xl tracking-tight mb-6">Cover Image</h2>

        {cafe.coverImageUrl && (
          <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden mb-4">
            <Image
              src={cafe.coverImageUrl}
              alt={cafe.name}
              fill
              sizes="(max-width: 1024px) 100vw, 960px"
              className="object-cover"
            />
          </div>
        )}

        <div className="flex flex-col items-center gap-3 border-2 border-dashed border-outline-variant/30 rounded-xl p-8 bg-surface-container-low">
          <p className="text-on-surface-variant/70 text-sm">
            {cafe.coverImageUrl ? "Replace your cover image" : "Upload a cover image for your cafe profile"}
          </p>
          <UploadButton
            endpoint="cafeImage"
            headers={{ "x-cafe-id": cafe.id }}
            onClientUploadComplete={async (res) => {
              if (res?.[0]?.url) {
                await updateCafeCoverImage(cafe.id, res[0].url);
                setMessage({ type: "success", text: "Cover image uploaded!" });
                router.refresh();
              }
            }}
            onUploadError={(error: Error) => {
              setMessage({ type: "error", text: error.message });
            }}
            appearance={{
              button: "bg-primary text-on-primary px-6 py-3 rounded-lg text-sm font-medium hover:bg-primary-container transition-colors ut-uploading:bg-primary/50",
              allowedContent: "text-on-surface-variant/50 text-xs mt-2",
            }}
          />
        </div>
      </section>

      {/* Profile Section */}
      <section className="bg-surface-container-lowest editorial-shadow rounded-2xl p-8 border border-outline-variant/10 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-headline text-2xl tracking-tight">Profile Details</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs uppercase tracking-widest font-bold text-primary pb-1 border-b-2 border-primary/20 hover:border-primary transition-all"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-1">
                Description
              </label>
              <textarea
                name="description"
                defaultValue={cafe.description}
                rows={4}
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-1">
                Address
              </label>
              <AddressAutocomplete
                value={editAddress}
                onChange={setEditAddress}
                onCoordsChange={(lat, lng) => {
                  setEditLat(String(lat));
                  setEditLng(String(lng));
                }}
                placeholder="Search for your cafe address..."
              />
              <input type="hidden" name="address" value={editAddress} readOnly />
              {editLat && editLng && (
                <div className="mt-2">
                  <MiniMap
                    lat={parseFloat(editLat)}
                    lng={parseFloat(editLng)}
                  />
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-1">
                  Latitude
                </label>
                <input
                  name="lat"
                  value={editLat}
                  onChange={(e) => setEditLat(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Auto-filled"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-1">
                  Longitude
                </label>
                <input
                  name="lng"
                  value={editLng}
                  onChange={(e) => setEditLng(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="Auto-filled"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-1">
                  Website
                </label>
                <input
                  name="website"
                  type="url"
                  defaultValue={cafe.website}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-1">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  defaultValue={cafe.email}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-1">
                  Instagram
                </label>
                <input
                  name="instagram"
                  defaultValue={cafe.instagram}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-1">
                  Phone
                </label>
                <input
                  name="phone"
                  defaultValue={cafe.phone}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-container transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-sm text-on-surface-variant/60 hover:text-on-surface"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3 text-sm">
            {cafe.description && (
              <p className="text-on-surface-variant/70">{cafe.description.slice(0, 200)}{cafe.description.length > 200 ? "..." : ""}</p>
            )}
            {cafe.address && (
              <p className="text-on-surface-variant/50">{cafe.address}, {cafe.city}, {cafe.country}</p>
            )}
            {cafe.website && (
              <p className="text-on-surface-variant/50">{cafe.website}</p>
            )}
            {!cafe.description && !cafe.address && !cafe.website && (
              <p className="text-on-surface-variant/50 italic">No profile details yet. Click Edit to add.</p>
            )}
          </div>
        )}
      </section>

      {/* Gallery */}
      <DashboardGallery
        images={galleryImages}
        entityType="CAFE"
        entityId={cafe.id}
        maxImages={3}
      />

      {/* Roasters we serve */}
      <section className="bg-surface-container-lowest editorial-shadow rounded-2xl p-8 border border-outline-variant/10">
        <h2 className="font-headline text-2xl mb-4">Roasters we serve</h2>

        {linked.length > 0 && (
          <div className="space-y-2 mb-5">
            {linked.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between bg-surface-container rounded-xl px-4 py-3"
              >
                <div>
                  <p className="font-medium text-sm">{r.name}</p>
                  <p className="text-xs text-on-surface-variant/60">{r.city}</p>
                </div>
                <button
                  onClick={() => handleRemove(r)}
                  disabled={isPending}
                  className="text-xs text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search roasters by name…"
            className="w-full border border-outline/30 rounded-lg px-3 py-2 bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline/20 rounded-xl shadow-lg z-10 overflow-hidden">
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleAdd(r)}
                  disabled={isPending || linked.some((lr) => lr.id === r.id)}
                  className="w-full text-left px-4 py-3 hover:bg-surface-container transition-colors text-sm disabled:opacity-40"
                >
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-on-surface-variant/60">
                    {r.city}, {r.country}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
      <MarketingConsentToggle initial={marketingConsent} />
      <DeleteAccountSection />
    </main>
  );
}
