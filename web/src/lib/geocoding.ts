const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

const USER_AGENT = "BeenMap/1.0";

interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
  road?: string;
  houseNumber?: string;
  city?: string;
  country?: string;
}

let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1100;

async function rateLimitedFetch(url: string, signal?: AbortSignal): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_INTERVAL_MS - elapsed),
    );
  }
  lastRequestTime = Date.now();
  return fetch(url, { headers: { "User-Agent": USER_AGENT }, signal });
}

interface NominatimItem {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    house_number?: string;
    city?: string;
    town?: string;
    village?: string;
    country?: string;
  };
}

export async function searchAddress(
  query: string,
  city?: string,
  country?: string,
  signal?: AbortSignal,
): Promise<GeocodingResult[]> {
  const parts = [query];
  if (city) parts.push(city);
  if (country) parts.push(country);
  const encoded = encodeURIComponent(parts.join(", "));

  try {
    const resp = await rateLimitedFetch(
      `${NOMINATIM_BASE}/search?q=${encoded}&format=json&limit=5`,
      signal,
    );

    if (!resp.ok) return [];

    const data: NominatimItem[] = await resp.json();

    return data.map((item) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
      road: item.address?.road,
      houseNumber: item.address?.house_number,
      city: item.address?.city ?? item.address?.town ?? item.address?.village,
      country: item.address?.country,
    }));
  } catch {
    return [];
  }
}

export async function searchCity(
  query: string,
  country?: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const parts = [query];
  if (country) parts.push(country);
  const encoded = encodeURIComponent(parts.join(", "));

  try {
    const resp = await rateLimitedFetch(
      `${NOMINATIM_BASE}/search?q=${encoded}&format=json&limit=5&featuretype=city`,
      signal,
    );

    if (!resp.ok) return [];

    const data: NominatimItem[] = await resp.json();
    const names = data
      .map((d) => d.display_name.split(",")[0]?.trim())
      .filter((n, i, a): n is string => Boolean(n) && a.indexOf(n) === i);

    return names;
  } catch {
    return [];
  }
}
