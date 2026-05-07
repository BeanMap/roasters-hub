"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { searchCity } from "@/lib/geocoding";

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
  const abortRef = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const search = useCallback(
    (q: string) => {
      clearTimeout(debounceRef.current);
      abortRef.current?.abort();

      if (q.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      debounceRef.current = setTimeout(async () => {
        const controller = new AbortController();
        abortRef.current = controller;
        setLoading(true);
        try {
          const names = await searchCity(q, country, controller.signal);
          setSuggestions(names);
          setIsOpen(names.length > 0);
        } catch {
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
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
          const v = e.target.value;
          setQuery(v);
          onChange(v);
          search(v);
        }}
        onFocus={() => {
          if (suggestions.length) setIsOpen(true);
        }}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        onKeyDown={(e) => {
          if (!isOpen) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
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
