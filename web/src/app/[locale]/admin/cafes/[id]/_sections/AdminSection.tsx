"use client"

import { useState } from "react"
import { adminUpdateCafe } from "@/actions/cafe.actions"
import { adminInput, SectionHeader, Field, Hint, SaveButton } from "./_shared"

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  VERIFIED: "bg-green-100 text-green-900",
  REJECTED: "bg-red-100 text-red-900",
}

interface Props {
  cafeId: string
  initial: {
    featured: boolean
    ownerId: string | null
    status: string
  }
}

export function AdminSection({ cafeId, initial }: Props) {
  const [form, setForm] = useState({
    featured: initial.featured,
    ownerId: initial.ownerId ?? "",
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const result = await adminUpdateCafe(cafeId, {
      featured: form.featured,
      ownerId: form.ownerId || null,
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
      <SectionHeader title="Admin" hint="Administrative settings and ownership" />

      <Field label="Status (read-only — change via toolbar buttons)">
        <div>
          <span
            className={`inline-block rounded-full px-3 py-1 text-sm font-bold ${STATUS_COLORS[initial.status] ?? "bg-surface-container-low text-on-surface"}`}
          >
            {initial.status}
          </span>
        </div>
      </Field>

      <Field label="Featured">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-[var(--color-on-surface)]">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
            className="accent-[var(--color-primary)] h-4 w-4"
          />
          Show as featured in listings
        </label>
      </Field>

      <Field label="Owner ID (ownerId)">
        <input
          value={form.ownerId}
          onChange={(e) => setForm((f) => ({ ...f, ownerId: e.target.value }))}
          placeholder="Clerk user ID"
          className={adminInput}
        />
        <Hint>Empty = community proposal with no owner. Paste the Clerk user ID here.</Hint>
      </Field>

      <SaveButton saving={saving} saved={saved} onClick={handleSave} />
      {saveError && (
        <p className="text-sm text-red-600">{saveError}</p>
      )}
    </div>
  )
}
