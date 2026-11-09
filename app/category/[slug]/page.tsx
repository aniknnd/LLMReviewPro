import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "@/lib/site";
import { buildMetadata, breadcrumbJsonLd, escapeJsonLd } from "@/lib/seo";
import { getPostsByCategory, getAllCategories } from "@/lib/queries";
import Breadcrumbs from "@/components/Breadcrumbs";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import AdSlot from "@/components/AdSlot";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  const cats = await getAllCategories().catch(() => []);
  return cats.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { page: raw } = await searchParams;
  const page = Math.max(1, Number(raw) || 1);
  const { category, total } = await getPostsByCategory(slug, 1, 1).catch(() => ({ category: null, total: 0 }));
  if (!category) {
    return buildMetadata({ title: "Category not found", description: "Category not found.", path: `/category/${slug}`, noindex: true });
  }
  const noindex = total < 3 || page > 1;
  return buildMetadata({
    title: category.seoTitle || `${category.name} articles`,
    description:
      category.seoDescription ||
      category.description ||
      `${category.name} articles on ${site.name}.`,
    path: page > 1 ? `/category/${slug}?page=${page}` : `/category/${slug}`,
    noindex,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: raw } = await searchParams;
  const page = Math.max(1, Number(raw) || 1);

  const { posts, total, category } = await getPostsByCategory(slug, page);
  if (!category) notFound();

  const totalPages = Math.max(1, Math.ceil(total / site.postsPerPage));
  const thin = total < 3;

  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: category.name, path: `/category/${slug}` },
  ]);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(crumbs) }} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: category.name, href: `/category/${slug}` }]} />
      <h1 className="text-4xl font-bold">{category.name}</h1>
      {category.description && <p className="mt-3 max-w-2xl text-[var(--muted)]">{category.description}</p>}
      <p className="mt-2 text-sm text-[var(--muted)]">
        {total} {total === 1 ? "article" : "articles"}
        {page > 1 ? ` · Page ${page} of ${totalPages}` : ""}
      </p>

      {posts.length ? (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <div key={post.slug}>
                <PostCard post={post} />
                {i === 2 && !thin && (
                  <div className="mt-6">
                    <AdSlot slot="6666666666" format="horizontal" label="Advertisement" minHeight={90} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} basePath={`/category/${slug}`} />
        </>
      ) : (
        <p className="mt-8 text-[var(--muted)]">No published articles in this category yet.</p>
      )}
    </div>
  );
}
