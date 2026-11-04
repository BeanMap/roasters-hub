import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { VerifiedBadge } from "@/components/roasters/VerifiedBadge";

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
  const isVerified = cafe.status === "VERIFIED";

  return (
    <Link
      href={`/cafes/${cafe.slug}`}
      className="group block bg-surface-container rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
    >
      <div className="aspect-video bg-surface-container-high overflow-hidden relative">
        {cafe.coverImageUrl ? (
          <Image
            src={cafe.coverImageUrl}
            alt={cafe.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-on-surface-variant/30 text-4xl">☕</span>
          </div>
        )}
        {isVerified && (
          <div className="absolute top-3 right-3">
            <VerifiedBadge size="sm" />
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="font-headline text-xl tracking-tight mb-1 group-hover:text-primary transition-colors">
          {cafe.name}
        </h3>
        <p className="text-sm text-on-surface-variant/60 mb-3">
          {cafe.city}, {cafe.country}
        </p>
        {cafe.description && (
          <p className="text-sm text-on-surface-variant/70 line-clamp-2 mb-3 leading-relaxed">
            {cafe.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-xs text-on-surface-variant/50">
          <span>
            {cafe._count.roasters} roaster{cafe._count.roasters !== 1 ? "s" : ""}
          </span>
          {cafe.averageRating !== null && (
            <span>★ {cafe.averageRating.toFixed(1)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
