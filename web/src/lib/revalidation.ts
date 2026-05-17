import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function revalidateEntity(
  entityType: "ROASTER" | "CAFE",
  entityId: string,
): Promise<void> {
  if (entityType === "ROASTER") {
    const roaster = await db.roaster.findUnique({
      where: { id: entityId },
      select: { slug: true },
    });
    if (roaster?.slug) revalidatePath(`/roasters/${roaster.slug}`);
    revalidatePath("/roasters");
    revalidatePath("/admin/roasters");
    revalidatePath(`/admin/roasters/${entityId}`);
    revalidatePath("/dashboard/roaster");
  } else {
    const cafe = await db.cafe.findUnique({
      where: { id: entityId },
      select: { slug: true },
    });
    if (cafe?.slug) revalidatePath(`/cafes/${cafe.slug}`);
    revalidatePath("/cafes");
    revalidatePath("/admin/cafes");
    revalidatePath(`/admin/cafes/${entityId}`);
    revalidatePath("/dashboard/cafe");
  }
  revalidatePath("/");
  revalidatePath("/map");
}
