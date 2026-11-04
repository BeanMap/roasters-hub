import { CERTIFICATION_LABELS, type Certification } from "@/types/certifications";
import { cn } from "@/lib/utils";

interface CertificationBadgeProps {
  certification: string;
  className?: string;
}

export function CertificationBadge({ certification, className }: CertificationBadgeProps) {
  const label = CERTIFICATION_LABELS[certification as Certification] ?? certification;

  return (
    <span
      className={cn(
        "label-mono inline-flex items-center gap-1 border border-outline-variant text-on-surface-variant text-[10px] px-2 py-0.5 rounded-full",
        className
      )}
    >
      {label}
    </span>
  );
}
