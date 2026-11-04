/** Branded stand-in when a photo is missing or fails to load. */
export function ImagePlaceholder({ label }: { label?: string }) {
  const initial = label?.trim().charAt(0).toUpperCase() || "B";
  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-[#2a1f19] text-[#f5efe6]/80"
      style={{
        backgroundImage:
          "radial-gradient(rgba(245,239,230,0.12) 1px, transparent 1.2px), radial-gradient(120% 80% at 20% 0%, rgba(179,68,27,0.45), transparent 60%)",
        backgroundSize: "12px 12px, 100% 100%",
      }}
      aria-hidden
    >
      <span className="font-headline text-6xl leading-none">{initial}</span>
    </div>
  );
}
