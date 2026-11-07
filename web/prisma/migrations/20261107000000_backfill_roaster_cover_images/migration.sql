-- Backfill MISSING roaster cover images from the seed data (data-only, idempotent).
--
-- On 2026-11-07 this was done by hand on production. It is recorded here so
-- the data history lives in the repository and every fresh database (CI,
-- local, a restored backup) ends up in the same state.
--
-- Values: `imageUrl` of SEED_ROASTERS in prisma/seed.ts (generated, 55 rows).
-- Only roasters whose coverImageUrl is empty AND that have no uploaded images
-- are touched. A photo set by an owner or admin is never overwritten, no other
-- column changes, nothing is deleted. Re-running is a no-op.

UPDATE "roasters" AS r
SET "coverImageUrl" = v.url, "updatedAt" = NOW()
FROM (VALUES
  ('onyx-coffee-lab', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop'),
  ('tim-wendelboe', 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=600&fit=crop'),
  ('square-mile-coffee', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop'),
  ('hard-beans-opole', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&auto=format&fit=crop'),
  ('gardelli-specialty', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&h=600&fit=crop'),
  ('assembly-coffee', 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&h=600&fit=crop'),
  ('hayb-coffee', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop'),
  ('coffee-proficiency', 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&auto=format&fit=crop'),
  ('the-nordic-roast', 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800&h=600&fit=crop'),
  ('dark-matter-labs', 'https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=800&h=600&fit=crop'),
  ('flora-and-fauna', 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&h=600&fit=crop'),
  ('sey-coffee', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=600&fit=crop'),
  ('the-barn-berlin', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop'),
  ('five-elephant', 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800&h=600&fit=crop'),
  ('bonanza-coffee', 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&h=600&fit=crop'),
  ('19grams-coffee', 'https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=800&auto=format&fit=crop'),
  ('java-coffee-roasters', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop'),
  ('etno-cafe', 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=600&fit=crop'),
  ('story-coffee-roasters', 'https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=800&h=600&fit=crop'),
  ('coffeelab-warszawa', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop'),
  ('milo-coffee-roasters', 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&h=600&fit=crop'),
  ('sheep-and-raven', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&h=600&fit=crop'),
  ('la-cabra', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop'),
  ('coffee-collective', 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=600&fit=crop'),
  ('april-coffee', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop'),
  ('drop-coffee', 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800&h=600&fit=crop'),
  ('koppi-helsingborg', 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&h=600&fit=crop'),
  ('dak-coffee', 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800&auto=format&fit=crop'),
  ('friedhats-coffee', 'https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=800&h=600&fit=crop'),
  ('larbre-a-cafe', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop'),
  ('cafe-lomi', 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&auto=format&fit=crop'),
  ('mazelab-coffee', 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&h=600&fit=crop'),
  ('origin-coffee', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=600&fit=crop'),
  ('workshop-coffee', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&h=600&fit=crop'),
  ('utopian-coffee', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop'),
  ('counter-culture', 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=600&fit=crop'),
  ('intelligentsia-coffee', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop'),
  ('stumptown-coffee', 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800&h=600&fit=crop'),
  ('phil-and-sebastian', 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&h=600&fit=crop'),
  ('market-lane-coffee', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop'),
  ('tobys-estate', 'https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=800&h=600&fit=crop'),
  ('kurasu-kyoto', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&h=600&fit=crop'),
  ('fuglen-coffee', 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&h=600&fit=crop'),
  ('takamura-coffee', 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800&h=600&fit=crop'),
  ('garden-of-coffee', 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800&auto=format&fit=crop'),
  ('tomoca-coffee', 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&h=600&fit=crop'),
  ('vava-coffee', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop'),
  ('connect-coffee', 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=600&fit=crop'),
  ('ocoffee-brazil', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop'),
  ('academia-do-cafe', 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800&h=600&fit=crop'),
  ('fika-coffee-roasters', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=600&fit=crop'),
  ('monsooned-coffee', 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&h=600&fit=crop'),
  ('proper-order-coffee', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop'),
  ('white-rose-coffee', 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800&h=600&fit=crop'),
  ('kaffeeform-roasters', 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?w=800&h=600&fit=crop')
) AS v(slug, url)
WHERE r."slug" = v.slug
  AND (r."coverImageUrl" IS NULL OR TRIM(r."coverImageUrl") = '')
  AND NOT EXISTS (SELECT 1 FROM "images" i WHERE i."roasterId" = r."id");
