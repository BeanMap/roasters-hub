"use client"

import { useState, KeyboardEvent } from "react"
import { adminUpdateRoaster } from "@/actions/admin.actions"
import { CERTIFICATIONS, CERTIFICATION_LABELS, ORIGINS, ROAST_STYLES } from "@/types/certifications"
import { adminInput, SectionHeader, Field, Hint, SaveButton } from "./_shared"

interface Props {
  roasterId: string
  initial: {
    certifications: string[]
    origins: string[]
    roastStyles: string[]
    brewingMethods: string[]
  }
}

export function CoffeeSection({ roasterId, initial }: Props) {
  const [certifications, setCertifications] = useState<string[]>(initial.certifications)
  const [origins, setOrigins] = useState<string[]>(initial.origins)
  const [roastStyles, setRoastStyles] = useState<string[]>(initial.roastStyles)
  const [brewingMethods, setBrewingMethods] = useState<string[]>(initial.brewingMethods)
  const [brewingInput, setBrewingInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function toggleCert(value: string) {
    setCertifications((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value],
    )
  }

  function toggleOrigin(value: string) {
    setOrigins((prev) =>
      prev.includes(value) ? prev.filter((o) => o !== value) : [...prev, value],
    )
  }

  function toggleRoastStyle(value: string) {
    setRoastStyles((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value],
    )
  }

  function addBrewingMethod() {
    const val = brewingInput.trim()
    if (!val || brewingMethods.includes(val)) return
    setBrewingMethods((prev) => [...prev, val])
    setBrewingInput("")
  }

  function removeBrewingMethod(tag: string) {
    setBrewingMethods((prev) => prev.filter((m) => m !== tag))
  }

  function onBrewingKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      addBrewingMethod()
    }
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    const result = await adminUpdateRoaster(roasterId, {
      certifications,
      origins,
      roastStyles,
      brewingMethods,
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
      <SectionHeader title="Coffee & profiles" hint="Certifications, origins, roast styles, and brewing methods" />

      <Field label="Certifications">
        <div className="grid grid-cols-2 gap-1.5">
          {CERTIFICATIONS.map((cert) => (
            <label
              key={cert}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)]"
            >
              <input
                type="checkbox"
                checked={certifications.includes(cert)}
                onChange={() => toggleCert(cert)}
                className="accent-[var(--color-primary)] h-4 w-4"
              />
              {CERTIFICATION_LABELS[cert]}
            </label>
          ))}
        </div>
      </Field>

      <Field label="Origins (coffee-producing countries)">
        <div className="flex flex-wrap gap-1.5">
          {ORIGINS.map((origin) => (
            <button
              key={origin}
              type="button"
              onClick={() => toggleOrigin(origin)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                origins.includes(origin)
                  ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                  : "bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)]"
              }`}
            >
              {origin}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Roast styles">
        <div className="flex flex-wrap gap-1.5">
          {ROAST_STYLES.map((style) => (
            <button
              key={style}
              type="button"
              onClick={() => toggleRoastStyle(style)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                roastStyles.includes(style)
                  ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                  : "bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-high)]"
              }`}
            >
              {style}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Brewing methods (tags)">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {brewingMethods.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] px-2.5 py-1 text-xs text-[var(--color-on-surface)]"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeBrewingMethod(tag)}
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
            value={brewingInput}
            onChange={(e) => setBrewingInput(e.target.value)}
            onKeyDown={onBrewingKeyDown}
            placeholder="Type and press Enter…"
            className={adminInput}
          />
          <button
            type="button"
            onClick={addBrewingMethod}
            className="shrink-0 rounded-lg border border-[var(--color-outline-variant)] bg-surface-container-lowest px-3 py-2 text-sm text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] transition-colors"
          >
            Add
          </button>
        </div>
        <Hint>e.g. espresso, V60, AeroPress — press Enter after each method</Hint>
      </Field>

      <SaveButton saving={saving} saved={saved} onClick={handleSave} />
      {saveError && (
        <p className="text-sm text-red-600">{saveError}</p>
      )}
    </div>
  )
}
