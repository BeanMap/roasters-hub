"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "beanmap_beta_banner_dismissed";

type Props = {
  message: string;
  dismissLabel: string;
};

export function BetaBanner({ message, dismissLabel }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(!localStorage.getItem(STORAGE_KEY));
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="w-full bg-[#1f1611] text-[#f5efe6]/80 border-b border-[#f5efe6]/10 text-xs py-2 px-4 flex items-center justify-center gap-3">
      <span>⚗️ {message}</span>
      <button
        onClick={dismiss}
        aria-label={dismissLabel}
        className="ml-2 text-[#f2a77d] hover:text-white transition-colors shrink-0"
      >
        ✕
      </button>
    </div>
  );
}
