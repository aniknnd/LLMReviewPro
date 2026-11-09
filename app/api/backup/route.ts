import { getSession } from "@/lib/auth";
import { rawDb } from "@/lib/db";
import fs from "node:fs";
import path from "node:path";

export const runtime = "nodejs";

/**
 * GET /api/backup — admin-only DB download.
 * Creates a fresh VACUUM INTO copy, streams it, then removes the temp file.
 */
export async function GET() {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const tmpDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "backups", "tmp");
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const tmpFile = path.join(tmpDir, `blog-download-${stamp}.db`);

  rawDb.prepare(`VACUUM INTO '${tmpFile.replace(/'/g, "''")}'`).run();

  const data = fs.readFileSync(tmpFile);
  // Cleanup is best-effort (don't block the response).
  setTimeout(() => {
    try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
  }, 5000);

  return new Response(data, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="blog-${stamp}.db"`,
      "Cache-Control": "no-store",
    },
  });
}
