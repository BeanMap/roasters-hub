"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toggleMarketingConsent } from "@/actions/consent.actions";

interface MarketingConsentToggleProps {
  initial: boolean;
}

export function MarketingConsentToggle({
  initial,
}: MarketingConsentToggleProps) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const handleToggle = async () => {
    const next = !value;
    setValue(next);
    setSaving(true);
    const result = await toggleMarketingConsent(next);
    if (!result.success) {
      setValue(!next); // revert
    }
    setSaving(false);
    router.refresh();
  };

  return (
    <section className="bg-surface-container-lowest editorial-shadow rounded-2xl p-8 border border-outline-variant/10 mb-8">
      <h2 className="font-headline text-2xl tracking-tight mb-2">
        Notifications
      </h2>
      <p className="text-sm text-on-surface-variant/60 mb-4">
        Control how we contact you about Bean Map updates and new features.
      </p>
      <label className="flex items-center gap-3 cursor-pointer">
        <button
          role="switch"
          aria-checked={value}
          onClick={handleToggle}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            value ? "bg-amber-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              value ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className="text-sm">Marketing emails</span>
      </label>
    </section>
  );
}
