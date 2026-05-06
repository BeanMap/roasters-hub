"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { searchAddress } from "@/lib/geocoding";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onCoordsChange?: (lat: number, lng: number) => void;
  placeholder?: string;
  city?: string;
  country?: string;
}

interface Suggestion {
  displayName: string;
  lat: number;
  lng: number;
}

export function AddressAutocomplete({
  value,
  onChange,
  onCoordsChange,
  placeholder = "Start typing an address...",
  city,
  country,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useCallback(
    (q: string) => {
      clearTimeout(debounceRef.current);
      if (q.length < 3) {
        setSuggestions([]);
        setIsOpen(false);
        setError("");
        return;
      }

      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        setError("");
        try {
          const results = await searchAddress(q, city, country);
          setSuggestions(results);
          setIsOpen(results.length > 0);
          setActiveIndex(-1);
          if (!results.length) {
            setError("No results found");
          }
        } catch {
          setError("Search failed. Try again.");
          setSuggestions([]);
        }
        setLoading(false);
      }, 300);
    },
    [city, country],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onChange(v);
    debouncedSearch(v);
  };

  const selectSuggestion = (suggestion: Suggestion) => {
    onChange(suggestion.displayName);
    setIsOpen(false);
    setSuggestions([]);
    onCoordsChange?.(suggestion.lat, suggestion.lng);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          selectSuggestion(suggestions[activeIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length) setIsOpen(true);
        }}
        onBlur={() => {
          setTimeout(() => setIsOpen(false), 200);
        }}
        placeholder={placeholder}
        className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20"
        autoComplete="off"
      />
      {loading && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-lg">
          Searching...
        </div>
      )}
      {error && !loading && !suggestions.length && value.length >= 3 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-lg">
          Could not find address. Enter coordinates manually.
        </div>
      )}
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <li
              key={`${s.lat}-${s.lng}-${i}`}
              onMouseDown={() => selectSuggestion(s)}
              className={`cursor-pointer px-4 py-2.5 text-sm hover:bg-amber-50 ${
                i === activeIndex ? "bg-amber-50" : ""
              }`}
            >
              {s.displayName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
