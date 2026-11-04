"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { subscribeNewsletter } from "@/actions/newsletter.actions";

export function NewsletterForm() {
  const t = useTranslations("newsletter");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [consent, setConsent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!consent) {
      setStatus("error");
      setErrorMsg(t("consentRequired"));
      return;
    }
    setStatus("loading");
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    const result = await subscribeNewsletter(formData);

    if (result.success) {
      setStatus("success");
    } else {
      setStatus("error");
      setErrorMsg(result.error);
    }
  }

  if (status === "success") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-4 text-green-800 text-sm">
        {t("success")}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-2">
        <label htmlFor="newsletter-email" className="sr-only">{t("emailLabel")}</label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          className="input-field flex-grow"
          placeholder={t("emailPlaceholder")}
        />
        <button
          type="submit"
          disabled={status === "loading" || !consent}
          className="bg-primary text-on-primary px-8 py-4 rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50"
        >
          {status === "loading" ? t("submitting") : t("subscribe")}
        </button>
      </div>
      <div className="flex justify-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            defaultChecked
            className="text-primary focus:ring-primary"
            name="segment"
            type="radio"
            value="CONSUMER"
          />
          <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
            {t("segmentConsumer")}
          </span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            className="text-primary focus:ring-primary"
            name="segment"
            type="radio"
            value="CAFE"
          />
          <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
            {t("segmentCafe")}
          </span>
        </label>
      </div>

      <label className="flex items-start gap-3 cursor-pointer group max-w-xl mx-auto">
        <input
          type="checkbox"
          required
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
        />
        <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors leading-relaxed">
          {t.rich("consent", {
            privacyLink: (chunks) => (
              <Link href="/privacy" className="text-primary hover:underline" target="_blank">{chunks}</Link>
            ),
          })}
        </span>
      </label>

      {status === "error" && (
        <p className="text-red-600 text-sm text-center">{errorMsg}</p>
      )}
    </form>
  );
}
