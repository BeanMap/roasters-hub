import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"
import { NewRunForm } from "./_components/NewRunForm"

export default async function NewRunPage() {

  const t = await getTranslations("admin")

  return (
    <>
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/admin/enrichment" className="text-on-surface-variant hover:text-on-background text-sm mb-4 inline-block">{t("backToRuns")}</Link>
          <h1 className="font-headline text-4xl font-bold text-on-background mb-1">{t("newEnrichmentRun")}</h1>
          <p className="text-on-surface-variant">{t("configureTriggerRun")}</p>
        </div>
        <NewRunForm />
      </main>
      <Footer />
    </>
  )
}
