"use client"

import { useState, KeyboardEvent } from "react"
import { adminUpdateCafe } from "@/actions/cafe.actions"
import { CAFE_SERVICES } from "@/constants/cafe-services"
import { adminInput, SectionHeader, Field, Hint, SaveButton } from "./_shared"

interface Props {
  cafeId: string
  initial: {
    serving: string[]
    services: string[]
  }
}

// Group CAFE_SERVICES by group label
const SERVICE_GROUPS = Array.from(
  CAFE_SERVICES.reduce((map, svc) => {
    if (!map.has(svc.group)) map.set(svc.group, [])
    map.get(svc.group)!.push(svc)
    return map
  }, new Map<string, (typeof CAFE_SERVICES)[number][]>()),
)

export function ServicesSection({ cafeId, initial }: Props) {
  const [serving, setServing] = useState<string[]>(initial.serving)
  const [servingInput, setServingInput] = useState("")
  const [services, setServices] = useState<string[]>(initial.services)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function addServing() {
    const val = servingInput.trim()
    if (!val || serving.includes(val)) return
    setServing((prev) => [...prev, val])
    setServingInput("")
  }

  function removeServing(tag: string) {
    setServing((prev) => prev.filter((s) => s !== tag))
  }

  function onServingKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      addServing()
    }
  }

  function toggleService(value: string) {
    setServices((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    )
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const result = await adminUpdateCafe(cafeId, { serving, services })
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
      <SectionHeader
        title="Services & offer"
        hint="What coffee the cafe serves and what amenities it offers"
      />

      <Field label="Served coffees (tags)">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {serving.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] px-2.5 py-1 text-xs text-[var(--color-on-surface)]"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeServing(tag)}
                className="text-[var(--color-outline)] hover:text-[var(--color-on-surface)] leading-none"
                aria-label={`Remove ${tag}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={servingInput}
            onChange={(e) => setServingInput(e.target.value)}
            onKeyDown={onServingKeyDown}
            placeholder="Type and press Enter…"
            className={adminInput}
          />
          <button
            type="button"
            onClick={addServing}
            className="shrink-0 rounded-lg border border-[var(--color-outline-variant)] bg-surface-container-lowest px-3 py-2 text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] transition-colors"
          >
            Add
          </button>
        </div>
        <Hint>e.g. espresso, filter, pour-over — press Enter after each tag</Hint>
      </Field>

      <Field label="Services & amenities">
        <div className="flex flex-col gap-4">
          {SERVICE_GROUPS.map(([group, items]) => (
            <div key={group}>
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-outline)]">
                {group}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {items.map((svc) => (
                  <label
                    key={svc.value}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)]"
                  >
                    <input
                      type="checkbox"
                      checked={services.includes(svc.value)}
                      onChange={() => toggleService(svc.value)}
                      className="accent-[var(--color-primary)] h-4 w-4"
                    />
                    {svc.label}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Field>

      <SaveButton saving={saving} saved={saved} onClick={handleSave} />
      {saveError && (
        <p className="text-sm text-red-600">{saveError}</p>
      )}
    </div>
  )
}
