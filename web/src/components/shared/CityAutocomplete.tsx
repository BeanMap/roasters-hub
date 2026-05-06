"use client";

import { useState, useRef, useCallback } from "react";

interface CityAutocompleteProps {
  value: string;
  onChange: (city: string) => void;
  country?: string;
  placeholder?: string;
}

export function CityAutocomplete({
  value,
  onChange,
  country,
  placeholder = "Start typing a city...",
}: CityAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const search = useCallback(
    (q: string) => {
      clearTimeout(debounceRef.current);
      if (q.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const parts = [q];
          if (country) parts.push(country);
          const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(parts.join(", "))}&format=json&limit=5&featuretype=city`;
          const resp = await fetch(url, {
            headers: { "User-Agent": "BeenMap/1.0" },
          });
          if (resp.ok) {
            const data = await resp.json() as { display_name: string }[];
            const names = data
              .map((d) => d.display_name.split(",")[0]?.trim())
              .filter((n, i, a) => n && a.indexOf(n) === i);
            setSuggestions(names);
            setIsOpen(names.length > 0);
          }
        } catch {
          setSuggestions([]);
        }
        setLoading(false);
      }, 300);
    },
    [country],
  );

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          search(e.target.value);
        }}
        onFocus={() => {
          if (suggestions.length) setIsOpen(true);
        }}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        onKeyDown={(e) => {
          if (!isOpen) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) =>
              i < suggestions.length - 1 ? i + 1 : 0,
            );
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) =>
              i > 0 ? i - 1 : suggestions.length - 1,
            );
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (activeIndex >= 0 && suggestions[activeIndex]) {
              const city = suggestions[activeIndex];
              setQuery(city);
              onChange(city);
              setIsOpen(false);
            }
          } else if (e.key === "Escape") {
            setIsOpen(false);
          }
        }}
        placeholder={placeholder}
        className="w-full border border-outline/30 rounded-lg px-3 py-2 bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        autoComplete="off"
      />
      {loading && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-lg">
          Searching...
        </div>
      )}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <li
              key={s}
              onMouseDown={() => {
                setQuery(s);
                onChange(s);
                setIsOpen(false);
              }}
              className={`cursor-pointer px-3 py-2 text-sm hover:bg-amber-50 ${
                i === activeIndex ? "bg-amber-50" : ""
              }`}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
