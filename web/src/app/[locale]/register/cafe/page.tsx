"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useAuth, SignInButton, SignedIn } from "@clerk/nextjs";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { createCafe } from "@/actions/cafe.actions";
import { getDefaultCountryFromLocale } from "@/lib/default-country";
import { detectCountry } from "@/actions/geo.actions";
import { usePersistedForm } from "@/lib/use-persisted-form";
import { OpeningHoursPicker } from "@/components/shared/OpeningHoursPicker";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import { CountryAutocomplete } from "@/components/shared/CountryAutocomplete";
import { CityAutocomplete } from "@/components/shared/CityAutocomplete";
import dynamic from "next/dynamic";
const MiniMap = dynamic(() => import("@/components/shared/MiniMap").then((m) => m.MiniMap), { ssr: false });
import { CAFE_SERVICES } from "@/constants/cafe-services";
import { EMPTY_OPENING_HOURS, type OpeningHours } from "@/types/opening-hours";

const SERVICE_GROUPS = Array.from(new Set(CAFE_SERVICES.map((s) => s.group)));

export default function RegisterCafePage() {
  const t = useTranslations("register");
  const locale = useLocale();
  const { isSignedIn } = useAuth();
  const defaultCountry = getDefaultCountryFromLocale(locale);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, updateForm, clearForm] = usePersistedForm("register-cafe-form", {
    name: "",
    city: "",
    country: defaultCountry?.name ?? "",
    countryCode: defaultCountry?.code ?? "",
    description: "",
    address: "",
    streetNumber: "",
    lat: "",
    lng: "",
    website: "",
    instagram: "",
    phone: "",
    email: "",
    acceptTerms: false,
    acceptPrivacy: false,
    acceptMarketing: false,
  });
  const [isOwner, setIsOwner] = useState(false);
  const [hours, setHours] = useState<OpeningHours>(EMPTY_OPENING_HOURS);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  useEffect(() => {
    if (defaultCountry) return;
    detectCountry().then((detected) => {
      if (detected && !form.country) {
        updateForm("country", detected.name);
      }
    });
  }, [defaultCountry]);

  const steps = t.raw("stepsCafe") as string[];

  const update = (field: string, value: string) =>
    updateForm(field, value);

  const handleCountryChange = (name: string, code: string) => {
    updateForm("country", name);
    updateForm("countryCode", code);
  };

  const toggleService = (value: string) => {
    setSelectedServices((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  const handleSubmit = async () => {
    if (!form.acceptTerms || !form.acceptPrivacy) {
      setError(t("consentRequired"));
      return;
    }
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.set("name", form.name);
    fd.set("city", form.city);
    fd.set("country", form.country);
    fd.set("description", form.description);
    const fullAddress = [form.address, form.streetNumber].filter(Boolean).join(" ");
    fd.set("address", fullAddress);
    fd.set("lat", form.lat);
    fd.set("lng", form.lng);
    fd.set("website", form.website);
    fd.set("instagram", form.instagram);
    fd.set("phone", form.phone);
    fd.set("email", form.email);
    fd.set("openingHours", JSON.stringify(hours));
    fd.set("services", selectedServices.join(","));
    fd.set("isOwner", isOwner ? "true" : "false");
    fd.set("acceptMarketing", form.acceptMarketing ? "true" : "false");
    const result = await createCafe(fd);
    if (result.success) {
      clearForm();
      setSubmitted(true);
    } else {
      setError(result.error);
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <>
        <Header />
        <main className="max-w-2xl mx-auto px-6 py-24 text-center">
          <h1 className="font-headline text-4xl mb-4">{t("successTitleCafe")}</h1>
          <p className="text-on-surface-variant/60 mb-8">
            {t("successDescCafe")}
          </p>
          <Link
            href="/"
            className="bg-primary text-on-primary px-6 py-3 rounded-lg text-sm font-medium"
          >
            {t("successBackHome")}
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="flex items-center justify-center gap-4 mb-16">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    i < step
                      ? "bg-secondary text-on-secondary"
                      : i === step
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {i < step ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </span>
                <span className={`text-sm hidden sm:block ${i === step ? "font-semibold text-on-surface" : "text-on-surface-variant"}`}>
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && <div className="w-12 h-px bg-surface-container-high" />}
            </div>
          ))}
        </div>

        <h1 className="font-headline text-4xl tracking-tight mb-8">{t("registerCafe")}</h1>

        {error && (
          <div className="bg-error-container text-on-error-container rounded-xl p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">{t("cafeName")}</label>
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full border border-outline/30 rounded-lg px-3 py-2 bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t("cafeNamePlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("country")}</label>
              <CountryAutocomplete
                value={form.country}
                onChange={handleCountryChange}
                locale={locale}
                placeholder={t("countryPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("city")}</label>
              <CityAutocomplete
                value={form.city}
                onChange={(v) => update("city", v)}
                country={form.country}
                placeholder={t("cityPlaceholder")}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">{t("address")}</label>
                <AddressAutocomplete
                  value={form.address}
                  onChange={(v) => update("address", v)}
                  onCoordsChange={(lat, lng) => {
                    update("lat", String(lat));
                    update("lng", String(lng));
                  }}
                  onStreetNumberChange={(n) => update("streetNumber", n)}
                  city={form.city}
                  country={form.country}
                  placeholder={t("addressPlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("streetNumber")}</label>
                <input
                  value={form.streetNumber}
                  onChange={(e) => update("streetNumber", e.target.value)}
                  className="w-full border border-outline/30 rounded-lg px-3 py-2 bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="42"
                />
              </div>
            </div>
            {form.lat && form.lng && (
              <MiniMap lat={parseFloat(form.lat)} lng={parseFloat(form.lng)} />
            )}
            <div>
              <label className="block text-sm font-medium mb-1">{t("description")}</label>
              <textarea
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
                maxLength={2000}
                className="w-full border border-outline/30 rounded-lg px-3 py-2 bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder={t("descriptionPlaceholderCafe")}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">{t("emailAddress")}</label>
              <input
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                type="email"
                className="w-full border border-outline/30 rounded-lg px-3 py-2 bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t("cafeEmailPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("websiteUrl")}</label>
              <input
                value={form.website}
                onChange={(e) => update("website", e.target.value)}
                className="w-full border border-outline/30 rounded-lg px-3 py-2 bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t("cafeWebsitePlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("instagramHandle")}</label>
              <input
                value={form.instagram}
                onChange={(e) => update("instagram", e.target.value)}
                className="w-full border border-outline/30 rounded-lg px-3 py-2 bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t("cafeInstagramPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t("phone")}</label>
              <input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="w-full border border-outline/30 rounded-lg px-3 py-2 bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t("phonePlaceholder")}
              />
            </div>

            <div className="pt-4 border-t border-outline/10">
              <p className="text-sm font-medium mb-3">{t("openingHours")}</p>
              <OpeningHoursPicker value={hours} onChange={setHours} />
            </div>

            <div>
              <p className="text-sm font-medium mb-3">{t("amenitiesServices")}</p>
              <div className="flex flex-col gap-4">
                {SERVICE_GROUPS.map((group) => {
                  const services = CAFE_SERVICES.filter((s) => s.group === group);
                  return (
                    <div key={group}>
                      <p className="text-xs font-semibold text-on-surface-variant mb-2">{group}</p>
                      <div className="flex flex-wrap gap-2">
                        {services.map((service) => {
                          const checked = selectedServices.includes(service.value);
                          return (
                            <button
                              key={service.value}
                              type="button"
                              onClick={() => toggleService(service.value)}
                              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                checked
                                  ? "border-primary/50 bg-primary/10 text-primary"
                                  : "border-outline/30 text-on-surface-variant hover:border-outline hover:text-on-surface"
                              }`}
                            >
                              {service.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="bg-surface-container rounded-xl p-5 space-y-2 text-sm">
              {(
                [
                  [t("reviewName"), form.name],
                  [t("reviewLocation"), `${form.city}, ${form.country}`],
                  form.address ? [t("address"), form.address] : null,
                  form.description ? [t("description"), form.description] : null,
                  form.phone ? [t("phone"), form.phone] : null,
                  form.email ? [t("emailAddress"), form.email] : null,
                  form.website ? [t("reviewWebsite"), form.website] : null,
                  form.instagram ? [t("reviewInstagram"), form.instagram] : null,
                  (form.lat || form.lng) ? [t("coordinates"), `${form.lat}, ${form.lng}`] : null,
                  selectedServices.length > 0 ? [t("amenitiesServices"), selectedServices.join(", ")] : null,
                ] as ([string, string] | null)[]
              )
                .filter((item): item is [string, string] => item !== null)
                .map(([label, value]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-on-surface-variant/60">{label}</span>
                    <span className="font-medium text-right max-w-[60%] truncate">{value}</span>
                  </div>
                ))}
            </div>
            <p className="text-xs text-on-surface-variant/50">
              {t("reviewNote")}
            </p>

            <div className="space-y-3 pt-4 border-t border-outline/10">
              <h3 className="text-sm font-semibold text-on-surface">{t("yourRoleCafe")}</h3>

              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isOwner
                    ? "border-primary bg-primary/5"
                    : "border-outline/10 hover:border-outline"
                }`}
              >
                <input
                  type="radio"
                  name="cafeRole"
                  checked={isOwner}
                  onChange={() => setIsOwner(true)}
                  className="mt-0.5 w-4 h-4 text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-medium">{t("iAmOwner")}</span>
                  <p className="text-xs text-on-surface-variant mt-0.5">{t("iAmOwnerDesc")}</p>
                  {!isSignedIn && (
                    <p className="text-xs text-primary mt-1">
                      <SignInButton mode="modal">
                        <button type="button" className="underline hover:opacity-80">
                          {t("signInToClaim")}
                        </button>
                      </SignInButton>
                    </p>
                  )}
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  !isOwner
                    ? "border-primary bg-primary/5"
                    : "border-outline/10 hover:border-outline"
                }`}
              >
                <input
                  type="radio"
                  name="cafeRole"
                  checked={!isOwner}
                  onChange={() => setIsOwner(false)}
                  className="mt-0.5 w-4 h-4 text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-medium">{t("iAmSuggesting")}</span>
                  <p className="text-xs text-on-surface-variant mt-0.5">{t("iAmSuggestingDesc")}</p>
                </div>
              </label>
            </div>

            <div className="space-y-3 pt-4 border-t border-outline/10">
              <h3 className="text-sm font-semibold text-on-surface">{t("consentsTitle")}</h3>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  required
                  checked={form.acceptTerms}
                  onChange={(e) => updateForm("acceptTerms", e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors leading-relaxed">
                  {t.rich("acceptTerms", {
                    termsLink: (chunks) => (
                      <Link href="/terms" className="text-primary hover:underline" target="_blank">{chunks}</Link>
                    ),
                  })}
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  required
                  checked={form.acceptPrivacy}
                  onChange={(e) => updateForm("acceptPrivacy", e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors leading-relaxed">
                  {t.rich("acceptPrivacy", {
                    privacyLink: (chunks) => (
                      <Link href="/privacy" className="text-primary hover:underline" target="_blank">{chunks}</Link>
                    ),
                  })}
                </span>
              </label>

              <SignedIn>
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={form.acceptMarketing}
                  onChange={(e) => updateForm("acceptMarketing", e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors leading-relaxed">
                  {t("acceptMarketing")}
                </span>
              </label>
              </SignedIn>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-10">
          {step > 0 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="text-sm text-on-surface-variant/60 hover:text-on-surface transition-colors"
            >
              {t("back")}
            </button>
          ) : (
            <div />
          )}
          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={
                (step === 0 && (!form.name || !form.city || !form.country)) ||
                (step === 1 && !form.address)
              }
              className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              {t("next")}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !form.acceptTerms || !form.acceptPrivacy || (isOwner && !isSignedIn)}
              className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {submitting ? t("submittingCafe") : t("submitForReview")}
            </button>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
