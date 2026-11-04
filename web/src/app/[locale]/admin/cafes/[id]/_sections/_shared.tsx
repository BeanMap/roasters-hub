import React from "react"

export const adminInput =
  "w-full rounded-lg border border-[var(--color-outline-variant)] bg-surface-container-lowest px-3 py-2 text-sm text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] disabled:opacity-40"

export const adminSelect =
  "w-full rounded-lg border border-[var(--color-outline-variant)] bg-surface-container-lowest px-3 py-2 text-sm text-[var(--color-on-surface)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)] disabled:opacity-40"

export function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="border-b border-[var(--color-outline-variant)] pb-3 mb-5">
      <h2 className="text-base font-semibold text-[var(--color-on-surface)]">{title}</h2>
      {hint && <p className="text-xs text-[var(--color-on-surface-variant)] mt-0.5">{hint}</p>}
    </div>
  )
}

export function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[var(--color-on-surface-variant)]">
        {label}
        {required && <span className="ml-0.5 text-[var(--color-primary)]">*</span>}
      </label>
      {children}
    </div>
  )
}

export function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-[var(--color-outline)]">{children}</p>
}

export function SaveButton({
  saving,
  saved,
  onClick,
}: {
  saving: boolean
  saved: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={saving}
      className="self-start rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--color-on-primary)] transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {saving ? "Saving…" : saved ? "✓ Saved" : "Save section"}
    </button>
  )
}
