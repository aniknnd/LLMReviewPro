import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { getLatestPosts } from "@/lib/queries";
import PostCard from "@/components/PostCard";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "404 — Page not found",
    description: "The page you requested could not be found.",
    path: "/404",
    noindex: true,
  });
}

/**
 * Custom 404 with popular posts (no ads on 404 per policy).
 */
export default async function NotFoundPage() {
  const popular = await getLatestPosts(6).catch(() => []);
  const top = popular.slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-7xl font-bold text-[var(--accent)]">404</p>
      <h1 className="mt-4 text-3xl font-bold">Page not found</h1>
      <p className="mt-3 text-[var(--muted)]">
        The URL you visited doesn&apos;t exist (or moved). Try the search, or
        start from a popular article below.
      </p>

      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center rounded-md bg-[var(--accent)] px-5 text-sm font-semibold text-white"
        >
          Go home
        </Link>
      </div>

      {top.length > 0 && (
        <section aria-labelledby="popular-heading" className="mt-12 text-left">
          <h2 id="popular-heading" className="mb-6 text-2xl font-bold">
            Popular articles
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {top.map((p) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
          <p className="mt-6 text-center text-sm">
            <Link href="/blog" className="font-medium text-[var(--accent)] hover:underline">
              Browse all articles →
            </Link>
          </p>
        </section>
      )}
    </div>
  );
}
