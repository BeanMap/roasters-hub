"use client";

import { useState, useRef } from "react";
import { searchCountries, getCountryName, type Country } from "@/lib/countries";

interface CountryAutocompleteProps {
  value: string;
  onChange: (countryName: string, countryCode: string) => void;
  locale: string;
  placeholder?: string;
}

export function CountryAutocomplete({
  value,
  onChange,
  locale,
  placeholder = "Select country...",
}: CountryAutocompleteProps) {
  const [query, setQuery] = useState(() => value || "");
  const [suggestions, setSuggestions] = useState<Country[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInput = (q: string) => {
    setQuery(q);
    const results = searchCountries(q, locale);
    setSuggestions(results);
    setIsOpen(results.length > 0);
    setActiveIndex(-1);
  };

  const select = (c: Country) => {
    const name =
      locale === "pl" ? c.pl : locale === "de" ? c.de : c.en;
    setQuery(name);
    onChange(name, c.code);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
        select(suggestions[activeIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => {
          if (!suggestions.length) handleInput(query);
          else setIsOpen(true);
        }}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full border border-outline/30 rounded-lg px-3 py-2 bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        autoComplete="off"
      />
      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {suggestions.map((c, i) => (
            <li
              key={c.code}
              onMouseDown={() => select(c)}
              className={`cursor-pointer px-3 py-2 text-sm hover:bg-amber-50 ${
                i === activeIndex ? "bg-amber-50" : ""
              }`}
            >
              <span className="font-medium">
                {locale === "pl" ? c.pl : locale === "de" ? c.de : c.en}
              </span>
              <span className="text-gray-400 text-xs ml-2">{c.code}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
