import { getTranslations } from "next-intl/server";
import { AdminNavLink } from "./AdminNavLink";

/**
 * Admin top bar. Lists every admin section — the verification queue, review
 * moderation and activity log used to be reachable only by typing the URL.
 */
export async function AdminNav({ name }: { name: string }) {
  const t = await getTranslations("admin");
  const links = [
    { href: "/admin", label: t("dashboard"), exact: true },
    { href: "/admin/pending", label: t("pendingApprovals") },
    { href: "/admin/roasters", label: t("allRoasters") },
    { href: "/admin/cafes", label: t("cafes") },
    { href: "/admin/reviews", label: t("reviews") },
    { href: "/admin/images/pending", label: t("navImages") },
    { href: "/admin/enrichment", label: t("enrichment") },
    { href: "/admin/activity", label: t("navActivity") },
    { href: "/admin/settings", label: t("navSettings") },
  ];

  return (
    <nav className="sticky top-0 z-[900] flex h-12 items-center gap-1 overflow-x-auto bg-[#1f1611] px-4 text-sm text-[#f5efe6]/70">
      <span className="label-mono mr-3 shrink-0 text-[#f2a77d]">Bean Map · Admin</span>
      {links.map((l) => (
        <AdminNavLink key={l.href} href={l.href} exact={l.exact}>
          {l.label}
        </AdminNavLink>
      ))}
      <span className="ml-auto flex shrink-0 items-center gap-4 pl-4">
        <AdminNavLink href="/" exact>
          {t("navSite")} ↗
        </AdminNavLink>
        <span className="label-mono text-[#f5efe6]/40">@{name}</span>
      </span>
    </nav>
  );
}
