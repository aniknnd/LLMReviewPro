/**
 * Central site configuration, sourced from environment variables.
 * All reads are lazy (getters) so `next build` doesn't fail without env
 * when the DB is empty — sensible production defaults are used.
 */

function cleanUrl(u: string | undefined, fallback: string): string {
  const v = (u || fallback).trim();
  return v.endsWith("/") ? v.slice(0, -1) : v;
}

export const site = {
  get name() {
    return process.env.NEXT_PUBLIC_SITE_NAME || "LLM Review Pro";
  },
  get tagline() {
    return (
      process.env.NEXT_PUBLIC_SITE_TAGLINE ||
      "Large Language Model news, reviews, comparisons, and tutorials"
    );
  },
  get url() {
    return cleanUrl(
      process.env.NEXT_PUBLIC_SITE_URL,
      "http://localhost:3000",
    );
  },
  get description() {
    return (
      process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
      "Daily coverage of LLMs: model releases, feature deep-dives, side-by-side comparisons, and practical tutorials for developers. Tested, benchmarked, and written for humans."
    );
  },
  get locale() {
    return "en_US";
  },
  get twitterHandle() {
    return process.env.NEXT_PUBLIC_TWITTER_HANDLE || "@llmreviewpro";
  },
  get defaultOgImage() {
    return `${this.url}/og-default.png`;
  },
  get rssUrl() {
    return `${this.url}/feed.xml`;
  },
  get authorFallback() {
    return "Editorial Team";
  },
  /** Ads / AdSense flags */
  get adsEnabled() {
    return (process.env.NEXT_PUBLIC_ADS_ENABLED || "true") === "true";
  },
  get adsensePublisherId() {
    return process.env.NEXT_PUBLIC_ADSENSE_PUB_ID || "";
  },
  get adsenseVerification() {
    return process.env.NEXT_PUBLIC_ADSENSE_VERIFICATION || "";
  },
  get googleCmpEnabled() {
    // Set to your CMP script URL (e.g. Funding Choices / Osano / custom).
    // When empty, the built-in first-party consent banner is used.
    return process.env.NEXT_PUBLIC_GOOGLE_CMP_URL || "";
  },
  /** Google Analytics 4 measurement ID (e.g. G-XXXXXXXXXX). Empty = disabled. */
  get gaId() {
    return process.env.NEXT_PUBLIC_GA_ID || "";
  },
  /** Build-time helpers */
  get adminEmail() {
    return process.env.ADMIN_EMAIL || "admin@example.com";
  },
  get postsPerPage() {
    const n = parseInt(process.env.POSTS_PER_PAGE || "9", 10);
    return Number.isFinite(n) && n > 0 ? Math.min(n, 50) : 9;
  },
};

/** Precompute absolute url helper. */
export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${site.url}${p}`;
}
