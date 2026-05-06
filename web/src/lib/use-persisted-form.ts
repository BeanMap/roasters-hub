"use client";

import { useState, useEffect, useCallback } from "react";

export function usePersistedForm<T extends Record<string, unknown>>(
  key: string,
  defaults: T,
): [T, (field: string, value: unknown) => void, () => void] {
  const [form, setForm] = useState<T>(() => {
    if (typeof window === "undefined") return defaults;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed };
      }
    } catch {
      // corrupted data, use defaults
    }
    return defaults;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(form));
    } catch {
      // storage full or unavailable
    }
  }, [key, form]);

  const update = useCallback((field: string, value: unknown) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
    setForm(defaults);
  }, [key, defaults]);

  return [form, update, clear];
}
