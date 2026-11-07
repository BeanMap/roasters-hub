/**
 * The one photo shown on a roaster card: the primary image if set, otherwise
 * the first one by sort order. Previously cards required `isPrimary`, so a
 * roaster whose photos had no primary flag rendered an empty placeholder.
 * Rejected photos are never shown.
 */
export const CARD_IMAGE = {
  where: { status: { not: "REJECTED" as const } },
  orderBy: [{ isPrimary: "desc" as const }, { sortOrder: "asc" as const }],
  take: 1,
};
