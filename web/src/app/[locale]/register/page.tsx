"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useAuth, SignInButton, SignedIn } from "@clerk/nextjs";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";
import { ROAST_STYLES, CERTIFICATIONS, CERTIFICATION_LABELS, ORIGINS } from "@/types/certifications";
import { createRoasterRegistration } from "@/actions/roaster.actions";
import { getDefaultCountryFromLocale } from "@/lib/default-country";
import { detectCountry } from "@/actions/geo.actions";
import { usePersistedForm } from "@/lib/use-persisted-form";
import { OpeningHoursPicker } from "@/components/shared/OpeningHoursPicker";
import { AddressAutocomplete } from "@/components/shared/AddressAutocomplete";
import { CountryAutocomplete } from "@/components/shared/CountryAutocomplete";
import { CityAutocomplete } from "@/components/shared/CityAutocomplete";
import { MiniMap } from "@/components/shared/MiniMap";
import { EMPTY_OPENING_HOURS, type OpeningHours } from "@/types/opening-hours";

export default function RegisterPage() {
  const t = useTranslations("register");
  const locale = useLocale();
  const { isSignedIn } = useAuth();
  const defaultCountry = getDefaultCountryFromLocale(locale);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, updateForm, clearForm] = usePersistedForm("register-roaster-form", {
    name: "",
    country: defaultCountry?.name ?? "",
    countryCode: defaultCountry?.code ?? "",
    city: "",
    description: "",
    address: "",
    streetNumber: "",
    lat: "",
    lng: "",
    website: "",
    shopUrl: "",
    instagram: "",
    email: "",
    origins: [] as string[],
    roastStyles: [] as string[],
    certifications: [] as string[],
    acceptTerms: false,
    acceptPrivacy: false,
    acceptMarketing: false,
  });

  const [isOwner, setIsOwner] = useState(false);
  const [hours, setHours] = useState<OpeningHours>(EMPTY_OPENING_HOURS);

  useEffect(() => {
    if (defaultCountry) return;
    detectCountry().then((detected) => {
      if (detected && !form.country) {
        updateForm("country", detected.name);
      }
    });
  }, [defaultCountry]);

  const steps = t.raw("stepsRoaster") as string[];

  const updateField = (field: string, value: string | string[]) => {
    updateForm(field, value);
  };

  const handleCountryChange = (name: string, code: string) => {
    updateForm("country", name);
    updateForm("countryCode", code);
  };

  const toggleArray = (field: "origins" | "roastStyles" | "certifications", value: string) => {
    const current = form[field] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateForm(field, next);
  };

  const handleSubmit = async () => {
    if (!form.acceptTerms || !form.acceptPrivacy) {
      setError(t("consentRequired"));
      return;
    }

    setSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set("name", form.name);
    formData.set("country", form.country);
    formData.set("city", form.city);
    formData.set("description", form.description);
    const fullAddress = [form.address, form.streetNumber].filter(Boolean).join(" ");
    if (fullAddress) formData.set("address", fullAddress);
    if (form.lat) formData.set("lat", form.lat);
    if (form.lng) formData.set("lng", form.lng);
    formData.set("website", form.website);
    formData.set("shopUrl", form.shopUrl);
    formData.set("instagram", form.instagram);
    formData.set("email", form.email);
    formData.set("acceptMarketing", form.acceptMarketing ? "true" : "false");
    formData.set("isOwner", isOwner ? "true" : "false");
    formData.set("openingHours", JSON.stringify(hours));
    form.certifications.forEach((c) => formData.append("certifications", c));
    form.origins.forEach((o) => formData.append("origins", o));
    form.roastStyles.forEach((s) => formData.append("roastStyles", s));

    const result = await createRoasterRegistration(formData);

    if (!result.success) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    clearForm();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <>
        <Header />
        <main className="max-w-2xl mx-auto px-6 py-32 text-center">
          <div className="w-20 h-20 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg className="w-10 h-10 text-secondary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
            </svg>
          </div>
          <h1 className="font-headline text-4xl font-bold mb-4">{t("successTitleRoaster")}</h1>
          <p className="text-on-surface-variant text-lg mb-10">
            {t("successDescRoaster")}
          </p>
          <Link href="/roasters" className="bg-primary text-on-primary px-8 py-4 rounded-lg font-medium hover:opacity-90 transition-all inline-flex items-center gap-2">
            {t("successBrowseRoasters")}
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
        <h1 className="sr-only">{t("registerRoastery")}</h1>
        {/* Step Indicator */}
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

        {/* Step 1: Basic Info */}
        {step === 0 && (
          <div className="space-y-8">
            <h2 className="font-headline text-3xl font-bold">{t("step1RoasterTitle")}</h2>
            <div>
              <label className="block text-sm font-medium mb-2">{t("roasteryName")}</label>
              <input
                type="text" required
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="input-field"
                placeholder={t("roasteryNamePlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("country")}</label>
              <CountryAutocomplete
                value={form.country}
                onChange={handleCountryChange}
                locale={locale}
                placeholder={t("countryPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("city")}</label>
              <CityAutocomplete
                value={form.city}
                onChange={(v) => updateField("city", v)}
                country={form.country}
                placeholder={t("cityPlaceholder")}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2">{t("address")}</label>
                <AddressAutocomplete
                  value={form.address}
                  onChange={(v) => updateField("address", v)}
                  onCoordsChange={(lat, lng) => {
                    updateField("lat", String(lat));
                    updateField("lng", String(lng));
                  }}
                  city={form.city}
                  country={form.country}
                  placeholder={t("addressPlaceholder")}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t("streetNumber")}</label>
                <input
                  value={form.streetNumber}
                  onChange={(e) => updateField("streetNumber", e.target.value)}
                  className="input-field"
                  placeholder="42"
                />
              </div>
            </div>
            {form.lat && form.lng && (
              <MiniMap lat={parseFloat(form.lat)} lng={parseFloat(form.lng)} />
            )}
            <div>
              <label className="block text-sm font-medium mb-2">
                {t("description")} <span className="text-on-surface-variant font-normal">{t("descriptionCounter", { count: form.description.length })}</span>
              </label>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value.slice(0, 2000))}
                className="w-full bg-surface-container-low border-none rounded-lg py-3 px-4 focus:ring-2 focus:ring-primary text-sm resize-none"
                placeholder={t("descriptionPlaceholderRoaster")}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setStep(1)}
                disabled={!form.name || !form.country || !form.city}
                className="bg-primary text-on-primary px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("continue")}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Contact & Links */}
        {step === 1 && (
          <div className="space-y-8">
            <h2 className="font-headline text-3xl font-bold">{t("step2RoasterTitle")}</h2>
            <p className="text-on-surface-variant text-sm">{t("step2RoasterSubtitle")}</p>
            <div>
              <label className="block text-sm font-medium mb-2">{t("websiteUrl")}</label>
              <input type="url" value={form.website} onChange={(e) => updateField("website", e.target.value)} className="input-field" placeholder={t("websitePlaceholder")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("shopUrl")}</label>
              <input type="url" value={form.shopUrl} onChange={(e) => updateField("shopUrl", e.target.value)} className="input-field" placeholder={t("shopPlaceholder")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("instagramHandle")}</label>
              <input type="text" value={form.instagram} onChange={(e) => updateField("instagram", e.target.value)} className="input-field" placeholder={t("instagramPlaceholder")} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t("emailAddress")}</label>
              <input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="input-field" placeholder={t("emailPlaceholder")} />
            </div>
            <div className="flex justify-between">
              <button onClick={() => setStep(0)} className="text-on-surface-variant hover:text-on-surface transition-colors px-4 py-3">{t("back")}</button>
              <button onClick={() => setStep(2)} className="bg-primary text-on-primary px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-all">{t("continue")}</button>
            </div>
          </div>
        )}

        {/* Step 3: Specialty Details */}
        {step === 2 && (
          <div className="space-y-8">
            <h2 className="font-headline text-3xl font-bold">{t("step3RoasterTitle")}</h2>

            <div>
              <label className="block text-sm font-medium mb-3">{t("coffeeOrigins")}</label>
              <div className="flex flex-wrap gap-2">
                {ORIGINS.map((origin) => (
                  <button
                    key={origin}
                    type="button"
                    onClick={() => toggleArray("origins", origin)}
                    className={form.origins.includes(origin)
                      ? "px-4 py-1.5 rounded-full bg-primary text-on-primary text-xs transition-colors"
                      : "px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant text-xs hover:bg-surface-variant transition-colors"
                    }
                  >
                    {origin}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">{t("roastStyles")}</label>
              <div className="flex flex-wrap gap-2">
                {ROAST_STYLES.map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleArray("roastStyles", style)}
                    className={form.roastStyles.includes(style)
                      ? "px-4 py-2 rounded-lg bg-primary text-on-primary text-sm transition-colors"
                      : "px-4 py-2 rounded-lg bg-surface-container-high text-on-surface-variant text-sm hover:bg-surface-variant transition-colors"
                    }
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">{t("certifications")}</label>
              <div className="grid grid-cols-2 gap-3">
                {CERTIFICATIONS.map((cert) => (
                  <label key={cert} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.certifications.includes(cert)}
                      onChange={() => toggleArray("certifications", cert)}
                      className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-on-surface-variant group-hover:text-on-surface transition-colors">
                      {CERTIFICATION_LABELS[cert]}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-3">{t("openingHours")}</p>
              <OpeningHoursPicker value={hours} onChange={setHours} />
            </div>

            <div className="space-y-3 pt-4 border-t border-outline/10">
              <h3 className="text-sm font-semibold text-on-surface">{t("yourRoleRoaster")}</h3>

              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isOwner
                    ? "border-primary bg-primary/5"
                    : "border-outline/10 hover:border-outline"
                }`}
              >
                <input
                  type="radio"
                  name="roasterRole"
                  checked={isOwner}
                  onChange={() => setIsOwner(true)}
                  className="mt-0.5 w-4 h-4 text-primary focus:ring-primary"
                />
                <div>
                  <span className="text-sm font-medium">{t("iAmOwnerRoaster")}</span>
                  <p className="text-xs text-on-surface-variant mt-0.5">{t("iAmOwnerRoasterDesc")}</p>
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
                  name="roasterRole"
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

            <div className="space-y-4 pt-4 border-t border-outline/10">
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

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-between pt-4">
              <button onClick={() => setStep(1)} className="text-on-surface-variant hover:text-on-surface transition-colors px-4 py-3">{t("back")}</button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !form.acceptTerms || !form.acceptPrivacy || (isOwner && !isSignedIn)}
                className="bg-primary text-on-primary px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? t("submitting") : t("submitForVerification")}
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
