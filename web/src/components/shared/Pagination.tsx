import { Link } from "@/i18n/navigation";
import { buildPageHref } from "@/lib/search-params";
import { pageWindow } from "@/lib/pagination";

type PaginationProps = {
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
  page: number;
  totalPages: number;
  labels: { previous: string; next: string; page: string };
};

const pill =
  "min-w-9 h-9 sm:min-w-10 sm:h-10 px-1.5 rounded-full inline-flex items-center justify-center text-sm transition-colors";

export function Pagination({ basePath, searchParams, page, totalPages, labels }: PaginationProps) {
  if (totalPages <= 1) return null;
  const href = (p: number) => buildPageHref(basePath, searchParams, p);

  return (
    <nav aria-label="Pagination" className="mt-16 flex items-center justify-center gap-1 sm:gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} rel="prev" className="px-2 sm:px-3 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
          &larr; <span className="hidden sm:inline">{labels.previous}</span>
        </Link>
      ) : null}
      <div className="flex items-center gap-0.5 sm:gap-1">
        {pageWindow(page, totalPages).map((p, i) =>
          p === null ? (
            <span key={`gap-${i}`} className="w-5 text-center text-on-surface-variant" aria-hidden>
              …
            </span>
          ) : (
            <Link
              key={p}
              href={href(p)}
              aria-label={`${labels.page} ${p}`}
              aria-current={p === page ? "page" : undefined}
              className={
                p === page
                  ? `${pill} font-semibold bg-primary text-on-primary`
                  : `${pill} font-medium hover:bg-surface-container`
              }
            >
              {p}
            </Link>
          ),
        )}
      </div>
      {page < totalPages ? (
        <Link href={href(page + 1)} rel="next" className="px-2 sm:px-3 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors">
          <span className="hidden sm:inline">{labels.next}</span> &rarr;
        </Link>
      ) : null}
    </nav>
  );
}
