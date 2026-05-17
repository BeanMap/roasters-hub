import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { db } from "@/lib/db";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

export const revalidate = 300;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  VERIFIED: "bg-secondary-container text-on-secondary-container",
  REJECTED: "bg-error-container text-on-error-container",
  INACTIVE: "bg-surface-container-high text-on-surface-variant",
};

export default async function AdminActivityPage() {

  const t = await getTranslations("admin");

  // eslint-disable-next-line react-hooks/purity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [recentRegistrations, recentNotes, topProfiles] = await Promise.all([
    db.roaster.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, name: true, slug: true, status: true, createdAt: true, city: true, country: true },
    }),
    db.adminNote.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { roaster: { select: { name: true, slug: true, status: true } } },
    }),
    db.profileEvent.groupBy({
      by: ["roasterId"],
      where: { type: "PAGE_VIEW", createdAt: { gte: thirtyDaysAgo } },
      _count: { _all: true },
      orderBy: { _count: { roasterId: "desc" } },
      take: 10,
    }),
  ]);

  const topRoasterIds = topProfiles.map((t) => t.roasterId);
  const topRoasters = topRoasterIds.length
    ? await db.roaster.findMany({
        where: { id: { in: topRoasterIds } },
        select: { id: true, name: true, slug: true },
      })
    : [];
  const topRoasterMap = new Map(topRoasters.map((r) => [r.id, r]));

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-background mb-2">{t("activityLogTitle")}</h1>
            <p className="text-on-surface-variant">{t("activityLogSubtitle")}</p>
          </div>
          <Link href="/admin" className="text-primary font-bold hover:underline">{t("backToDashboard")}</Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-surface-container-lowest rounded-xl overflow-hidden editorial-shadow">
            <h2 className="font-headline text-xl font-bold px-5 py-4 border-b border-outline-variant/20">{t("latestRegistrations")}</h2>
            <ul className="divide-y divide-outline-variant/20">
              {recentRegistrations.map((r) => (
                <li key={r.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                  <Link href={`/roasters/${r.slug}`} className="font-bold text-primary hover:underline">{r.name}</Link>
                  <span className="text-on-surface-variant text-xs">{r.city}, {r.country}</span>
                  <span className="ml-auto text-xs text-on-surface-variant">{r.createdAt.toLocaleDateString()}</span>
                </li>
              ))}
              {recentRegistrations.length === 0 && (
                <li className="px-5 py-6 text-center text-on-surface-variant">{t("noRegistrationsYet")}</li>
              )}
            </ul>
          </section>

          <section className="bg-surface-container-lowest rounded-xl overflow-hidden editorial-shadow">
            <h2 className="font-headline text-xl font-bold px-5 py-4 border-b border-outline-variant/20">{t("adminNotes")}</h2>
            <ul className="divide-y divide-outline-variant/20">
              {recentNotes.map((n) => (
                <li key={n.id} className="px-5 py-3 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href={`/roasters/${n.roaster.slug}`} className="font-bold text-primary hover:underline">{n.roaster.name}</Link>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_COLORS[n.roaster.status]}`}>{n.roaster.status}</span>
                    <span className="ml-auto text-xs text-on-surface-variant">{n.createdAt.toLocaleDateString()}</span>
                  </div>
                  <p className="text-on-surface-variant text-xs line-clamp-2">{n.note}</p>
                </li>
              ))}
              {recentNotes.length === 0 && (
                <li className="px-5 py-6 text-center text-on-surface-variant">{t("noAdminNotesYet")}</li>
              )}
            </ul>
          </section>
        </div>

        <section className="mt-8 bg-surface-container-lowest rounded-xl overflow-hidden editorial-shadow">
          <h2 className="font-headline text-xl font-bold px-5 py-4 border-b border-outline-variant/20">{t("topProfilesViews")}</h2>
          <ol className="divide-y divide-outline-variant/20">
            {topProfiles.map((tProf, idx) => {
              const r = topRoasterMap.get(tProf.roasterId);
              if (!r) return null;
              return (
                <li key={tProf.roasterId} className="px-5 py-3 flex items-center gap-4 text-sm">
                  <span className="font-headline text-2xl font-bold text-on-surface-variant w-8">{idx + 1}</span>
                  <Link href={`/roasters/${r.slug}`} className="font-bold text-primary hover:underline flex-1">{r.name}</Link>
                  <span className="text-on-surface-variant text-xs uppercase tracking-widest font-bold">{t("views")}</span>
                  <span className="font-headline text-xl font-bold text-primary">{tProf._count._all.toLocaleString()}</span>
                </li>
              );
            })}
            {topProfiles.length === 0 && (
              <li className="px-5 py-6 text-center text-on-surface-variant">{t("noPageViews30d")}</li>
            )}
          </ol>
        </section>
      </main>
      <Footer />
    </>
  );
}
