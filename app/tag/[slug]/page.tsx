import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/lib/site";
import { buildMetadata, breadcrumbJsonLd, escapeJsonLd } from "@/lib/seo";
import { getPostsByTag, getAllTags } from "@/lib/queries";
import Breadcrumbs from "@/components/Breadcrumbs";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  const tags = await getAllTags().catch(() => []);
  return tags.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { page: raw } = await searchParams;
  const page = Math.max(1, Number(raw) || 1);
  const { tag, total } = await getPostsByTag(slug, 1, 1).catch(() => ({ tag: null, total: 0 }));
  if (!tag) {
    return buildMetadata({ title: "Tag not found", description: "Tag not found.", path: `/tag/${slug}`, noindex: true });
  }
  // Thin tag pages (<3 posts) are noindexed to protect crawl budget.
  const noindex = total < 3 || page > 1;
  return buildMetadata({
    title: `#${tag.name} — LLM articles`,
    description: tag.description || `All ${site.name} articles tagged ${tag.name}.`,
    path: page > 1 ? `/tag/${slug}?page=${page}` : `/tag/${slug}`,
    noindex,
  });
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: raw } = await searchParams;
  const page = Math.max(1, Number(raw) || 1);

  const { posts, total, tag } = await getPostsByTag(slug, page);
  if (!tag) notFound();

  const totalPages = Math.max(1, Math.ceil(total / site.postsPerPage));
  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: `#${tag.name}`, path: `/tag/${slug}` },
  ]);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(crumbs) }} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: `#${tag.name}`, href: `/tag/${slug}` }]} />
      <h1 className="text-4xl font-bold">#{tag.name}</h1>
      {tag.description && <p className="mt-3 max-w-2xl text-[var(--muted)]">{tag.description}</p>}
      <p className="mt-2 text-sm text-[var(--muted)]">
        {total} {total === 1 ? "article" : "articles"}
        {page > 1 ? ` · Page ${page} of ${totalPages}` : ""}
      </p>

      {posts.length ? (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} basePath={`/tag/${slug}`} />
        </>
      ) : (
        <p className="mt-8 text-[var(--muted)]">No published articles with this tag yet.</p>
      )}
    </div>
  );
}
