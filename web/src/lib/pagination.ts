/** Page numbers to show: first, last, current ±1, with gaps marked as null. */
export function pageWindow(page: number, totalPages: number): (number | null)[] {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  for (const p of sorted) {
    const prev = out[out.length - 1];
    if (typeof prev === "number" && p - prev > 1) out.push(p - prev === 2 ? prev + 1 : null);
    out.push(p);
  }
  return out;
}
