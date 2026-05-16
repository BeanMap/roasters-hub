import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { validateApiKey, isErrorResponse } from "@/lib/api-auth";

/**
 * GET /api/v1/roasters/:slug
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const auth = await validateApiKey(request);
  if (isErrorResponse(auth)) return auth;

  const { slug } = await params;

  const roaster = await db.roaster.findUnique({
    where: { slug, status: "VERIFIED" },
    select: {
      slug: true,
      name: true,
      city: true,
      country: true,
      countryCode: true,
      description: true,
      website: true,
      email: true,
      instagram: true,
      shopUrl: true,
      certifications: true,
      origins: true,
      roastStyles: true,
      lat: true,
      lng: true,
      verifiedAt: true,
      images: {
        select: { url: true, alt: true, sortOrder: true, isPrimary: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!roaster) {
    return NextResponse.json({ error: "Roaster not found" }, { status: 404 });
  }

  return NextResponse.json({ data: roaster });
}
