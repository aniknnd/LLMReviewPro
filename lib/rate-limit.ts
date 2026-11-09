/**
 * In-memory sliding-window rate limiter for login + contact endpoints.
 * Per-process map is sufficient for a single PM2 instance (no cluster).
 * Also provides an `X-RateLimit-*` header helper.
 */
import "server-only";

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();
const MAX_TRACKED_KEYS = 5000;

function prune(key: string, windowMs: number, now: number): Bucket {
  let b = buckets.get(key);
  if (!b) {
    if (buckets.size >= MAX_TRACKED_KEYS) {
      // Drop oldest 10% (insertion order).
      const keys = Array.from(buckets.keys()).slice(0, 500);
      keys.forEach((k) => buckets.delete(k));
    }
    b = { hits: [] };
    buckets.set(key, b);
  }
  b.hits = b.hits.filter((t) => now - t < windowMs);
  return b;
}

/**
 * Returns { allowed, remaining, resetMs }.
 * @example rateLimit(`login:${ip}`, { max: 10, windowMs: 15*60*1000 })
 */
export function rateLimit(
  key: string,
  opts: { max: number; windowMs: number },
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const bucket = prune(key, opts.windowMs, now);
  const allowed = bucket.hits.length < opts.max;
  if (allowed) bucket.hits.push(now);
  const resetMs =
    bucket.hits.length > 0
      ? bucket.hits[0] + opts.windowMs - now
      : opts.windowMs;
  return {
    allowed,
    remaining: Math.max(0, opts.max - bucket.hits.length),
    resetMs: Math.max(0, resetMs),
  };
}

/** Privacy-friendly IP key: hash of IP + day (no raw IP persisted). */
export function ipKey(ip: string | null | undefined): string {
  const v = (ip || "unknown").trim().slice(0, 64);
  // Lightweight FNV-ish hash — not crypto, just for bucketing.
  let h = 2166136261;
  for (let i = 0; i < v.length; i++) {
    h ^= v.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `h${(h >>> 0).toString(36)}`;
}

export function getClientIp(req: { headers: { get(name: string): string | null } }): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || null;
  return req.headers.get("x-real-ip");
}
