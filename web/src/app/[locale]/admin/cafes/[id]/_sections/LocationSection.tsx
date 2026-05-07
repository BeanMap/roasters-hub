"use client"

import { useState } from "react"
import { adminUpdateCafe } from "@/actions/cafe.actions"
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete"
import dynamic from "next/dynamic"
const MiniMap = dynamic(() => import("@/components/shared/MiniMap").then((m) => m.MiniMap), { ssr: false })
import { adminInput, SectionHeader, Field, Hint, SaveButton } from "./_shared"

interface Props {
  cafeId: string
  initial: {
    address: string | null
    postalCode: string | null
    lat: number | null
    lng: number | null
    sourceUrl: string | null
  }
}

export function LocationSection({ cafeId, initial }: Props) {
  const [form, setForm] = useState({
    address: initial.address ?? "",
    postalCode: initial.postalCode ?? "",
    lat: initial.lat?.toString() ?? "",
    lng: initial.lng?.toString() ?? "",
    sourceUrl: initial.sourceUrl ?? "",
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const result = await adminUpdateCafe(cafeId, {
      address: form.address || null,
      postalCode: form.postalCode || null,
      lat: form.lat ? parseFloat(form.lat) || null : null,
      lng: form.lng ? parseFloat(form.lng) || null : null,
      sourceUrl: form.sourceUrl || null,
    })
    setSaving(false)
    if (result.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } else {
      setSaveError(result.error ?? "Save failed")
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <SectionHeader title="Location" hint="Street address and geographic coordinates" />

      <Field label="Address">
        <AddressAutocomplete
          value={form.address}
          onChange={(address) => setForm((f) => ({ ...f, address }))}
          onCoordsChange={(lat, lng) =>
            setForm((f) => ({ ...f, lat: String(lat), lng: String(lng) }))
          }
          placeholder="Start typing an address..."
        />
      </Field>

      {form.lat && form.lng && (
        <MiniMap lat={parseFloat(form.lat)} lng={parseFloat(form.lng)} />
      )}

      <Field label="Postal code">
        <input
          value={form.postalCode}
          placeholder="e.g. 45-001"
          onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
          className={adminInput}
        />
      </Field>

      <Field label="Source URL">
        <input
          value={form.sourceUrl}
          placeholder="e.g. https://maps.google.com/…"
          onChange={(e) => setForm((f) => ({ ...f, sourceUrl: e.target.value }))}
          className={adminInput}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Latitude">
          <input
            type="number"
            step="any"
            placeholder="e.g. 50.6751"
            value={form.lat}
            onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
            className={adminInput}
          />
        </Field>

        <Field label="Longitude">
          <input
            type="number"
            step="any"
            placeholder="e.g. 17.9213"
            value={form.lng}
            onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
            className={adminInput}
          />
        </Field>
      </div>
      <Hint>
        Use the address search above to auto-fill coordinates, or enter them manually.
      </Hint>

      <SaveButton saving={saving} saved={saved} onClick={handleSave} />
      {saveError && (
        <p className="text-sm text-red-600">{saveError}</p>
      )}
    </div>
  )
}
