"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { settings } from "@/lib/schema";
import { verifySession } from "@/lib/dal";

export async function saveSetting(key: string, value: string) {
  await verifySession();
  const k = key.trim().slice(0, 100);
  if (!k) return;
  const v = value.trim().slice(0, 5000);
  const now = new Date().toISOString();
  await db
    .insert(settings)
    .values({ key: k, value: v, updatedAt: now })
    .onConflictDoUpdate({ target: settings.key, set: { value: v, updatedAt: now } });
  revalidatePath("/admin/settings");
}
