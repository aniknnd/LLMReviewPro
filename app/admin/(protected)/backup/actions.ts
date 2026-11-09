"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { rawDb } from "@/lib/db";
import fs from "node:fs";
import path from "node:path";

export async function runBackup() {
  await verifySession();
  const backupDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "backups");
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const out = path.join(backupDir, `blog-${stamp}.db`);
  // VACUUM INTO is atomic + WAL-safe.
  rawDb.prepare(`VACUUM INTO '${out.replace(/'/g, "''")}'`).run();
  revalidatePath("/admin/backup");
  redirect("/admin/backup");
}
