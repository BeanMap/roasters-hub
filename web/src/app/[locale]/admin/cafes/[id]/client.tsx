"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Prisma } from "@prisma/client"
import { verifyCafe, rejectCafe } from "@/actions/cafe.actions"
import { IdentitySection } from "./_sections/IdentitySection"
import { LocationSection } from "./_sections/LocationSection"
import { ContactSection } from "./_sections/ContactSection"
import { HoursSection } from "./_sections/HoursSection"
import { ServicesSection } from "./_sections/ServicesSection"
import { ImagesSection } from "./_sections/ImagesSection"
import { AdminSection } from "./_sections/AdminSection"

type Proposal = {
  changeType: string
  fieldKey: string
  currentValue: string | null
  proposedValue: string
  confidence: number
  status: string
  createdAt: string
}

type Cafe = {
  id: string
  name: string
  slug: string
  city: string
  country: string
  countryCode: string
  status: string
  description: string | null
  address: string | null
  postalCode: string | null
  lat: number | null
  lng: number | null
  website: string | null
  email: string | null
  instagram: string | null
  phone: string | null
  priceRange: string | null
  seatingCapacity: number | null
  serving: string[]
  services: string[]
  coverImageUrl: string | null
  logoUrl: string | null
  sourceUrl: string | null
  openingHours: Prisma.JsonValue | null
  featured: boolean
  ownerId: string | null
  rejectedReason: string | null
  createdAt: string
  updatedAt: string
  owner: { email: string } | null
  proposals: Proposal[]
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  VERIFIED: "bg-green-100 text-green-900",
  REJECTED: "bg-red-100 text-red-900",
}

type Section =
  | "identity"
  | "location"
  | "contact"
  | "hours"
  | "services"
  | "images"
  | "admin"

export function AdminCafeDetailClient({ cafe }: { cafe: Cafe }) {
  const t = useTranslations("admin")
  const [activeSection, setActiveSection] = useState<Section>("identity")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  const navItems: { id: Section; label: string }[] = [
    { id: "identity", label: t("identity") },
    { id: "location", label: t("location") },
    { id: "contact", label: t("contact") },
    { id: "hours", label: t("hours") },
    { id: "services", label: t("services") },
    { id: "images", label: t("images") },
    { id: "admin", label: t("admin") },
  ]

  const handleVerify = () => {
    setError(null)
    startTransition(async () => {
      const result = await verifyCafe(cafe.id)
      if (!result.success) setError(result.error ?? t("errorDescription"))
    })
  }

  const handleReject = () => {
    if (!rejectReason.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await rejectCafe(cafe.id, rejectReason)
      if (!result.success) setError(result.error ?? t("errorDescription"))
      else setShowRejectModal(false)
    })
  }

  return (
    <>
      {/* Sticky Toolbar */}
      <div className="sticky top-0 z-10 -mx-6 mb-8 flex flex-wrap items-center gap-3 border-b border-white/10 bg-black/80 px-6 py-3 backdrop-blur">
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-100 truncate">{cafe.name}</h1>
          <p className="text-xs text-on-surface-variant">
            {cafe.city}, {cafe.country}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_COLORS[cafe.status] ?? ""}`}
          >
            {cafe.status}
          </span>
          {cafe.status === "PENDING" && (
            <>
              <button
                onClick={handleVerify}
                disabled={isPending}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isPending ? "…" : t("verify")}
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={isPending}
                className="rounded-lg border border-red-500 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
              >
                {t("reject")}
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-3 text-xs underline opacity-70 hover:opacity-100">
            {t("dismiss")}
          </button>
        </div>
      )}

      {/* Main layout: sidebar + content */}
      <div className="flex gap-8">
        {/* Left sidebar */}
        <nav className="w-48 shrink-0">
          <ul className="flex flex-col gap-0.5">
            {navItems.map((item) => {
              const isActive = activeSection === item.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full rounded-r-lg border-l-2 px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? "border-[var(--color-primary)] bg-[var(--color-surface-container)] font-semibold text-[var(--color-on-surface)]"
                        : "border-transparent text-[var(--color-outline)] hover:bg-[var(--color-surface-container-low)] hover:text-[var(--color-on-surface)]"
                    }`}
                  >
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Section content */}
        <div className="flex-1 min-w-0">
          {activeSection === "identity" && (
            <IdentitySection
              cafeId={cafe.id}
              initial={{
                name: cafe.name,
                city: cafe.city,
                country: cafe.country,
                countryCode: cafe.countryCode,
                description: cafe.description,
                priceRange: cafe.priceRange,
                seatingCapacity: cafe.seatingCapacity,
              }}
            />
          )}
          {activeSection === "location" && (
            <LocationSection
              cafeId={cafe.id}
              initial={{
                address: cafe.address,
                postalCode: cafe.postalCode,
                lat: cafe.lat,
                lng: cafe.lng,
                sourceUrl: cafe.sourceUrl,
              }}
            />
          )}
          {activeSection === "contact" && (
            <ContactSection
              cafeId={cafe.id}
              initial={{
                website: cafe.website,
                instagram: cafe.instagram,
                phone: cafe.phone,
                email: cafe.email,
              }}
            />
          )}
          {activeSection === "hours" && (
            <HoursSection cafeId={cafe.id} initialHours={cafe.openingHours} />
          )}
          {activeSection === "services" && (
            <ServicesSection
              cafeId={cafe.id}
              initial={{
                serving: cafe.serving,
                services: cafe.services,
              }}
            />
          )}
          {activeSection === "images" && (
            <ImagesSection
              cafeId={cafe.id}
              initial={{
                coverImageUrl: cafe.coverImageUrl,
                logoUrl: cafe.logoUrl,
              }}
            />
          )}
          {activeSection === "admin" && (
            <AdminSection
              cafeId={cafe.id}
              initial={{
                featured: cafe.featured,
                ownerId: cafe.ownerId,
                status: cafe.status,
              }}
            />
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-2xl ring-1 ring-[var(--color-outline-variant)]">
            <h3 className="mb-1 text-lg font-bold text-[var(--color-on-surface)]">{t("rejectCafe")}</h3>
            <p className="mb-4 text-sm text-[var(--color-on-surface-variant)]">
              {t("rejectReasonHint")}
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder={t("reasonPlaceholder")}
              className="mb-4 w-full rounded-lg border border-[var(--color-outline-variant)] bg-surface-container-lowest px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectReason("")
                }}
                className="px-4 py-2 text-sm text-[var(--color-outline)] hover:text-[var(--color-on-surface)]"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || isPending}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50 hover:bg-red-700 transition-colors"
              >
                {isPending ? t("rejecting") : t("rejectCafe")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
