"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <p className="font-headline text-7xl text-surface-container-highest mb-4">{t("errorCode")}</p>
        <h1 className="font-headline text-3xl text-on-surface mb-3">{t("errorTitle")}</h1>
        <p className="text-on-surface-variant mb-8 max-w-sm">{t("errorDescription")}</p>
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={reset}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:bg-accent-hover transition-colors"
          >
            {t("tryAgain")}
          </button>
          <Link
            href="/"
            className="rounded-lg border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
          >
            {t("goHome")}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
