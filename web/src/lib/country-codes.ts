/**
 * Maps common country names to ISO 3166-1 alpha-2 codes.
 * Used by registration form to auto-resolve countryCode.
 */
const COUNTRY_MAP: Record<string, string> = {
  "australia": "AU",
  "austria": "AT",
  "belgium": "BE",
  "brazil": "BR",
  "canada": "CA",
  "chile": "CL",
  "china": "CN",
  "colombia": "CO",
  "costa rica": "CR",
  "czech republic": "CZ",
  "czechia": "CZ",
  "denmark": "DK",
  "ecuador": "EC",
  "el salvador": "SV",
  "ethiopia": "ET",
  "finland": "FI",
  "france": "FR",
  "germany": "DE",
  "greece": "GR",
  "guatemala": "GT",
  "honduras": "HN",
  "hungary": "HU",
  "india": "IN",
  "indonesia": "ID",
  "ireland": "IE",
  "israel": "IL",
  "italy": "IT",
  "japan": "JP",
  "kenya": "KE",
  "mexico": "MX",
  "netherlands": "NL",
  "new zealand": "NZ",
  "nicaragua": "NI",
  "norway": "NO",
  "panama": "PA",
  "peru": "PE",
  "philippines": "PH",
  "poland": "PL",
  "portugal": "PT",
  "romania": "RO",
  "rwanda": "RW",
  "south africa": "ZA",
  "south korea": "KR",
  "spain": "ES",
  "sweden": "SE",
  "switzerland": "CH",
  "taiwan": "TW",
  "thailand": "TH",
  "turkey": "TR",
  "türkiye": "TR",
  "uganda": "UG",
  "united arab emirates": "AE",
  "uae": "AE",
  "united kingdom": "GB",
  "uk": "GB",
  "united states": "US",
  "usa": "US",
  "vietnam": "VN",
  "yemen": "YE",
};

const LOCALES_FOR_NAMES = ["en", "pl", "de"] as const;
let localizedNameMap: Map<string, string> | undefined;

/** Lower-case, accent-free key ("Niemcy", "niemcy ", "NIEMCY" → "niemcy"). */
function nameKey(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l").trim().toLowerCase();
}

/** Every ISO region name in EN/PL/DE → code, built once from Intl data. */
function localizedNames(): Map<string, string> {
  if (localizedNameMap) return localizedNameMap;
  const map = new Map<string, string>();
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (const locale of LOCALES_FOR_NAMES) {
    let names: Intl.DisplayNames;
    try {
      names = new Intl.DisplayNames([locale], { type: "region", fallback: "none" });
    } catch {
      continue;
    }
    for (const a of letters) {
      for (const b of letters) {
        const code = a + b;
        const name = names.of(code);
        if (name && name !== code) map.set(nameKey(name), code);
      }
    }
  }
  localizedNameMap = map;
  return map;
}

/**
 * Country name or code (any of EN/PL/DE, any case) → ISO 3166-1 alpha-2.
 * Returns "" when it cannot be resolved.
 */
export function resolveCountryCode(country: string): string {
  const key = nameKey(country ?? "");
  if (!key) return "";
  if (COUNTRY_MAP[key]) return COUNTRY_MAP[key];
  const fromIntl = localizedNames().get(key);
  if (fromIntl) return fromIntl;
  if (/^[a-z]{2}$/.test(key) && localizedNames().size > 0) {
    const upper = key.toUpperCase();
    return [...localizedNames().values()].includes(upper) ? upper : "";
  }
  return "";
}

/** Canonical English country name for a code (the form stored in the DB). */
export function countryNameForCode(code: string): string {
  try {
    if (code === "CZ") return "Czech Republic"; // matches existing seed data
    return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Polish and German cities are stored under their local names. */
const CITY_CANONICAL: Record<string, string> = {
  warsaw: "Warszawa", warszawa: "Warszawa", warschau: "Warszawa",
  poznan: "Poznań", posen: "Poznań",
  krakow: "Kraków", cracow: "Kraków", krakau: "Kraków",
  wroclaw: "Wrocław", breslau: "Wrocław",
  gdansk: "Gdańsk", danzig: "Gdańsk",
  lodz: "Łódź",
  munich: "München", munchen: "München", muenchen: "München", monachium: "München",
  cologne: "Köln", koln: "Köln", koeln: "Köln", kolonia: "Köln",
  nuremberg: "Nürnberg", nurnberg: "Nürnberg", nuernberg: "Nürnberg", norymberga: "Nürnberg",
};

/**
 * Normalize user/admin/enrichment input before it is written, so filters and
 * cards stay consistent: valid upper-case code, canonical country name,
 * trimmed city with local names for Polish/German cities.
 */
export function normalizeLocation(input: { country?: string | null; countryCode?: string | null; city?: string | null }) {
  const explicit = (input.countryCode ?? "").trim().toUpperCase();
  const fromName = resolveCountryCode(input.country ?? "");
  // A recognised country name wins over a code that does not match it (e.g. "Germany" + "GE").
  const countryCode = fromName || (/^[A-Z]{2}$/.test(explicit) ? explicit : "");
  const country = countryCode ? countryNameForCode(countryCode) : (input.country ?? "").trim();
  const rawCity = (input.city ?? "").trim().replace(/\s+/g, " ");
  const city = countryCode === "PL" || countryCode === "DE" ? CITY_CANONICAL[nameKey(rawCity)] ?? rawCity : rawCity;
  return { country, countryCode, city };
}

/**
 * Apply normalizeLocation to a partial update. Only fields that are present
 * are written back (country + countryCode always together).
 */
export function normalizeLocationPatch<T extends { country?: string | null; countryCode?: string | null; city?: string | null }>(patch: T): T {
  const hasCountry = patch.country !== undefined || patch.countryCode !== undefined;
  if (!hasCountry && patch.city === undefined) return patch;
  if (!hasCountry) return { ...patch, city: (patch.city ?? "").trim().replace(/\s+/g, " ") };
  const n = normalizeLocation(patch);
  const out = { ...patch, country: n.country, countryCode: n.countryCode } as T;
  if (patch.city !== undefined) (out as { city?: string }).city = n.city;
  return out;
}
