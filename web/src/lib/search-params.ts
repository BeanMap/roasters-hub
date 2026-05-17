export function buildPageHref(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined>,
  newPage: number,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (key === "page") continue;
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, v));
    } else if (value) {
      params.set(key, value);
    }
  }
  if (newPage > 1) params.set("page", String(newPage));
  const qs = params.toString();
  return `${basePath}${qs ? `?${qs}` : ""}`;
}
