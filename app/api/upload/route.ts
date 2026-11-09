import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { media } from "@/lib/schema";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

/**
 * POST multipart { file, alt } → { url, width, height }
 * - Validates MIME + size.
 * - Converts to WebP (quality 80, max 1600w), writes to public/uploads/.
 * - Records row in `media` for the library.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Missing file" }, { status: 400 });
  const alt = String(form.get("alt") || "").slice(0, 300);

  if (!ALLOWED.has(file.type)) {
    return Response.json({ error: `Unsupported type: ${file.type}. Use PNG/JPEG/WebP/GIF.` }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return Response.json({ error: "File too large (max 5 MB)." }, { status: 413 });
  }

  const uploadsDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const safeBase = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "upload";
  const filename = `${safeBase}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}.webp`;
  const outPath = path.join(uploadsDir, filename);
  const url = `/uploads/${filename}`;

  try {
    const input = Buffer.from(await file.arrayBuffer());
    const pipeline = sharp(input, { failOn: "warning" })
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 });
    const meta = await pipeline.metadata();
    await pipeline.toFile(outPath);

    const st = fs.statSync(outPath);
    await db.insert(media).values({
      filename,
      originalName: file.name.slice(0, 255),
      path: `public/uploads/${filename}`,
      url,
      mime: "image/webp",
      size: st.size,
      alt,
      width: meta.width ?? null,
      height: meta.height ?? null,
      uploadedBy: session.userId,
      createdAt: new Date().toISOString(),
    });

    return Response.json({ url, width: meta.width, height: meta.height });
  } catch (e) {
    console.error("[upload]", e);
    return Response.json({ error: "Image processing failed." }, { status: 500 });
  }
}
