import type { Metadata } from "next";
import { permanentRedirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  getPublishedPostBySlug,
  getRelatedPosts,
  getAdjacentPosts,
  getRedirectTarget,
  getAllPublishedSlugs,
  incrementView,
} from "@/lib/queries";
import { buildMetadata, articleJsonLd, breadcrumbJsonLd, faqJsonLd, getFaqItems, escapeJsonLd } from "@/lib/seo";
import { parseFaq, extractToc, renderMarkdown } from "@/lib/markdown";
import Breadcrumbs from "@/components/Breadcrumbs";
import TableOfContents from "@/components/TableOfContents";
import ShareButtons from "@/components/ShareButtons";
import PostCard from "@/components/PostCard";
import AdSlot from "@/components/AdSlot";
import ViewTracker from "@/components/ViewTracker";
import { formatDate, readingTimeLabel, truncate } from "@/lib/utils";
import { site } from "@/lib/site";
// Syntax theme only on post pages (keeps home/listing CSS smaller).
import "highlight.js/styles/github-dark.css";

export const revalidate = 86400; // ISR: 1 day; admin updates call revalidatePath.
export const dynamicParams = true; // New posts generate on-demand.

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) {
    return buildMetadata({
      title: "Article not found",
      description: "This article could not be found.",
      path: `/blog/${slug}`,
      noindex: true,
    });
  }

  const title = post.metaTitle || `${post.title} | ${site.name}`;
  const description = post.metaDescription || post.excerpt;
  const canonical = post.canonicalUrl || `/blog/${post.slug}`;

  return buildMetadata({
    title,
    description,
    path: `/blog/${post.slug}`,
    canonical: canonical.startsWith("http") ? canonical : undefined,
    // Prefer the per-post OG route (PNG 1200×630); fall back to the featured cover.
    image: post.ogImage || `/blog/${post.slug}/opengraph-image`,
    type: "article",
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    authors: [post.author.name],
    keywords: [post.focusKeyword, post.category?.name || "", ...post.tags.map((t) => t.name)].filter(Boolean),
    noindex: post.noindex,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  let post = await getPublishedPostBySlug(slug);

  // 301 redirect when slug changed (redirects table).
  if (!post) {
    const target = await getRedirectTarget(slug);
    if (target) permanentRedirect(`/blog/${target}`);
    notFound();
  }

  // Fire-and-forget view increment (non-blocking for TTFB).
  void incrementView(post.id);

  // Favicons + OG images are served via metadata + opengraph-image route.
  // Ensure HTML exists (hydrate on-the-fly if seed didn't run).
  const html = post.contentHtml || (await renderMarkdown(post.content));
  const toc = extractToc(html);
  const faqs = getFaqItems(post.faqJson, post.content, parseFaq);

  const [related, adjacent] = await Promise.all([
    getRelatedPosts(post, 4),
    getAdjacentPosts(post.slug),
  ]);

  const article = articleJsonLd({
    title: post.title,
    description: post.metaDescription || post.excerpt,
    slug: post.slug,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    image: post.ogImage || post.featuredImageUrl,
    authorName: post.author.name,
    authorSlug: post.author.slug,
    authorAvatar: post.author.avatarUrl,
    categoryName: post.category?.name,
    tags: post.tags.map((t) => t.name),
  });

  const crumbs = [
    { name: "Home", path: "/" },
    { name: post.category?.name || "Articles", path: post.category ? `/category/${post.category.slug}` : "/blog" },
    { name: truncate(post.title, 60), path: `/blog/${post.slug}` },
  ];
  const faqLd = faqJsonLd(faqs);

  const showAds = site.adsEnabled && post.allowAds;

  return (
    <article>
      <ViewTracker postId={post.id} />

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(article) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(breadcrumbJsonLd(crumbs)) }} />
      {faqLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(faqLd) }} />}

      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          ...(post.category
            ? [{ name: post.category.name, href: `/category/${post.category.slug}` }]
            : [{ name: "Articles", href: "/blog" }]),
          { name: post.title, href: `/blog/${post.slug}` },
        ]}
      />

      {/* H1 — single, keyword-focused */}
      <header className="max-w-3xl">
        {post.category && (
          <Link
            href={`/category/${post.category.slug}`}
            className="inline-block rounded-full border border-[var(--border)] px-3 py-1 text-xs font-semibold text-[var(--accent)]"
          >
            {post.category.name}
          </Link>
        )}
        <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">{post.title}</h1>
        {post.excerpt && (
          <p className="mt-4 text-lg text-[var(--muted)]">{post.excerpt}</p>
        )}

        {/* Byline */}
        <div className="mt-6 flex flex-wrap items-center gap-4 border-y border-[var(--border)] py-4 text-sm">
          <div className="flex items-center gap-2">
            {post.author.avatarUrl ? (
              <Image
                src={post.author.avatarUrl}
                alt={`${post.author.name} avatar`}
                width={36}
                height={36}
                className="rounded-full"
              />
            ) : (
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--accent)] text-xs font-bold text-white" aria-hidden="true">
                {post.author.name.slice(0, 1)}
              </span>
            )}
            <span>
              By{" "}
              <Link href={`/author/${post.author.slug}`} className="font-semibold hover:text-[var(--accent)]">
                {post.author.name}
              </Link>
              <span className="text-[var(--muted)]"> · {post.author.title}</span>
            </span>
          </div>
          <span className="text-[var(--muted)]">
            Published{" "}
            <time dateTime={post.publishedAt || post.updatedAt}>{formatDate(post.publishedAt || post.updatedAt)}</time>
            {post.updatedAt && post.updatedAt !== post.publishedAt && (
              <>
                {" "}· Updated{" "}
                <time dateTime={post.updatedAt}>{formatDate(post.updatedAt)}</time>
              </>
            )}
          </span>
          <span className="text-[var(--muted)]">{readingTimeLabel(post.readingTime)}</span>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <ShareButtons slug={post.slug} title={post.title} />
          {post.tags.length > 0 && (
            <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
              {post.tags.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/tag/${t.slug}`}
                    className="rounded-full bg-[var(--border)]/50 px-2.5 py-0.5 text-xs hover:bg-[var(--accent)] hover:text-white"
                  >
                    #{t.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {/* Featured image with caption/alt */}
      {post.featuredImageUrl && (
        <figure className="mt-8">
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl">
            <Image
              src={post.featuredImageUrl}
              alt={post.featuredImageAlt || post.title}
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover"
              priority
            />
          </div>
          {post.featuredImageAlt && (
            <figcaption className="mt-2 text-center text-sm text-[var(--muted)]">
              {post.featuredImageAlt}
            </figcaption>
          )}
        </figure>
      )}

      {/* Two-column: content + TOC sidebar */}
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <div className="prose-llm" dangerouslySetInnerHTML={{ __html: html }} />

          {/* FAQ */}
          {faqs.length > 0 && (
            <section aria-labelledby="faq-heading" className="mt-12 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-6">
              <h2 id="faq-heading" className="text-xl font-bold">
                Frequently asked questions
              </h2>
              <dl className="mt-4 space-y-5">
                {faqs.map((f, i) => (
                  <div key={i}>
                    <dt className="font-semibold">{f.question}</dt>
                    <dd className="mt-1.5 text-[var(--muted)]">{f.answer}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* In-article ad (only if allowed) */}
          {showAds && (
            <div className="mt-10">
              <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_ARTICLE || "4444444444"} format="horizontal" label="Advertisement" minHeight={90} />
            </div>
          )}

          {/* Author box (E-E-A-T) */}
          <aside aria-label={`About ${post.author.name}`} className="mt-10 rounded-xl border border-[var(--border)] p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Written by
            </p>
            <div className="mt-3">
              <Link href={`/author/${post.author.slug}`} className="text-lg font-bold hover:text-[var(--accent)]">
                {post.author.name}
              </Link>
              <p className="text-sm text-[var(--muted)]">{post.author.title}</p>
              <Link
                href={`/author/${post.author.slug}`}
                className="mt-3 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
              >
                More from {post.author.name} →
              </Link>
            </div>
          </aside>

          {/* Prev / Next */}
          {(adjacent.prev || adjacent.next) && (
            <nav aria-label="More articles" className="mt-10 grid gap-4 sm:grid-cols-2">
              {adjacent.prev ? (
                <Link href={`/blog/${adjacent.prev.slug}`} rel="prev" className="rounded-xl border border-[var(--border)] p-5 hover:border-[var(--accent)]">
                  <p className="text-xs text-[var(--muted)]">← Previous</p>
                  <p className="mt-1 font-semibold">{adjacent.prev.title}</p>
                </Link>
              ) : (
                <span />
              )}
              {adjacent.next && (
                <Link href={`/blog/${adjacent.next.slug}`} rel="next" className="rounded-xl border border-[var(--border)] p-5 text-right hover:border-[var(--accent)]">
                  <p className="text-xs text-[var(--muted)]">Next →</p>
                  <p className="mt-1 font-semibold">{adjacent.next.title}</p>
                </Link>
              )}
            </nav>
          )}
        </div>

        {/* Sidebar: TOC + related + ad */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <TableOfContents items={toc} />
          {showAds && (
            <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_SIDEBAR || "5555555555"} format="rectangle" label="Advertisement" minHeight={250} />
          )}
          <div className="rounded-xl border border-[var(--border)] p-5">
            <h2 className="font-bold">Related reading</h2>
            <ul className="mt-3 space-y-3">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/blog/${r.slug}`} className="block font-medium leading-snug hover:text-[var(--accent)]">
                    {r.title}
                  </Link>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {formatDate(r.publishedAt || r.updatedAt)} · {readingTimeLabel(r.readingTime)}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {/* Bottom related grid */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-16">
          <h2 id="related-heading" className="mb-6 text-2xl font-bold">
            You may also like
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => (
              <PostCard key={r.slug} post={r} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
