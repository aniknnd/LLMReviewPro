import { revalidatePath, revalidateTag } from "next/cache";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * POST /api/revalidate { slug? } — on-demand ISR invalidation (admin only).
 * Used by external scripts (e.g. after bulk import) and cron hooks.
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({} as { slug?: string }));
  const slug = typeof body.slug === "string" ? body.slug : "";

  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
  if (slug) revalidatePath(`/blog/${slug}`);
  try {
    revalidateTag("posts", "max");
  } catch { /* older Next: ignore */ }

  return Response.json({ ok: true, slug: slug || null });
}
