"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { media } from "@/lib/schema";
import { verifySession } from "@/lib/dal";
import fs from "node:fs";
import path from "node:path";

export async function deleteMedia(id: number) {
  await verifySession();
  const rows = await db.select().from(media).where(eq(media.id, id)).limit(1);
  const item = rows[0];
  if (item?.path) {
    try {
      const full = path.join(/*turbopackIgnore: true*/ process.cwd(), item.path);
      if (fs.existsSync(full)) fs.unlinkSync(full);
    } catch { /* ignore */ }
  }
  await db.delete(media).where(eq(media.id, id));
  redirect("/admin/media");
}
