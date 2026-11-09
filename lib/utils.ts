/**
 * Small shared helpers: slugs, dates, reading time, HTML escaping.
 * Kept dependency-light for edge/core-web-vitals friendliness.
 */
import slugifyPkg from "slugify";
import readingTime from "reading-time";

/** Keyword-friendly slug: lowercase, hyphens, stripped of accents/specials. */
export function slugify(input: string): string {
  return slugifyPkg(input, {
    lower: true,
    strict: true,
    trim: true,
  }).replace(/-+/g, "-");
}

/** Ensure slug is URL-safe and not empty. */
export function slugOrFallback(input: string, fallback = "post"): string {
  const s = slugify(input).replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, "");
  return s || fallback;
}

/** Parse an ISO string / Date safely. Returns null on invalid. */
export function parseDate(v: string | Date | null | undefined): Date | null {
  if (!v) return null;
  const d = typeof v === "string" ? new Date(v) : v;
  return Number.isNaN(d.getTime()) ? null : d;
}

/** e.g. "Nov 9, 2026" */
export function formatDate(v: string | Date | null | undefined): string {
  const d = parseDate(v as never);
  if (!d) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/** Full ISO for structured data / lastmod. */
export function toIso(v: string | Date | null | undefined): string {
  const d = parseDate(v as never);
  return d ? d.toISOString() : new Date().toISOString();
}

/** Estimate reading time (minutes) from markdown text. */
export function estimateReadingTime(markdown: string): number {
  if (!markdown?.trim()) return 1;
  // reading-time expects plain text; strip code fences for fairness but keep words.
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*>`_\[\]()|]/g, " ");
  const r = readingTime(plain);
  return Math.max(1, Math.round(r.minutes));
}

/** Human "x min read" label. */
export function readingTimeLabel(minutes: number): string {
  return `${minutes} min read`;
}

/** Truncate with ellipsis. */
export function truncate(str: string, max = 160): string {
  if (!str) return "";
  const s = str.trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1).trimEnd()}…`;
}

/** Escape for JSON-LD (Next.js docs recommend replacing "<"). */
export function escapeJsonLd<T>(obj: T): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

/** Strip HTML tags → plain text (for excerpts). */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** "2026-11-09" grouping key for archives. */
export function monthKey(v: string | Date | null | undefined): string {
  const d = parseDate(v as never);
  if (!d) return "unknown";
  return d.toISOString().slice(0, 7); // YYYY-MM
}

/** "November 2026" */
export function monthLabel(ym: string): string {
  if (!/^\d{4}-\d{2}$/.test(ym)) return ym;
  const [y, m] = ym.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

/** className joiner (no tailwind-merge needed for this app). */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/** Validate image alt coverage in markdown (for SEO checklist). */
export function countImagesWithoutAlt(markdown: string): number {
  if (!markdown) return 0;
  const matches = markdown.match(/!\[[^\]]*\]\([^)]+\)/g) || [];
  return matches.filter((m) => /^!\[\s*\]/.test(m)).length;
}

/** Count internal links (/blog/...) in markdown. */
export function countInternalLinks(markdown: string): number {
  if (!markdown) return 0;
  const matches = markdown.match(/\[[^\]]+\]\((\/blog\/[^)]+)\)/g) || [];
  return matches.length;
}

/** Count words (rough). */
export function wordCount(markdown: string): number {
  if (!markdown) return 0;
  return markdown.trim().split(/\s+/).filter(Boolean).length;
}
