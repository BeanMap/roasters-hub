import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function VerifiedBadge({ size = "sm", className }: VerifiedBadgeProps) {
  const t = useTranslations("filters");
  return (
    <span
      className={cn(
        "label-mono inline-flex items-center gap-1 whitespace-nowrap shrink-0 bg-secondary text-on-secondary rounded-full",
        size === "sm" && "text-[10px] px-2 py-1",
        size === "md" && "text-xs px-3 py-1",
        size === "lg" && "text-xs px-4 py-1.5",
        className
      )}
    >
      <svg className={cn("fill-current", size === "sm" ? "w-3 h-3" : "w-4 h-4")} viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
      </svg>
      {t("verified")}
    </span>
  );
}
