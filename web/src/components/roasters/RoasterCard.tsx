import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { VerifiedBadge } from "./VerifiedBadge";
import { CertificationBadge } from "./CertificationBadge";
import { ImageWithFallback } from "./ImageWithFallback";
import { cn } from "@/lib/utils";
import { ImagePlaceholder } from "@/components/shared/ImagePlaceholder";

interface RoasterCardProps {
  roaster: {
    name: string;
    slug: string;
    city: string;
    country: string;
    certifications: string[];
    origins: string[];
    status: string;
    featured: boolean;
    description?: string | null;
    coverImageUrl?: string | null;
    images: { url: string; alt: string | null }[];
  };
  variant?: "default" | "compact";
  className?: string;
}

export function RoasterCard({ roaster, variant = "default", className }: RoasterCardProps) {
  const primaryImage = roaster.images[0];
  const fallbackUrl = primaryImage?.url || roaster.coverImageUrl;
  const fallbackAlt = primaryImage?.alt || `${roaster.name} roastery`;
  const isVerified = roaster.status === "VERIFIED";
  const t = useTranslations("filters");

  if (variant === "compact") {
    return (
      <Link
        href={`/roasters/${roaster.slug}`}
        className={cn(
          "group bg-surface-container-lowest p-3 rounded-xl border border-transparent hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer block",
          className
        )}
      >
        <div className="flex gap-4">
          <div className="w-24 h-24 rounded-lg overflow-hidden shrink-0 relative bg-surface-container">
            {fallbackUrl ? (
              <ImageWithFallback
                src={fallbackUrl}
                alt={fallbackAlt}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="96px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M2 20h20V4H2v16zm2-2V6h16v12H4z"/></svg>
              </div>
            )}
            {isVerified && (
              <div className="absolute top-1 right-1">
                <VerifiedBadge size="sm" className="text-[8px] px-1.5 py-0.5" />
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col justify-between py-0.5">
            <div>
              <h3 className="font-headline font-bold text-lg text-on-surface leading-tight">
                {roaster.name}
              </h3>
              <p className="text-xs text-on-surface-variant font-medium mt-1">
                {roaster.city}, {roaster.country}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {roaster.certifications.slice(0, 2).map((cert) => (
                <CertificationBadge key={cert} certification={cert} />
              ))}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  const origins = roaster.origins.slice(0, 3);

  return (
    <Link
      href={`/roasters/${roaster.slug}`}
      className={cn("group block rounded-2xl focus-visible:outline-offset-4", className)}
    >
      <article className="h-full flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#2a1f19] transition-shadow duration-300 group-hover:shadow-[var(--shadow-card-hover)]">
          {fallbackUrl ? (
            <ImageWithFallback
              src={fallbackUrl}
              alt={fallbackAlt}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <ImagePlaceholder label={roaster.name} />
          )}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent pointer-events-none" />
          <div className="absolute left-3 right-3 bottom-3 flex items-center justify-between gap-2">
            {roaster.featured ? (
              <span className="label-mono whitespace-nowrap truncate rounded-full bg-[#f5efe6] text-[#1f1611] px-2.5 py-1">★ {t("featured")}</span>
            ) : <span />}
            {isVerified && <VerifiedBadge size="sm" className="shadow-sm" />}
          </div>
        </div>

        <div className="pt-4 flex-1 flex flex-col">
          <p className="label-mono text-outline truncate">
            {roaster.city} — {roaster.country}
          </p>
          <h3 className="mt-1.5 text-[1.375rem] leading-[1.1] text-on-surface group-hover:text-primary transition-colors">
            {roaster.name}
          </h3>
          {roaster.description && (
            <p className="mt-2 text-[0.9375rem] text-on-surface-variant line-clamp-2 leading-relaxed">
              {roaster.description}
            </p>
          )}
          {(origins.length > 0 || roaster.certifications.length > 0) && (
            <div className="mt-auto pt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-outline-variant/70">
              {origins.length > 0 && (
                <span className="label-mono text-on-surface-variant">{origins.join(" · ")}</span>
              )}
              {roaster.certifications.slice(0, 1).map((cert) => (
                <CertificationBadge key={cert} certification={cert} />
              ))}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
