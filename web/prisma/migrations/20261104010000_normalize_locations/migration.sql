-- Normalize location data on roasters and cafes (data-only, idempotent).
--
-- User-submitted and early seed data mixed country codes ("pl", "", "PL "),
-- country names ("PL", "Polska", "Poland") and city spellings ("Poznan" /
-- "Poznań", "Warsaw" / "Warszawa", "Munich" / "München"). That produced
-- duplicate and empty entries in filters and inconsistent cards.
--
-- Rules:
--   * countryCode: trimmed, upper-case; taken from the country name when the
--     name is recognised (fixes e.g. "Germany" stored with code "GE").
--   * country: one canonical English name per code (as used by the seeds).
--   * city: trimmed; Polish and German cities use their local names
--     (Warszawa, Poznań, München …), other cities are left as stored.
-- Re-running is a no-op. No rows are deleted and no status is changed.

-- ── roasters ──
UPDATE "roasters" SET "countryCode" = UPPER(TRIM("countryCode")) WHERE "countryCode" <> UPPER(TRIM("countryCode"));

UPDATE "roasters" AS r SET "countryCode" = a.code
FROM (VALUES
  ('poland', 'PL'),
  ('polska', 'PL'),
  ('polen', 'PL'),
  ('pl', 'PL'),
  ('germany', 'DE'),
  ('deutschland', 'DE'),
  ('niemcy', 'DE'),
  ('de', 'DE'),
  ('austria', 'AT'),
  ('österreich', 'AT'),
  ('czech republic', 'CZ'),
  ('czechia', 'CZ'),
  ('czechy', 'CZ'),
  ('denmark', 'DK'),
  ('dania', 'DK'),
  ('sweden', 'SE'),
  ('szwecja', 'SE'),
  ('norway', 'NO'),
  ('norwegia', 'NO'),
  ('netherlands', 'NL'),
  ('holandia', 'NL'),
  ('france', 'FR'),
  ('francja', 'FR'),
  ('italy', 'IT'),
  ('włochy', 'IT'),
  ('united kingdom', 'GB'),
  ('uk', 'GB'),
  ('wielka brytania', 'GB'),
  ('united states', 'US'),
  ('usa', 'US'),
  ('japan', 'JP'),
  ('japonia', 'JP'),
  ('brazil', 'BR'),
  ('brazylia', 'BR'),
  ('kenya', 'KE'),
  ('ethiopia', 'ET'),
  ('australia', 'AU'),
  ('canada', 'CA')
) AS a(name, code)
WHERE LOWER(TRIM(r.country)) = a.name AND r."countryCode" IS DISTINCT FROM a.code;

UPDATE "roasters" AS r SET country = c.name
FROM (VALUES
  ('PL', 'Poland'),
  ('DE', 'Germany'),
  ('AT', 'Austria'),
  ('CH', 'Switzerland'),
  ('CZ', 'Czech Republic'),
  ('SK', 'Slovakia'),
  ('DK', 'Denmark'),
  ('SE', 'Sweden'),
  ('NO', 'Norway'),
  ('FI', 'Finland'),
  ('NL', 'Netherlands'),
  ('BE', 'Belgium'),
  ('FR', 'France'),
  ('IT', 'Italy'),
  ('ES', 'Spain'),
  ('PT', 'Portugal'),
  ('GB', 'United Kingdom'),
  ('IE', 'Ireland'),
  ('US', 'United States'),
  ('CA', 'Canada'),
  ('AU', 'Australia'),
  ('NZ', 'New Zealand'),
  ('JP', 'Japan'),
  ('KR', 'South Korea'),
  ('BR', 'Brazil'),
  ('CO', 'Colombia'),
  ('ET', 'Ethiopia'),
  ('KE', 'Kenya'),
  ('RW', 'Rwanda'),
  ('LT', 'Lithuania'),
  ('LV', 'Latvia'),
  ('EE', 'Estonia'),
  ('HU', 'Hungary'),
  ('UA', 'Ukraine')
) AS c(code, name)
WHERE r."countryCode" = c.code AND r.country IS DISTINCT FROM c.name;

UPDATE "roasters" SET city = TRIM(city) WHERE city <> TRIM(city);

UPDATE "roasters" AS r SET city = m.canonical
FROM (VALUES
  ('warsaw', 'Warszawa'),
  ('warszawa', 'Warszawa'),
  ('warschau', 'Warszawa'),
  ('poznan', 'Poznań'),
  ('poznań', 'Poznań'),
  ('posen', 'Poznań'),
  ('krakow', 'Kraków'),
  ('kraków', 'Kraków'),
  ('cracow', 'Kraków'),
  ('krakau', 'Kraków'),
  ('wroclaw', 'Wrocław'),
  ('wrocław', 'Wrocław'),
  ('breslau', 'Wrocław'),
  ('gdansk', 'Gdańsk'),
  ('gdańsk', 'Gdańsk'),
  ('danzig', 'Gdańsk'),
  ('lodz', 'Łódź'),
  ('łódź', 'Łódź'),
  ('łodz', 'Łódź'),
  ('katowice', 'Katowice'),
  ('gdynia', 'Gdynia'),
  ('szczecin', 'Szczecin'),
  ('stettin', 'Szczecin'),
  ('lublin', 'Lublin'),
  ('opole', 'Opole'),
  ('munich', 'München'),
  ('münchen', 'München'),
  ('muenchen', 'München'),
  ('monachium', 'München'),
  ('cologne', 'Köln'),
  ('köln', 'Köln'),
  ('koeln', 'Köln'),
  ('kolonia', 'Köln'),
  ('nuremberg', 'Nürnberg'),
  ('nürnberg', 'Nürnberg'),
  ('nuernberg', 'Nürnberg'),
  ('norymberga', 'Nürnberg'),
  ('berlin', 'Berlin'),
  ('hamburg', 'Hamburg'),
  ('frankfurt', 'Frankfurt am Main'),
  ('frankfurt am main', 'Frankfurt am Main')
) AS m(variant, canonical)
WHERE LOWER(TRIM(r.city)) = m.variant AND r.city <> m.canonical AND r."countryCode" IN ('PL', 'DE');

-- ── cafes ──
UPDATE "cafes" SET "countryCode" = UPPER(TRIM("countryCode")) WHERE "countryCode" <> UPPER(TRIM("countryCode"));

UPDATE "cafes" AS r SET "countryCode" = a.code
FROM (VALUES
  ('poland', 'PL'),
  ('polska', 'PL'),
  ('polen', 'PL'),
  ('pl', 'PL'),
  ('germany', 'DE'),
  ('deutschland', 'DE'),
  ('niemcy', 'DE'),
  ('de', 'DE'),
  ('austria', 'AT'),
  ('österreich', 'AT'),
  ('czech republic', 'CZ'),
  ('czechia', 'CZ'),
  ('czechy', 'CZ'),
  ('denmark', 'DK'),
  ('dania', 'DK'),
  ('sweden', 'SE'),
  ('szwecja', 'SE'),
  ('norway', 'NO'),
  ('norwegia', 'NO'),
  ('netherlands', 'NL'),
  ('holandia', 'NL'),
  ('france', 'FR'),
  ('francja', 'FR'),
  ('italy', 'IT'),
  ('włochy', 'IT'),
  ('united kingdom', 'GB'),
  ('uk', 'GB'),
  ('wielka brytania', 'GB'),
  ('united states', 'US'),
  ('usa', 'US'),
  ('japan', 'JP'),
  ('japonia', 'JP'),
  ('brazil', 'BR'),
  ('brazylia', 'BR'),
  ('kenya', 'KE'),
  ('ethiopia', 'ET'),
  ('australia', 'AU'),
  ('canada', 'CA')
) AS a(name, code)
WHERE LOWER(TRIM(r.country)) = a.name AND r."countryCode" IS DISTINCT FROM a.code;

UPDATE "cafes" AS r SET country = c.name
FROM (VALUES
  ('PL', 'Poland'),
  ('DE', 'Germany'),
  ('AT', 'Austria'),
  ('CH', 'Switzerland'),
  ('CZ', 'Czech Republic'),
  ('SK', 'Slovakia'),
  ('DK', 'Denmark'),
  ('SE', 'Sweden'),
  ('NO', 'Norway'),
  ('FI', 'Finland'),
  ('NL', 'Netherlands'),
  ('BE', 'Belgium'),
  ('FR', 'France'),
  ('IT', 'Italy'),
  ('ES', 'Spain'),
  ('PT', 'Portugal'),
  ('GB', 'United Kingdom'),
  ('IE', 'Ireland'),
  ('US', 'United States'),
  ('CA', 'Canada'),
  ('AU', 'Australia'),
  ('NZ', 'New Zealand'),
  ('JP', 'Japan'),
  ('KR', 'South Korea'),
  ('BR', 'Brazil'),
  ('CO', 'Colombia'),
  ('ET', 'Ethiopia'),
  ('KE', 'Kenya'),
  ('RW', 'Rwanda'),
  ('LT', 'Lithuania'),
  ('LV', 'Latvia'),
  ('EE', 'Estonia'),
  ('HU', 'Hungary'),
  ('UA', 'Ukraine')
) AS c(code, name)
WHERE r."countryCode" = c.code AND r.country IS DISTINCT FROM c.name;

UPDATE "cafes" SET city = TRIM(city) WHERE city <> TRIM(city);

UPDATE "cafes" AS r SET city = m.canonical
FROM (VALUES
  ('warsaw', 'Warszawa'),
  ('warszawa', 'Warszawa'),
  ('warschau', 'Warszawa'),
  ('poznan', 'Poznań'),
  ('poznań', 'Poznań'),
  ('posen', 'Poznań'),
  ('krakow', 'Kraków'),
  ('kraków', 'Kraków'),
  ('cracow', 'Kraków'),
  ('krakau', 'Kraków'),
  ('wroclaw', 'Wrocław'),
  ('wrocław', 'Wrocław'),
  ('breslau', 'Wrocław'),
  ('gdansk', 'Gdańsk'),
  ('gdańsk', 'Gdańsk'),
  ('danzig', 'Gdańsk'),
  ('lodz', 'Łódź'),
  ('łódź', 'Łódź'),
  ('łodz', 'Łódź'),
  ('katowice', 'Katowice'),
  ('gdynia', 'Gdynia'),
  ('szczecin', 'Szczecin'),
  ('stettin', 'Szczecin'),
  ('lublin', 'Lublin'),
  ('opole', 'Opole'),
  ('munich', 'München'),
  ('münchen', 'München'),
  ('muenchen', 'München'),
  ('monachium', 'München'),
  ('cologne', 'Köln'),
  ('köln', 'Köln'),
  ('koeln', 'Köln'),
  ('kolonia', 'Köln'),
  ('nuremberg', 'Nürnberg'),
  ('nürnberg', 'Nürnberg'),
  ('nuernberg', 'Nürnberg'),
  ('norymberga', 'Nürnberg'),
  ('berlin', 'Berlin'),
  ('hamburg', 'Hamburg'),
  ('frankfurt', 'Frankfurt am Main'),
  ('frankfurt am main', 'Frankfurt am Main')
) AS m(variant, canonical)
WHERE LOWER(TRIM(r.city)) = m.variant AND r.city <> m.canonical AND r."countryCode" IN ('PL', 'DE');
