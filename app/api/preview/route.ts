import { renderMarkdown } from "@/lib/markdown";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * POST { markdown } → { html }
 * Admin-only live preview (session required).
 */
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const md = typeof (body as { markdown?: unknown })?.markdown === "string"
    ? (body as { markdown: string }).markdown
    : "";
  if (!md) return Response.json({ html: "" });
  if (md.length > 200000) return Response.json({ error: "Too large" }, { status: 413 });

  const html = await renderMarkdown(md);
  return Response.json({ html });
}
