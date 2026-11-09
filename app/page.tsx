import type { Metadata } from "next";
import Link from "next/link";
import { site, absoluteUrl } from "@/lib/site";
import { buildMetadata, escapeJsonLd } from "@/lib/seo";
import { getFeaturedPost, getLatestPosts, getAllCategories } from "@/lib/queries";
import PostCard from "@/components/PostCard";
import AdSlot from "@/components/AdSlot";

export const revalidate = 3600; // ISR: 1 hour

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    path: "/",
  });
}

export default async function HomePage() {
  const [featured, latest, categories] = await Promise.all([
    getFeaturedPost(),
    getLatestPosts(12),
    getAllCategories(),
  ]);

  // Split latest into "latest grid" (excluding the featured hero).
  const gridPosts = featured
    ? latest.filter((p) => p.slug !== featured.slug).slice(0, 9)
    : latest.slice(0, 9);

  // Category sections: first 4 categories × 3 posts each.
  const categorySections: Array<{
    slug: string;
    name: string;
    posts: typeof latest;
  }> = [];
  // Lazy-load per-category posts to keep home fast; render first 3 sections.
  // (Queries are indexed; 3 extra queries is fine for TTFB < 200ms.)
  const { getPostsByCategory } = await import("@/lib/queries");
  for (const cat of categories.slice(0, 3)) {
    const { posts } = await getPostsByCategory(cat.slug, 1, 3);
    if (posts.length) categorySections.push({ slug: cat.slug, name: cat.name, posts });
  }

  const collectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: site.name,
    url: absoluteUrl("/"),
    description: site.description,
  };

  return (
    <div className="space-y-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: escapeJsonLd(collectionJsonLd) }}
      />

      {/* Hero / value prop */}
      <section aria-labelledby="home-heading" className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
          Independent LLM coverage
        </p>
        <h1 id="home-heading" className="mx-auto mt-3 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
          LLM news, reviews &amp; benchmarks — tested, not hyped.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--muted)]">
          Daily launches, feature deep-dives, and side-by-side comparisons for
          GPT-5, Claude, Gemini, LLaMA, and what ships next.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/blog"
            className="inline-flex min-h-[44px] items-center rounded-md bg-[var(--accent)] px-5 text-sm font-semibold text-white"
          >
            Browse articles →
          </Link>
          <Link
            href="/category/comparisons"
            className="inline-flex min-h-[44px] items-center rounded-md border border-[var(--border)] px-5 text-sm font-semibold"
          >
            Latest benchmarks
          </Link>
        </div>
      </section>

      {/* Featured */}
      {featured && (
        <section aria-labelledby="featured-heading">
          <h2 id="featured-heading" className="sr-only">
            Featured article
          </h2>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
            Featured
          </p>
          <PostCard post={featured} priority large />
          <div className="mt-6">
            <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_HOME || "1111111111"} format="horizontal" label="Advertisement" minHeight={90} />
          </div>
        </section>
      )}

      {/* Latest */}
      <section aria-labelledby="latest-heading">
        <div className="mb-6 flex items-end justify-between">
          <h2 id="latest-heading" className="text-2xl font-bold">
            Latest articles
          </h2>
          <Link href="/blog" className="text-sm font-medium text-[var(--accent)] hover:underline">
            View all →
          </Link>
        </div>
        {gridPosts.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gridPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <p className="text-[var(--muted)]">
            No articles yet. Check back soon — or{" "}
            <Link href="/about" className="text-[var(--accent)] hover:underline">
              learn about our editorial process
            </Link>
            .
          </p>
        )}
      </section>

      {/* Category sections */}
      {categorySections.map((section) => (
        <section key={section.slug} aria-labelledby={`cat-${section.slug}-heading`}>
          <div className="mb-6 flex items-end justify-between">
            <h2 id={`cat-${section.slug}-heading`} className="text-2xl font-bold">
              {section.name}
            </h2>
            <Link
              href={`/category/${section.slug}`}
              className="text-sm font-medium text-[var(--accent)] hover:underline"
            >
              All {section.name.toLowerCase()} →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {section.posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      ))}

      {/* Newsletter CTA (no popups; passive) */}
      <section aria-labelledby="newsletter-heading" className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-8 text-center">
        <h2 id="newsletter-heading" className="text-xl font-bold">
          Get the daily LLM brief
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-[var(--muted)]">
          One email per day: launches, benchmarks, and one practical tutorial.
          No spam, unsubscribe anytime.
        </p>
        <p className="mt-4">
          <Link href="/contact" className="font-medium text-[var(--accent)] hover:underline">
            Contact us to subscribe →
          </Link>
        </p>
      </section>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_HOME_2 || "2222222222"} format="horizontal" label="Advertisement" minHeight={90} />
    </div>
  );
}
