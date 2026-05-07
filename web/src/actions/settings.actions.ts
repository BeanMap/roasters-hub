"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { type ActionResult } from "@/types/actions";

interface SettingsInput {
  imageMaxTotal: number;
  imageMaxPerUser: number;
  imageMaxPerOwner: number;
  defaultPoolMax: number;
}

export async function updateAppSettings(
  input: SettingsInput,
): Promise<ActionResult> {
  try {
    await requireAdmin();

    await db.appSettings.upsert({
      where: { id: "singleton" },
      update: {
        imageMaxTotal: input.imageMaxTotal,
        imageMaxPerUser: input.imageMaxPerUser,
        imageMaxPerOwner: input.imageMaxPerOwner,
        defaultPoolMax: input.defaultPoolMax,
      },
      create: {
        id: "singleton",
        imageMaxTotal: input.imageMaxTotal,
        imageMaxPerUser: input.imageMaxPerUser,
        imageMaxPerOwner: input.imageMaxPerOwner,
        defaultPoolMax: input.defaultPoolMax,
      },
    });

    revalidatePath("/admin/settings");

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[updateAppSettings]", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}
