"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  updateRoasterProfile,
  deleteRoasterImage,
  revalidateAfterUpload,
} from "@/actions/roaster.actions";
import { UploadButton } from "@/lib/uploadthing";
import {
  CERTIFICATIONS,
  CERTIFICATION_LABELS,
  ROAST_STYLES,
  ORIGINS,
} from "@/types/certifications";
import { DeleteAccountSection } from "@/components/shared/DeleteAccountSection";
import { DashboardGallery } from "@/components/shared/DashboardGallery";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import { MiniMap } from "@/components/shared/MiniMap";
import { MarketingConsentToggle } from "@/components/shared/MarketingConsentToggle";
import type { GalleryImage } from "@/components/shared/DashboardGallery";

interface RoasterData {
  id: string;
  name: string;
  slug: string;
  description: string;
  city: string;
  country: string;
  status: string;
  address: string;
  lat: number | null;
  lng: number | null;
  website: string;
  email: string;
  instagram: string;
  shopUrl: string;
  certifications: string[];
  origins: string[];
  roastStyles: string[];
  imageUrl: string | null;
  imageId: string | null;
  galleryImages: GalleryImage[];
}

interface Stats {
  pageViews: number;
  websiteClicks: number;
  shopClicks: number;
  contactClicks: number;
}

function LocationEdit({ roaster }: { roaster: RoasterData }) {
  const [address, setAddress] = useState(roaster.address);
  const [lat, setLat] = useState(roaster.lat?.toString() ?? "");
  const [lng, setLng] = useState(roaster.lng?.toString() ?? "");

  return (
    <div className="space-y-3">
      <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-2">
        Location
      </label>
      <AddressAutocomplete
        value={address}
        onChange={setAddress}
        onCoordsChange={(la, ln) => {
          setLat(String(la));
          setLng(String(ln));
        }}
        placeholder="Search for your roastery address..."
      />
      {lat && lng && (
        <MiniMap lat={parseFloat(lat)} lng={parseFloat(lng)} />
      )}
      <div className="grid grid-cols-2 gap-4">
        <input
          type="hidden"
          name="address"
          value={address}
          readOnly
        />
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-1">
            Latitude
          </label>
          <input
            name="lat"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
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
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Auto-filled"
          />
        </div>
      </div>
    </div>
  );
}

export function DashboardClient({
  roaster,
  stats,
  marketingConsent,
}: {
  roaster: RoasterData;
  stats: Stats;
  marketingConsent: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleRemoveImage() {
    if (!roaster.imageId) return;
    setRemovingImage(true);
    setMessage(null);
    const result = await deleteRoasterImage(roaster.id, roaster.imageId);
    if (result.success) {
      setMessage({ type: "success", text: "Image removed." });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error });
    }
    setRemovingImage(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateRoasterProfile(roaster.id, formData);

    if (result.success) {
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setEditing(false);
    } else {
      setMessage({ type: "error", text: result.error });
    }
    setSaving(false);
  }

  const statusColor =
    roaster.status === "VERIFIED"
      ? "text-green-700 bg-green-100"
      : roaster.status === "PENDING"
        ? "text-amber-700 bg-amber-100"
        : "text-red-700 bg-red-100";

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      {/* Header */}
      <div className="flex items-start justify-between mb-12">
        <div>
          <h1 className="font-headline text-4xl tracking-tight mb-2">
            {roaster.name}
          </h1>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${statusColor}`}>
              {roaster.status}
            </span>
            <span className="text-sm text-on-surface-variant/60">
              {roaster.city}, {roaster.country}
            </span>
          </div>
        </div>
        <Link
          href={`/roasters/${roaster.slug}`}
          className="text-xs uppercase tracking-widest font-bold text-primary pb-1 border-b-2 border-primary/20 hover:border-primary transition-all"
        >
          View Public Profile
        </Link>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
        {[
          { label: "Page Views", value: stats.pageViews },
          { label: "Website Clicks", value: stats.websiteClicks },
          { label: "Shop Clicks", value: stats.shopClicks },
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

      {/* Image Section */}
      <section className="bg-surface-container-lowest editorial-shadow rounded-2xl p-8 border border-outline-variant/10 mb-8">
        <h2 className="font-headline text-2xl tracking-tight mb-6">Roaster Image</h2>

        {roaster.imageUrl && (
          <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden mb-4">
            <Image
              src={roaster.imageUrl}
              alt={roaster.name}
              fill
              sizes="(max-width: 1024px) 100vw, 960px"
              className="object-cover"
            />
            <button
              onClick={handleRemoveImage}
              disabled={removingImage}
              className="absolute top-3 right-3 bg-black/60 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-black/80 transition-colors disabled:opacity-50"
            >
              {removingImage ? "Removing..." : "Remove"}
            </button>
          </div>
        )}

        <div className="flex flex-col items-center gap-3 border-2 border-dashed border-outline-variant/30 rounded-xl p-8 bg-surface-container-low">
          <p className="text-on-surface-variant/70 text-sm">
            {roaster.imageUrl ? "Replace your roaster image" : "Upload your roaster image"}
          </p>
          <UploadButton
            endpoint="roasterImage"
            onClientUploadComplete={async () => {
              await revalidateAfterUpload(roaster.id);
              setMessage({ type: "success", text: "Image uploaded!" });
              router.refresh();
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

      {/* Gallery */}
      <DashboardGallery
        images={roaster.galleryImages}
        entityType="ROASTER"
        entityId={roaster.id}
        maxImages={3}
      />

      {/* Profile Section */}
      <section className="bg-surface-container-lowest editorial-shadow rounded-2xl p-8 border border-outline-variant/10">
        <div className="flex items-center justify-between mb-8">
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-2">
                Description
              </label>
              <textarea
                name="description"
                defaultValue={roaster.description}
                rows={4}
                className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Location */}
            <LocationEdit roaster={roaster} />

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-2">
                  Website
                </label>
                <input
                  name="website"
                  type="url"
                  defaultValue={roaster.website}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-2">
                  Shop URL
                </label>
                <input
                  name="shopUrl"
                  type="url"
                  defaultValue={roaster.shopUrl}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-2">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  defaultValue={roaster.email}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-2">
                  Instagram
                </label>
                <input
                  name="instagram"
                  defaultValue={roaster.instagram}
                  className="w-full bg-surface-container-low border border-outline-variant/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            {/* Certifications */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-3">
                Certifications
              </label>
              <div className="flex flex-wrap gap-2">
                {CERTIFICATIONS.map((cert) => (
                  <label key={cert} className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-surface-container-high transition-colors">
                    <input
                      type="checkbox"
                      name="certifications"
                      value={cert}
                      defaultChecked={roaster.certifications.includes(cert)}
                      className="accent-primary"
                    />
                    {CERTIFICATION_LABELS[cert]}
                  </label>
                ))}
              </div>
            </div>

            {/* Roast Styles */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-3">
                Roast Styles
              </label>
              <div className="flex flex-wrap gap-2">
                {ROAST_STYLES.map((style) => (
                  <label key={style} className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-surface-container-high transition-colors">
                    <input
                      type="checkbox"
                      name="roastStyles"
                      value={style}
                      defaultChecked={roaster.roastStyles.includes(style)}
                      className="accent-primary"
                    />
                    {style}
                  </label>
                ))}
              </div>
            </div>

            {/* Origins */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-3">
                Coffee Origins
              </label>
              <div className="flex flex-wrap gap-2">
                {ORIGINS.map((origin) => (
                  <label key={origin} className="flex items-center gap-2 bg-surface-container-low px-3 py-2 rounded-lg text-sm cursor-pointer hover:bg-surface-container-high transition-colors">
                    <input
                      type="checkbox"
                      name="origins"
                      value={origin}
                      defaultChecked={roaster.origins.includes(origin)}
                      className="accent-primary"
                    />
                    {origin}
                  </label>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="bg-primary text-on-primary px-6 py-3 rounded-lg font-medium text-sm hover:bg-primary-container transition-all shadow-lg shadow-primary/10 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setMessage(null); }}
                className="border border-outline text-on-surface-variant px-6 py-3 rounded-lg font-medium text-sm hover:bg-surface-container-low transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Description */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-2">
                Description
              </p>
              <p className="text-on-surface-variant font-light leading-relaxed">
                {roaster.description || "No description yet."}
              </p>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Website", value: roaster.website },
                { label: "Shop", value: roaster.shopUrl },
                { label: "Email", value: roaster.email },
                { label: "Instagram", value: roaster.instagram ? `@${roaster.instagram}` : "" },
              ].map((field) => (
                <div key={field.label}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-1">
                    {field.label}
                  </p>
                  <p className="text-sm">{field.value || "—"}</p>
                </div>
              ))}
            </div>

            {/* Certifications */}
            {roaster.certifications.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-2">
                  Certifications
                </p>
                <div className="flex flex-wrap gap-2">
                  {roaster.certifications.map((cert) => (
                    <span key={cert} className="bg-surface-container-high px-3 py-1.5 rounded-full text-xs font-medium">
                      {CERTIFICATION_LABELS[cert as keyof typeof CERTIFICATION_LABELS] ?? cert}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Roast Styles */}
            {roaster.roastStyles.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-2">
                  Roast Styles
                </p>
                <div className="flex flex-wrap gap-2">
                  {roaster.roastStyles.map((style) => (
                    <span key={style} className="bg-surface-container-high px-3 py-1.5 rounded-full text-xs font-medium">
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Origins */}
            {roaster.origins.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant/60 mb-2">
                  Coffee Origins
                </p>
                <div className="flex flex-wrap gap-2">
                  {roaster.origins.map((origin) => (
                    <span key={origin} className="bg-surface-container-high px-3 py-1.5 rounded-full text-xs font-medium">
                      {origin}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
       </section>
       <MarketingConsentToggle initial={marketingConsent} />
       <DeleteAccountSection />
    </main>
  );
}
