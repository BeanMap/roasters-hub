import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { db } from "@/lib/db"
import { Header } from "@/components/shared/Header"
import { Footer } from "@/components/shared/Footer"

export const revalidate = 0

const STATUS_COLORS: Record<string, string> = {
  RUNNING: "bg-blue-100 text-blue-900",
  DONE: "bg-secondary-container text-on-secondary-container",
  FAILED: "bg-error-container text-on-error-container",
}

export default async function EnrichmentHistoryPage() {

  const t = await getTranslations("admin")

  const runs = await db.enrichmentRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      _count: { select: { proposals: true } },
      proposals: {
        where: { status: "PENDING" },
        select: { id: true },
      },
    },
  })

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-background mb-1">{t("enrichmentTitle")}</h1>
            <p className="text-on-surface-variant">{t("enrichmentSubtitle")}</p>
          </div>
          <Link
            href="/admin/enrichment/new"
            className="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
          >
            {t("newRun")}
          </Link>
        </div>

        <div className="bg-surface-container-lowest rounded-xl overflow-hidden editorial-shadow">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-left text-xs uppercase tracking-widest text-on-surface-variant">
              <tr>
                <th className="px-5 py-3 font-bold">{t("date")}</th>
                <th className="px-5 py-3 font-bold">{t("type")}</th>
                <th className="px-5 py-3 font-bold">{t("mode")}</th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
                  {t("keywords")}
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-500">
                  {t("location")}
                </th>
                <th className="px-5 py-3 font-bold">{t("sources")}</th>
                <th className="px-5 py-3 font-bold">{t("status")}</th>
                <th className="px-5 py-3 font-bold">{t("proposals")}</th>
                <th className="px-5 py-3 font-bold">{t("pending")}</th>
                <th className="px-5 py-3 font-bold"></th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const query = run.query as Record<string, unknown>
                const pendingCount = run.proposals.length
                return (
                  <tr key={run.id} className="border-t border-outline-variant/20 hover:bg-surface-container/40 transition-colors">
                    <td className="px-5 py-3 text-on-surface-variant whitespace-nowrap">
                      {run.createdAt.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-5 py-3 font-bold">{String(query.entityType ?? "—")}</td>
                    <td className="px-5 py-3 text-on-surface-variant capitalize">{String(query.mode ?? "—")}</td>
                    {/* Keywords */}
                    <td className="px-3 py-3 text-sm text-stone-600">
                      {Array.isArray((run.query as Record<string, unknown>)?.keywords) &&
                      ((run.query as Record<string, unknown>).keywords as string[]).length > 0
                        ? ((run.query as Record<string, unknown>).keywords as string[])
                            .slice(0, 3)
                            .join(", ")
                        : <span className="text-stone-300">—</span>}
                    </td>
                    {/* Lokalizacja */}
                    <td className="px-3 py-3 text-sm text-stone-600">
                      {[
                        (run.query as Record<string, unknown>)?.city,
                        (run.query as Record<string, unknown>)?.country,
                      ]
                        .filter(Boolean)
                        .join(", ") || <span className="text-stone-300">—</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {run.sources.map((s) => (
                          <span key={s} className="bg-surface-container px-2 py-0.5 rounded text-xs font-mono">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold ${STATUS_COLORS[run.status] ?? "bg-surface-container text-on-surface-variant"}`}>
                        {run.status === "RUNNING" && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        )}
                        {run.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-on-surface-variant">{run._count.proposals}</td>
                    <td className="px-5 py-3">
                      {pendingCount > 0 ? (
                        <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-xs font-bold">{pendingCount} {t("pending")}</span>
                      ) : (
                        <span className="text-on-surface-variant text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/enrichment/${run.id}`}
                        className="text-primary font-bold text-xs hover:underline"
                      >
                        {t("review")}
                      </Link>
                    </td>
                  </tr>
                )
              })}
              {runs.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-5 py-12 text-center text-on-surface-variant">
                    {t("noEnrichmentRuns")}{" "}
                    <Link href="/admin/enrichment/new" className="text-primary hover:underline">{t("startFirstRun")}</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </>
  )
}
