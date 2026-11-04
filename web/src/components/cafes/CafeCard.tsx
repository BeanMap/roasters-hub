import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { VerifiedBadge } from "@/components/roasters/VerifiedBadge";
import { ImageWithFallback } from "@/components/roasters/ImageWithFallback";
import { ImagePlaceholder } from "@/components/shared/ImagePlaceholder";

type CafeCardProps = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string;
  country: string;
  coverImageUrl: string | null;
  status: string;
  _count: { roasters: number; reviews: number };
  averageRating: number | null;
};

export function CafeCard({ cafe }: { cafe: CafeCardProps }) {
  const t = useTranslations("filters");
  const isVerified = cafe.status === "VERIFIED";

  return (
    <Link href={`/cafes/${cafe.slug}`} className="group block rounded-2xl focus-visible:outline-offset-4">
      <article className="h-full flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#2a1f19] transition-shadow duration-300 group-hover:shadow-[var(--shadow-card-hover)]">
          {cafe.coverImageUrl ? (
            <ImageWithFallback
              src={cafe.coverImageUrl}
              alt={cafe.name}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <ImagePlaceholder label={cafe.name} />
          )}
          {isVerified && (
            <div className="absolute right-3 bottom-3">
              <VerifiedBadge size="sm" className="shadow-sm" />
            </div>
          )}
        </div>
        <div className="pt-4 flex-1 flex flex-col">
          <p className="label-mono text-outline truncate">
            {cafe.city} — {cafe.country}
          </p>
          <h3 className="mt-1.5 text-[1.375rem] leading-[1.1] text-on-surface group-hover:text-primary transition-colors">
            {cafe.name}
          </h3>
          {cafe.description && (
            <p className="mt-2 text-[0.9375rem] text-on-surface-variant line-clamp-2 leading-relaxed">{cafe.description}</p>
          )}
          <div className="mt-auto pt-4 flex items-center gap-4 border-t border-outline-variant/70 label-mono text-on-surface-variant">
            <span>{t("roastersCount", { count: cafe._count.roasters })}</span>
            {cafe.averageRating !== null && (
              <span className="text-primary">★ {cafe.averageRating.toFixed(1)}</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
