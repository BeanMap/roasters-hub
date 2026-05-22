import Link from "next/link";
import { VerifiedBadge } from "./VerifiedBadge";
import { CertificationBadge } from "./CertificationBadge";
import { ImageWithFallback } from "./ImageWithFallback";
import { cn } from "@/lib/utils";

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

  return (
    <Link
      href={`/roasters/${roaster.slug}`}
      className={cn("group cursor-pointer block", className)}
    >
      <article>
        <div className="relative mb-4 aspect-[4/5] overflow-hidden rounded-xl bg-surface-container shadow-sm group-hover:shadow-md transition-all duration-300">
          {fallbackUrl ? (
            <ImageWithFallback
              src={fallbackUrl}
              alt={fallbackAlt}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-on-surface-variant/30 bg-surface-container-low">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M2 20h20V4H2v16zm2-2V6h16v12H4z"/></svg>
            </div>
          )}
          {isVerified && (
            <span className="absolute top-4 right-4">
              <VerifiedBadge size="md" className="shadow-lg" />
            </span>
          )}
          {roaster.featured && (
            <span className="absolute top-4 left-4 bg-primary text-on-primary text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">
              Featured
            </span>
          )}
        </div>
        <h3 className="font-headline text-xl mb-1 group-hover:text-primary transition-colors">
          {roaster.name}
        </h3>
        <p className="text-xs text-on-surface-variant mb-3">
          {roaster.city} &bull; {roaster.country}
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {roaster.certifications.slice(0, 2).map((cert) => (
            <CertificationBadge key={cert} certification={cert} />
          ))}
        </div>
        {roaster.description && (
          <p className="text-sm text-on-surface-variant line-clamp-2 leading-relaxed">
            {roaster.description}
          </p>
        )}
      </article>
    </Link>
  );
}
