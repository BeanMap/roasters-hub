const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

const USER_AGENT = "BeenMap/1.0";

interface GeocodingResult {
  lat: number;
  lng: number;
  displayName: string;
}

let lastRequestTime = 0;
const MIN_INTERVAL_MS = 1100;

async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < MIN_INTERVAL_MS) {
    await new Promise((resolve) =>
      setTimeout(resolve, MIN_INTERVAL_MS - elapsed),
    );
  }
  lastRequestTime = Date.now();
  return fetch(url, { headers: { "User-Agent": USER_AGENT } });
}

interface NominatimItem {
  lat: string;
  lon: string;
  display_name: string;
}

export async function geocodeAddress(
  address: string,
  city?: string,
  country?: string,
): Promise<GeocodingResult | null> {
  const parts = [address, city, country].filter(Boolean);
  const query = encodeURIComponent(parts.join(", "));

  try {
    const resp = await rateLimitedFetch(
      `${NOMINATIM_BASE}/search?q=${query}&format=json&limit=1`,
    );

    if (!resp.ok) return null;

    const data: NominatimItem[] = await resp.json();
    if (!data.length) return null;

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };
  } catch {
    return null;
  }
}

export async function searchAddress(
  query: string,
  city?: string,
  country?: string,
): Promise<GeocodingResult[]> {
  const parts = [query];
  if (city) parts.push(city);
  if (country) parts.push(country);
  const encoded = encodeURIComponent(parts.join(", "));

  try {
    const resp = await rateLimitedFetch(
      `${NOMINATIM_BASE}/search?q=${encoded}&format=json&limit=5`,
    );

    if (!resp.ok) return [];

    const data: NominatimItem[] = await resp.json();

    return data.map((item) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
    }));
  } catch {
    return [];
  }
}
