import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

export default async function NotFound() {
  const t = await getTranslations("errors");

  return (
    <>
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <p className="font-headline text-7xl text-surface-container-highest mb-4">{t("notFoundCode")}</p>
        <h1 className="font-headline text-3xl text-on-surface mb-3">
          {t("notFoundTitle")}
        </h1>
        <p className="text-on-surface-variant mb-8 max-w-sm">{t("notFoundDescription")}</p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/roasters"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary hover:bg-accent-hover transition-colors"
          >
            {t("browseRoasters")}
          </Link>
          <Link
            href="/cafes"
            className="rounded-lg border border-outline-variant px-5 py-2.5 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors"
          >
            {t("browseCafes")}
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
