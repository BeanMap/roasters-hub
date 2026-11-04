import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { SortSelect } from "@/components/shared/SortSelect";
import { ActiveFilters, type ActiveFilter } from "@/components/shared/ActiveFilters";

/** Results header shared by every catalog: count, sort, removable active filters. */
export async function CatalogToolbar({
  basePath,
  shown,
  total,
  active,
}: {
  basePath: "/roasters" | "/cafes";
  shown: number;
  total: number;
  active: ActiveFilter[];
}) {
  const t = await getTranslations("filters");
  const tCommon = await getTranslations("common");
  const options = [
    { label: t("sortRecommended"), value: "recommended" },
    { label: t("sortNameAZ"), value: "nameAZ" },
    { label: t("sortNewest"), value: "newest" },
    { label: t("sortMostReviewed"), value: "mostReviewed" },
  ];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-5 border-b border-outline-variant/70">
        <span className="label-mono text-on-surface-variant" aria-live="polite">
          {t("showing", { shown, total })}
        </span>
        <label className="flex items-center gap-3">
          <span className="label-mono text-outline">{tCommon("sortBy")}</span>
          <Suspense fallback={<span className="w-32 h-8 rounded-full bg-surface-container" />}>
            <SortSelect basePath={basePath} options={options} />
          </Suspense>
        </label>
      </div>
      <Suspense fallback={null}>
        <ActiveFilters basePath={basePath} filters={active} />
      </Suspense>
    </>
  );
}
