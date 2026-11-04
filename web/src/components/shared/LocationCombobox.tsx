"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { foldText, type LocationOption } from "@/lib/catalog";

type Props = {
  options: LocationOption[];
  country: string;
  city: string;
  onSelect: (selection: { country: string | null; city: string | null }) => void;
  inputClassName: string;
};

const MAX_RESULTS = 8;

/**
 * One type-ahead field for "country or city" instead of two long selects.
 * Accent-insensitive ("poznan" → Poznań), keyboard accessible (ARIA combobox).
 */
export function LocationCombobox({ options, country, city, onSelect, inputClassName }: Props) {
  const t = useTranslations("filters");
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [cursor, setCursor] = useState(0);

  const selected = useMemo(() => {
    if (city) {
      const key = foldText(city);
      return options.find((o) => o.kind === "city" && foldText(o.value) === key) ?? {
        kind: "city" as const, value: city, countryCode: country, label: city, count: 0,
      };
    }
    if (country) return options.find((o) => o.kind === "country" && o.value === country.toUpperCase());
    return undefined;
  }, [options, country, city]);

  const results = useMemo(() => {
    const q = foldText(text);
    const pool = q
      ? options.filter((o) => foldText(o.label).includes(q) || (o.hint && foldText(o.hint).startsWith(q)))
      : options;
    // Countries first when nothing is typed: a short, scannable starting point.
    const sorted = q ? pool : [...pool].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "country" ? -1 : 1));
    return sorted.slice(0, MAX_RESULTS);
  }, [options, text]);

  const choose = (o: LocationOption) => {
    onSelect(o.kind === "country" ? { country: o.value, city: null } : { country: o.countryCode, city: o.value });
    setText("");
    setOpen(false);
    inputRef.current?.blur();
  };

  if (selected && !open) {
    return (
      <div className={`${inputClassName} flex items-center justify-between gap-2`}>
        <button type="button" className="min-w-0 flex-1 text-left truncate" onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 0); }}>
          <span className="font-medium text-on-surface">{selected.label}</span>
          {selected.kind === "city" && selected.hint && <span className="text-on-surface-variant"> · {selected.hint}</span>}
        </button>
        <button
          type="button"
          onClick={() => onSelect({ country: null, city: null })}
          className="shrink-0 inline-flex w-6 h-6 items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant"
          aria-label={`${t("removeFilter")}: ${selected.label}`}
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={t("location")}
        aria-activedescendant={open && results[cursor] ? `${listId}-${cursor}` : undefined}
        placeholder={t("locationPlaceholder")}
        className={inputClassName}
        value={text}
        autoComplete="off"
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onChange={(e) => { setText(e.target.value); setCursor(0); setOpen(true); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
          else if (e.key === "Enter" && results[cursor]) { e.preventDefault(); choose(results[cursor]); }
          else if (e.key === "Escape") { setOpen(false); }
        }}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 w-full max-h-80 overflow-auto rounded-2xl border border-outline-variant bg-surface-container-lowest p-1.5 shadow-[var(--shadow-dropdown)]"
        >
          {results.length === 0 ? (
            <li className="px-3 py-2.5 text-sm text-on-surface-variant">{t("noLocation")}</li>
          ) : (
            results.map((o, i) => (
              <li
                key={`${o.kind}-${o.countryCode}-${o.value}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === cursor}
                onMouseDown={(e) => { e.preventDefault(); choose(o); }}
                onMouseEnter={() => setCursor(i)}
                className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm cursor-pointer ${i === cursor ? "bg-surface-container" : ""}`}
              >
                <span className="min-w-0 truncate">
                  <span className="font-medium text-on-surface">{o.label}</span>
                  {o.kind === "city" && o.hint && <span className="text-on-surface-variant"> · {o.hint}</span>}
                </span>
                <span className="label-mono text-outline shrink-0">
                  {o.kind === "country" ? t("countryKind") : t("cityKind")} · {o.count}
                </span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
