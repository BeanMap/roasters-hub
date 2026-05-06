"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { type ActionResult } from "@/types/actions";

export async function toggleMarketingConsent(
  value: boolean,
): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    await db.userProfile.upsert({
      where: { id: userId },
      update: { marketingConsent: value },
      create: { id: userId, email: "", marketingConsent: value },
    });

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[toggleMarketingConsent]", error);
    return {
      success: false,
      error: "Something went wrong",
    };
  }
}
