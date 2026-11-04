"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const STORAGE_KEY = "beanmap_cookie_banner_dismissed";

export function CookieBanner() {
  const t = useTranslations("cookies");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only if not previously dismissed
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(!localStorage.getItem(STORAGE_KEY));
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      className="fixed bottom-0 left-0 right-0 z-[100] bg-surface-container-high/95 backdrop-blur-sm border-t border-outline/10 text-sm py-3 px-4 md:px-6 shadow-lg"
    >
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="text-on-surface-variant leading-relaxed flex-1">
          {t("message")}{" "}
          <Link
            href="/cookies"
            className="text-primary hover:underline font-medium whitespace-nowrap"
          >
            {t("learnMore")}
          </Link>
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          {t("accept")}
        </button>
      </div>
    </div>
  );
}
