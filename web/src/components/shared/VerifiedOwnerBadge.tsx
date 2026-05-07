export function VerifiedOwnerBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 bg-green-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium"
      title="Verified owner upload"
    >
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
      </svg>
      Owner
    </span>
  );
}
