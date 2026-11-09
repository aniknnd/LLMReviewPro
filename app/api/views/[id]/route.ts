import { incrementView } from "@/lib/queries";

export const runtime = "nodejs";

/**
 * POST /api/views/:id — privacy-friendly view ping (sendBeacon).
 * No IP stored; aggregated per-day in post_views + denormalized counter.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const postId = parseInt(id, 10);
  if (Number.isNaN(postId) || postId <= 0) {
    return new Response("bad id", { status: 400 });
  }
  await incrementView(postId);
  return new Response(null, { status: 204 });
}

// Allow HEAD/GET preflights to succeed silently without counting.
export async function GET() {
  return new Response(null, { status: 204 });
}
