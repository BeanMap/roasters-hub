"use client"

import { useState, useTransition } from "react"
import { useTranslations } from "next-intl"
import { Prisma } from "@prisma/client"
import { verifyRoaster, rejectRoaster } from "@/actions/admin.actions"
import { IdentitySection } from "./_sections/IdentitySection"
import { LocationSection } from "./_sections/LocationSection"
import { ContactSection } from "./_sections/ContactSection"
import { CoffeeSection } from "./_sections/CoffeeSection"
import { HoursSection } from "./_sections/HoursSection"
import { OfferSection } from "./_sections/OfferSection"
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

type Roaster = {
  id: string
  name: string
  slug: string
  city: string
  country: string
  countryCode: string
  status: string
  description: string | null
  foundedYear: number | null
  address: string | null
  postalCode: string | null
  lat: number | null
  lng: number | null
  website: string | null
  shopUrl: string | null
  instagram: string | null
  facebook: string | null
  phone: string | null
  email: string | null
  certifications: string[]
  origins: string[]
  roastStyles: string[]
  brewingMethods: string[]
  openingHours: Prisma.JsonValue | null
  wholesaleAvailable: boolean | null
  subscriptionAvailable: boolean | null
  hasCafe: boolean | null
  hasTastingRoom: boolean | null
  coverImageUrl: string | null
  sourceUrl: string | null
  featured: boolean
  featuredUntil: string | null
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
  INACTIVE: "bg-surface-container-low text-on-surface",
}

type Section =
  | "identity"
  | "location"
  | "contact"
  | "coffee"
  | "hours"
  | "offer"
  | "images"
  | "admin"

export function AdminRoasterDetailClient({ roaster }: { roaster: Roaster }) {
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
    { id: "coffee", label: t("coffee") },
    { id: "hours", label: t("hours") },
    { id: "offer", label: t("offer") },
    { id: "images", label: t("images") },
    { id: "admin", label: t("admin") },
  ]

  const handleVerify = () => {
    setError(null)
    startTransition(async () => {
      const result = await verifyRoaster(roaster.id)
      if (!result.success) setError(result.error ?? t("errorDescription"))
    })
  }

  const handleReject = () => {
    if (!rejectReason.trim()) return
    setError(null)
    startTransition(async () => {
      const result = await rejectRoaster(roaster.id, rejectReason)
      if (!result.success) setError(result.error ?? t("errorDescription"))
      else setShowRejectModal(false)
    })
  }

  return (
    <>
      {/* Sticky Toolbar */}
      <div className="sticky top-0 z-10 -mx-6 mb-8 flex flex-wrap items-center gap-3 border-b border-white/10 bg-black/80 px-6 py-3 backdrop-blur">
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-100 truncate">{roaster.name}</h1>
          <p className="text-xs text-on-surface-variant">
            {roaster.city}, {roaster.country}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_COLORS[roaster.status] ?? ""}`}
          >
            {roaster.status}
          </span>
          {roaster.status === "PENDING" && (
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
              roasterId={roaster.id}
              initial={{
                name: roaster.name,
                city: roaster.city,
                country: roaster.country,
                countryCode: roaster.countryCode,
                description: roaster.description,
                foundedYear: roaster.foundedYear,
              }}
            />
          )}
          {activeSection === "location" && (
            <LocationSection
              roasterId={roaster.id}
              initial={{
                address: roaster.address,
                postalCode: roaster.postalCode,
                lat: roaster.lat,
                lng: roaster.lng,
                sourceUrl: roaster.sourceUrl,
              }}
            />
          )}
          {activeSection === "contact" && (
            <ContactSection
              roasterId={roaster.id}
              initial={{
                website: roaster.website,
                shopUrl: roaster.shopUrl,
                instagram: roaster.instagram,
                facebook: roaster.facebook,
                phone: roaster.phone,
                email: roaster.email,
              }}
            />
          )}
          {activeSection === "coffee" && (
            <CoffeeSection
              roasterId={roaster.id}
              initial={{
                certifications: roaster.certifications,
                origins: roaster.origins,
                roastStyles: roaster.roastStyles,
                brewingMethods: roaster.brewingMethods,
              }}
            />
          )}
          {activeSection === "hours" && (
            <HoursSection roasterId={roaster.id} initialHours={roaster.openingHours} />
          )}
          {activeSection === "offer" && (
            <OfferSection
              roasterId={roaster.id}
              initial={{
                wholesaleAvailable: roaster.wholesaleAvailable,
                subscriptionAvailable: roaster.subscriptionAvailable,
                hasCafe: roaster.hasCafe,
                hasTastingRoom: roaster.hasTastingRoom,
              }}
            />
          )}
          {activeSection === "images" && (
            <ImagesSection
              roasterId={roaster.id}
              initial={{
                coverImageUrl: roaster.coverImageUrl,
              }}
            />
          )}
          {activeSection === "admin" && (
            <AdminSection
              roasterId={roaster.id}
              initial={{
                featured: roaster.featured,
                featuredUntil: roaster.featuredUntil,
                ownerId: roaster.ownerId,
                status: roaster.status,
              }}
            />
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface-container-lowest p-6 shadow-2xl ring-1 ring-[var(--color-outline-variant)]">
            <h3 className="mb-1 text-lg font-bold text-[var(--color-on-surface)]">{t("rejectRoastery")}</h3>
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
                {isPending ? t("rejecting") : t("rejectRoastery")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
