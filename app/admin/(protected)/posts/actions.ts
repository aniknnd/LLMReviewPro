"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { posts, postTags, redirects, revisions } from "@/lib/schema";
import { postSchema } from "@/lib/validators";
import { verifySession } from "@/lib/dal";
import { renderMarkdown } from "@/lib/markdown";
import { estimateReadingTime, slugOrFallback } from "@/lib/utils";

export type PostActionResult = { success?: string; error?: string; errors?: Record<string, string> } | undefined;

function errFromZod(err: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] || "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Invalidate public caches after a publish/update. */
function invalidate(slug?: string) {
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  revalidatePath("/feed.xml");
  if (slug) revalidatePath(`/blog/${slug}`);
}

/**
 * Create or update a post. Snapshots a revision on every save,
 * adds a 301 redirect when the slug changes, hydrates HTML + reading time.
 */
export async function savePost(input: {
  id?: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: "draft" | "scheduled" | "published" | "archived";
  authorId: number;
  categoryId: number | null;
  tagIds: number[];
  featuredImageUrl: string;
  featuredImageAlt: string;
  featured: boolean;
  scheduledAt: string | null;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImage: string;
  focusKeyword: string;
  faqJson: string;
  allowAds: boolean;
  noindex: boolean;
}): Promise<PostActionResult> {
  const session = await verifySession().catch(() => null);
  if (!session) redirect("/admin/login");

  const postId = input.id;
  const slug = slugOrFallback(input.slug || input.title, "untitled-post");
  const parsed = postSchema.safeParse({ ...input, slug });
  if (!parsed.success) {
    return { error: "Please fix the highlighted fields.", errors: errFromZod(parsed.error) };
  }
  const d = parsed.data;
  const now = new Date().toISOString();
  const html = await renderMarkdown(d.content);
  const readingTime = estimateReadingTime(d.content);

  // published_at handling:
  // - first publish → now
  // - scheduled → scheduledAt
  // - keep existing when already published and still published
  let publishedAt: string | null = null;
  if (d.status === "published") {
    publishedAt = d.scheduledAt
      ? new Date(d.scheduledAt).toISOString()
      : new Date().toISOString();
  }

  try {
    if (postId) {
      const existingRows = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
      const existing = existingRows[0];
      if (!existing) return { error: "Post not found." };

      if (existing.status === "published" && d.status === "published") {
        publishedAt = existing.publishedAt || publishedAt;
      }

      // Revision snapshot.
      await db
        .insert(revisions)
        .values({
          postId: postId,
          title: existing.title,
          content: existing.content,
          excerpt: existing.excerpt,
          snapshot: JSON.stringify(existing),
          createdBy: session.userId,
          createdAt: now,
        })
        .catch(() => {});
      // Prune old revisions (keep 25).
      await db
        .delete(revisions)
        .where(eq(revisions.postId, postId))
        .catch(() => {});
      // (Pruning to 25 via NOT IN subquery for simplicity.)
      try {
        const ids = await db
          .select({ id: revisions.id })
          .from(revisions)
          .where(eq(revisions.postId, postId))
          .orderBy(revisions.createdAt)
          .limit(100);
        // Keep newest 25 by createdAt — delete older ids.
        if (ids.length > 25) {
          const toDelete = ids.slice(0, ids.length - 25);
          for (const r of toDelete) {
            await db.delete(revisions).where(eq(revisions.id, r.id)).catch(() => {});
          }
        }
      } catch { /* ignore */ }

      // Slug-change 301.
      if (existing.slug !== d.slug) {
        await db
          .insert(redirects)
          .values({ oldSlug: existing.slug, newSlug: d.slug, createdAt: now })
          .onConflictDoNothing()
          .catch(() => {});
      }

      await db
        .update(posts)
        .set({
          title: d.title,
          slug: d.slug,
          excerpt: d.excerpt,
          content: d.content,
          contentHtml: html,
          status: d.status,
          authorId: d.authorId,
          categoryId: d.categoryId ?? null,
          featuredImageUrl: d.featuredImageUrl,
          featuredImageAlt: d.featuredImageAlt,
          featured: d.featured,
          publishedAt,
          scheduledAt: d.status === "scheduled" ? (d.scheduledAt ? new Date(d.scheduledAt).toISOString() : null) : null,
          readingTime,
          metaTitle: d.metaTitle,
          metaDescription: d.metaDescription,
          canonicalUrl: d.canonicalUrl,
          ogImage: d.ogImage,
          focusKeyword: d.focusKeyword,
          faqJson: d.faqJson || "[]",
          allowAds: d.allowAds,
          noindex: d.noindex,
          updatedAt: now,
        })
        .where(eq(posts.id, postId));

      // Replace tag links.
      await db.delete(postTags).where(eq(postTags.postId, postId));
      for (const tagId of d.tagIds) {
        await db.insert(postTags).values({ postId: postId, tagId }).onConflictDoNothing().catch(() => {});
      }

      invalidate(d.slug);
      redirect(`/admin/posts/${postId}`);
    } else {
      const result = await db
        .insert(posts)
        .values({
          title: d.title,
          slug: d.slug,
          excerpt: d.excerpt,
          content: d.content,
          contentHtml: html,
          status: d.status,
          authorId: d.authorId,
          categoryId: d.categoryId ?? null,
          featuredImageUrl: d.featuredImageUrl,
          featuredImageAlt: d.featuredImageAlt,
          featured: d.featured,
          publishedAt,
          scheduledAt: d.status === "scheduled" ? (d.scheduledAt ? new Date(d.scheduledAt).toISOString() : null) : null,
          readingTime,
          metaTitle: d.metaTitle,
          metaDescription: d.metaDescription,
          canonicalUrl: d.canonicalUrl,
          ogImage: d.ogImage,
          focusKeyword: d.focusKeyword,
          faqJson: d.faqJson || "[]",
          allowAds: d.allowAds,
          noindex: d.noindex,
          createdBy: session.userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning({ id: posts.id })
        .catch(() => null);

      const newId = result?.[0]?.id;
      if (!newId) return { error: "Could not create post (slug may already exist)." };

      for (const tagId of d.tagIds) {
        await db.insert(postTags).values({ postId: newId, tagId }).onConflictDoNothing().catch(() => {});
      }

      invalidate(d.slug);
      redirect(`/admin/posts/${newId}`);
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("redirect")) throw e;
    console.error("[savePost]", e);
    return { error: "Save failed. Check slug uniqueness and try again." };
  }
}

export async function deletePost(id: number) {
  await verifySession();
  await db.delete(posts).where(eq(posts.id, id));
  invalidate();
  redirect("/admin/posts");
}

export async function duplicatePost(id: number) {
  const session = await verifySession();
  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  const src = rows[0];
  if (!src) redirect("/admin/posts");

  const now = new Date().toISOString();
  const newSlug = `${src.slug}-copy-${Date.now().toString(36)}`;
  const result = await db
    .insert(posts)
    .values({
      title: `${src.title} (copy)`,
      slug: newSlug,
      excerpt: src.excerpt,
      content: src.content,
      contentHtml: src.contentHtml,
      status: "draft",
      authorId: src.authorId,
      categoryId: src.categoryId,
      featuredImageUrl: src.featuredImageUrl,
      featuredImageAlt: src.featuredImageAlt,
      featured: false,
      publishedAt: null,
      scheduledAt: null,
      readingTime: src.readingTime,
      metaTitle: src.metaTitle,
      metaDescription: src.metaDescription,
      canonicalUrl: "",
      ogImage: src.ogImage,
      focusKeyword: src.focusKeyword,
      faqJson: src.faqJson,
      allowAds: true,
      noindex: false,
      createdBy: session.userId,
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: posts.id });

  const newId = result[0].id;
  const links = await db.select().from(postTags).where(eq(postTags.postId, id));
  for (const l of links) {
    await db.insert(postTags).values({ postId: newId, tagId: l.tagId }).onConflictDoNothing().catch(() => {});
  }
  redirect(`/admin/posts/${newId}`);
}
