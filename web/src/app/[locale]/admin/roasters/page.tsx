import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { RoasterStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { Header } from "@/components/shared/Header";
import { Footer } from "@/components/shared/Footer";

export const revalidate = 60;

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-900",
  VERIFIED: "bg-secondary-container text-on-secondary-container",
  REJECTED: "bg-error-container text-on-error-container",
  INACTIVE: "bg-surface-container-high text-on-surface-variant",
};

const PAGE_SIZE = 25;
const STATUS_OPTIONS = ["ALL", "PENDING", "VERIFIED", "REJECTED", "INACTIVE"] as const;

type SearchParams = Promise<{ status?: string; sort?: string; page?: string; q?: string }>;

export default async function AdminRoastersPage({ searchParams }: { searchParams: SearchParams }) {

  const t = await getTranslations("admin");

  const sp = await searchParams;
  const statusFilter = (STATUS_OPTIONS as readonly string[]).includes(sp.status ?? "") ? sp.status! : "ALL";
  const sort = sp.sort === "oldest" ? "oldest" : "newest";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const q = sp.q?.trim() ?? "";

  const where = {
    ...(statusFilter !== "ALL" ? { status: statusFilter as RoasterStatus } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [total, roasters] = await Promise.all([
    db.roaster.count({ where }),
    db.roaster.findMany({
      where,
      orderBy: { createdAt: sort === "oldest" ? "asc" : "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true, name: true, slug: true, city: true, country: true, status: true,
        createdAt: true, updatedAt: true,
        _count: { select: { events: { where: { type: "PAGE_VIEW" } } } },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const buildQuery = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    const merged = { status: statusFilter, sort, page, q, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "ALL" && !(k === "page" && v === 1)) params.set(k, String(v));
    }
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  };

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="font-headline text-4xl font-bold text-on-background mb-2">{t("allRoasters")}</h1>
            <p className="text-on-surface-variant">{t("total", { total: total.toLocaleString(), page, totalPages })}</p>
          </div>
          <Link href="/admin" className="text-primary font-bold hover:underline">{t("backToDashboard")}</Link>
        </div>

        {/* Search */}
        <form action="/admin/roasters" method="get" className="mb-4">
          {statusFilter !== "ALL" && <input type="hidden" name="status" value={statusFilter} />}
          {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
          <div className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder={t("searchByName")}
              className="flex-1 max-w-sm border border-outline/30 rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-surface-container-low text-on-surface-variant text-sm font-bold hover:bg-surface-container transition-colors"
            >
              {t("search")}
            </button>
            {q && (
              <Link
                href={`/admin/roasters${buildQuery({ q: "", page: 1 })}`}
                className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {t("clear")}
              </Link>
            )}
          </div>
        </form>

        {/* Filters & Sort */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">{t("status")}:</span>
          {STATUS_OPTIONS.map((s) => (
            <Link
              key={s}
              href={`/admin/roasters${buildQuery({ status: s, page: 1 })}`}
              className={`px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
                statusFilter === s ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {s}
            </Link>
          ))}
          <span className="ml-auto text-xs uppercase tracking-widest text-on-surface-variant font-bold">Sort:</span>
          <Link
            href={`/admin/roasters${buildQuery({ sort: "newest", page: 1 })}`}
            className={`px-3 py-1.5 rounded-full text-sm font-bold ${sort === "newest" ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant"}`}
          >{t("newest")}</Link>
          <Link
            href={`/admin/roasters${buildQuery({ sort: "oldest", page: 1 })}`}
            className={`px-3 py-1.5 rounded-full text-sm font-bold ${sort === "oldest" ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant"}`}
          >{t("oldest")}</Link>
        </div>

        <div className="bg-surface-container-lowest rounded-xl overflow-hidden editorial-shadow">
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-left text-xs uppercase tracking-widest text-on-surface-variant">
              <tr>
                <th className="px-5 py-3 font-bold">{t("name")}</th>
                <th className="px-5 py-3 font-bold">{t("location")}</th>
                <th className="px-5 py-3 font-bold">{t("status")}</th>
                <th className="px-5 py-3 font-bold">{t("views")}</th>
                <th className="px-5 py-3 font-bold">{t("modified")}</th>
                <th className="px-5 py-3 font-bold">{t("registered")}</th>
              </tr>
            </thead>
            <tbody>
              {roasters.map((r) => (
                <tr key={r.id} className="border-t border-outline-variant/20 hover:bg-surface-container-lowest/50">
                  <td className="px-5 py-3">
                    <Link href={`/admin/roasters/${r.id}`} className="font-bold text-primary hover:underline">{r.name}</Link>
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">{r.city}, {r.country}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${STATUS_COLORS[r.status]}`}>{r.status}</span>
                  </td>
                  <td className="px-5 py-3 text-on-surface-variant">{r._count.events}</td>
                  <td className="px-5 py-3 text-on-surface-variant">{r.updatedAt.toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-on-surface-variant">{r.createdAt.toLocaleDateString()}</td>
                </tr>
              ))}
              {roasters.length === 0 && (
                <tr><td className="px-5 py-8 text-center text-on-surface-variant" colSpan={6}>{t("noResults")}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            {page > 1 && (
              <Link href={`/admin/roasters${buildQuery({ page: page - 1 })}`} className="px-4 py-2 rounded-lg bg-surface-container-low font-bold hover:bg-surface-container">{t("prev")}</Link>
            )}
            <span className="text-sm text-on-surface-variant">{t("total", { total: page, page, totalPages })}</span>
            {page < totalPages && (
              <Link href={`/admin/roasters${buildQuery({ page: page + 1 })}`} className="px-4 py-2 rounded-lg bg-surface-container-low font-bold hover:bg-surface-container">{t("next")}</Link>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
