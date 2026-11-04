"use client";

import { Link, usePathname } from "@/i18n/navigation";

export function AdminNavLink({ href, exact, children }: { href: string; exact?: boolean; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`shrink-0 rounded-full px-3 py-1 transition-colors ${
        active ? "bg-[#f5efe6] text-[#1f1611] font-semibold" : "hover:text-[#f5efe6] hover:bg-surface-container-lowest/10"
      }`}
    >
      {children}
    </Link>
  );
}
