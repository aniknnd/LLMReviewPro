import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PostEditor from "@/components/admin/PostEditor";
import { getPostByIdAdmin, getAllAuthors, getAllCategories, getAllTags } from "@/lib/queries";
import { db } from "@/lib/db";
import { revisions } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Edit post",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPostPage({ params }: Props) {
  const { id: raw } = await params;
  const id = Number(raw);
  if (!Number.isFinite(id)) notFound();

  const adminPost = await getPostByIdAdmin(id);
  if (!adminPost) notFound();

  const [authors, categories, tags, revs] = await Promise.all([
    getAllAuthors().catch(() => []),
    getAllCategories().catch(() => []),
    getAllTags().catch(() => []),
    db
      .select()
      .from(revisions)
      .where(eq(revisions.postId, id))
      .orderBy(desc(revisions.createdAt))
      .limit(10)
      .catch(() => []),
  ]);

  const initial = {
    id: adminPost.id,
    title: adminPost.title,
    slug: adminPost.slug,
    excerpt: adminPost.excerpt,
    content: adminPost.content,
    status: adminPost.status as "draft" | "scheduled" | "published" | "archived",
    authorId: adminPost.authorId,
    categoryId: adminPost.categoryId,
    tagIds: adminPost.tagIds ?? [],
    featuredImageUrl: adminPost.featuredImageUrl,
    featuredImageAlt: adminPost.featuredImageAlt,
    featured: Boolean(adminPost.featured),
    scheduledAt: adminPost.scheduledAt ?? "",
    metaTitle: adminPost.metaTitle,
    metaDescription: adminPost.metaDescription,
    canonicalUrl: adminPost.canonicalUrl,
    ogImage: adminPost.ogImage,
    focusKeyword: adminPost.focusKeyword,
    faqJson: adminPost.faqJson,
    allowAds: Boolean(adminPost.allowAds),
    noindex: Boolean(adminPost.noindex),
  };

  return (
    <div className="space-y-8">
      <PostEditor
        initial={initial}
        categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
        tags={tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug }))}
        authors={authors.map((a) => ({ id: a.id, name: a.name }))}
        revalidateSlug={adminPost.slug}
      />

      <section aria-labelledby="rev-heading" className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
        <h2 id="rev-heading" className="font-bold">
          Revision history ({revs.length})
        </h2>
        <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
          {revs.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <span>
                <strong>{r.title || "(untitled)"}</strong> —{" "}
                <span className="text-[var(--muted)]">{r.excerpt?.slice(0, 80)}</span>
              </span>
              <time className="text-xs text-[var(--muted)]" dateTime={r.createdAt}>
                {formatDate(r.createdAt)}
              </time>
            </li>
          ))}
          {!revs.length && <li className="py-3 text-[var(--muted)]">No revisions yet. Save to create a snapshot.</li>}
        </ul>
        <p className="mt-3 text-xs text-[var(--muted)]">
          Revisions snapshot title/content/excerpt on every save (last 25 kept).{" "}
          <Link href="/admin/backup" className="text-[var(--accent)] hover:underline">
            Full backup →
          </Link>
        </p>
      </section>
    </div>
  );
}
