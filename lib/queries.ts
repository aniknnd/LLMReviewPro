/**
 * All database queries (DAL read layer).
 * Every post read enforces `status = 'published'` AND `publishedAt <= now`
 * so drafts/scheduled posts never leak to the public site or sitemap.
 *
 * Uses better-sqlite3 sync API inside async wrappers for Next.js RSC.
 */
import "server-only";
import { db } from "./db";
import {
  authors,
  categories,
  contactMessages,
  media,
  pages,
  postTags,
  posts,
  redirects,
  settings,
  tags,
  postViews,
} from "./schema";
import { asc, desc, eq, gte, inArray, like, lte, or, and, sql } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/* Post DTOs                                                           */
/* ------------------------------------------------------------------ */

export interface PostWithRelations {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  contentHtml: string;
  status: string;
  publishedAt: string | null;
  updatedAt: string;
  scheduledAt: string | null;
  viewCount: number;
  readingTime: number;
  featuredImageUrl: string;
  featuredImageAlt: string;
  featured: boolean;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImage: string;
  focusKeyword: string;
  faqJson: string;
  allowAds: boolean;
  noindex: boolean;
  author: { id: number; slug: string; name: string; title: string; avatarUrl: string };
  category: { id: number; slug: string; name: string } | null;
  tags: Array<{ id: number; slug: string; name: string }>;
}

function isPublishedRow(row: { publishedAt: string | null; status: string }): boolean {
  if (row.status !== "published") return false;
  if (!row.publishedAt) return false;
  return new Date(row.publishedAt).getTime() <= Date.now();
}

/* ------------------------------------------------------------------ */
/* Public post reads                                                   */
/* ------------------------------------------------------------------ */

export async function getPublishedPostBySlug(
  slug: string,
): Promise<PostWithRelations | null> {
  const rows = await db
    .select()
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);
  const post = rows[0];
  if (!post || !isPublishedRow(post)) return null;

  const [authorRows, catRows, tagRows] = await Promise.all([
    db
      .select()
      .from(authors)
      .where(eq(authors.id, post.authorId))
      .limit(1),
    post.categoryId
      ? db.select().from(categories).where(eq(categories.id, post.categoryId)).limit(1)
      : Promise.resolve([] as typeof categories.$inferSelect[]),
    db
      .select({ tag: tags })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, post.id)),
  ]);

  const author = authorRows[0];
  if (!author) return null;

  return {
    ...post,
    featured: Boolean(post.featured),
    allowAds: Boolean(post.allowAds),
    noindex: Boolean(post.noindex),
    author: {
      id: author.id,
      slug: author.slug,
      name: author.name,
      title: author.title,
      avatarUrl: author.avatarUrl,
    },
    category: catRows[0]
      ? { id: catRows[0].id, slug: catRows[0].slug, name: catRows[0].name }
      : null,
    tags: tagRows.map((r) => ({ id: r.tag.id, slug: r.tag.slug, name: r.tag.name })),
  };
}

export async function getLatestPosts(limit = 20): Promise<PostWithRelations[]> {
  const rows = await db
    .select()
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.publishedAt))
    .limit(limit * 2);
  const published = rows.filter(isPublishedRow).slice(0, limit);
  return hydratePosts(published);
}

export async function getFeaturedPost(): Promise<PostWithRelations | null> {
  const rows = await db
    .select()
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(desc(posts.featured), desc(posts.publishedAt))
    .limit(10);
  const featured = rows.filter(isPublishedRow).find((r) => r.featured) || rows.filter(isPublishedRow)[0];
  if (!featured) return null;
  const [hydrated] = await hydratePosts([featured]);
  return hydrated ?? null;
}

export async function getPostsByCategory(
  categorySlug: string,
  page = 1,
  perPage = 9,
): Promise<{ posts: PostWithRelations[]; total: number; category: typeof categories.$inferSelect | null }> {
  const catRows = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, categorySlug))
    .limit(1);
  const category = catRows[0] ?? null;
  if (!category) return { posts: [], total: 0, category: null };

  const countRows = await db
    .select({ n: sql<number>`count(*)` })
    .from(posts)
    .where(and(eq(posts.categoryId, category.id), eq(posts.status, "published")));
  const total = Number(countRows[0]?.n ?? 0);

  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.categoryId, category.id), eq(posts.status, "published")))
    .orderBy(desc(posts.publishedAt))
    .limit(perPage)
    .offset((page - 1) * perPage);
  const published = rows.filter(isPublishedRow);
  return { posts: await hydratePosts(published), total, category };
}

export async function getPostsByTag(
  tagSlug: string,
  page = 1,
  perPage = 9,
): Promise<{ posts: PostWithRelations[]; total: number; tag: typeof tags.$inferSelect | null }> {
  const tagRows = await db.select().from(tags).where(eq(tags.slug, tagSlug)).limit(1);
  const tag = tagRows[0] ?? null;
  if (!tag) return { posts: [], total: 0, tag: null };

  const linkRows = await db
    .select({ postId: postTags.postId })
    .from(postTags)
    .where(eq(postTags.tagId, tag.id));
  const ids = linkRows.map((r) => r.postId);
  if (!ids.length) return { posts: [], total: 0, tag };

  const countRows = await db
    .select({ n: sql<number>`count(*)` })
    .from(posts)
    .where(and(inArray(posts.id, ids), eq(posts.status, "published")));
  const total = Number(countRows[0]?.n ?? 0);

  const rows = await db
    .select()
    .from(posts)
    .where(and(inArray(posts.id, ids), eq(posts.status, "published")))
    .orderBy(desc(posts.publishedAt))
    .limit(perPage)
    .offset((page - 1) * perPage);
  return { posts: await hydratePosts(rows.filter(isPublishedRow)), total, tag };
}

export async function getPostsByAuthor(
  authorSlug: string,
  page = 1,
  perPage = 9,
): Promise<{
  posts: PostWithRelations[];
  total: number;
  author: typeof authors.$inferSelect | null;
}> {
  const aRows = await db.select().from(authors).where(eq(authors.slug, authorSlug)).limit(1);
  const author = aRows[0] ?? null;
  if (!author) return { posts: [], total: 0, author: null };

  const countRows = await db
    .select({ n: sql<number>`count(*)` })
    .from(posts)
    .where(and(eq(posts.authorId, author.id), eq(posts.status, "published")));
  const total = Number(countRows[0]?.n ?? 0);

  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.authorId, author.id), eq(posts.status, "published")))
    .orderBy(desc(posts.publishedAt))
    .limit(perPage)
    .offset((page - 1) * perPage);
  return { posts: await hydratePosts(rows.filter(isPublishedRow)), total, author };
}

export async function getAllPublishedSlugs(): Promise<
  Array<{ slug: string; updatedAt: string; publishedAt: string | null }>
> {
  const rows = await db
    .select({
      slug: posts.slug,
      updatedAt: posts.updatedAt,
      publishedAt: posts.publishedAt,
      status: posts.status,
    })
    .from(posts)
    .where(eq(posts.status, "published"));
  return rows.filter((r) => r.publishedAt && new Date(r.publishedAt).getTime() <= Date.now());
}

/** Full-text search over title, excerpt, content (LIKE with escaping). */
export async function searchPosts(
  query: string,
  page = 1,
  perPage = 12,
): Promise<{ posts: PostWithRelations[]; total: number }> {
  const q = query.trim();
  if (!q) return { posts: [], total: 0 };
  const pattern = `%${q.replace(/[%_\\]/g, "\\$&")}%`;

  const whereClause = or(
    like(posts.title, pattern),
    like(posts.excerpt, pattern),
    like(posts.content, pattern),
  );

  const countRows = await db
    .select({ n: sql<number>`count(*)` })
    .from(posts)
    .where(and(eq(posts.status, "published"), whereClause));
  const total = Number(countRows[0]?.n ?? 0);

  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.status, "published"), whereClause))
    .orderBy(desc(posts.publishedAt))
    .limit(perPage)
    .offset((page - 1) * perPage);

  return { posts: await hydratePosts(rows.filter(isPublishedRow)), total };
}

/** Related posts by category + tags (excludes self). */
export async function getRelatedPosts(
  current: PostWithRelations,
  limit = 4,
): Promise<PostWithRelations[]> {
  const candidates = new Map<number, typeof posts.$inferSelect>();

  if (current.category) {
    const rows = await db
      .select()
      .from(posts)
      .where(and(eq(posts.categoryId, current.category.id), eq(posts.status, "published")))
      .orderBy(desc(posts.publishedAt))
      .limit(limit * 2);
    rows
      .filter((r) => r.id !== current.id && isPublishedRow(r))
      .forEach((r) => candidates.set(r.id, r));
  }

  if (current.tags.length) {
    const tagIds = current.tags.map((t) => t.id);
    const links = await db
      .select({ postId: postTags.postId })
      .from(postTags)
      .where(inArray(postTags.tagId, tagIds));
    const ids = [...new Set(links.map((l) => l.postId))].filter((id) => id !== current.id);
    if (ids.length) {
      const rows = await db
        .select()
        .from(posts)
        .where(and(inArray(posts.id, ids), eq(posts.status, "published")))
        .orderBy(desc(posts.publishedAt))
        .limit(limit * 2);
      rows
        .filter(isPublishedRow)
        .forEach((r) => candidates.set(r.id, r));
    }
  }

  // Fallback to latest if not enough.
  if (candidates.size < limit) {
    const latest = await getLatestPosts(limit * 2);
    latest
      .filter((p) => p.id !== current.id)
      .slice(0, limit - candidates.size)
      .forEach((p) => {
        if (!candidates.has(p.id)) {
          // hydrate already; push via direct mapping below
        }
      });
    // Merge: return hydrated candidates + latest extras as-is.
    const extra = latest.filter((p) => p.id !== current.id && !candidates.has(p.id)).slice(0, limit - candidates.size);
    const hydrated = await hydratePosts(Array.from(candidates.values()).slice(0, limit));
    return [...hydrated, ...extra].slice(0, limit);
  }

  return hydratePosts(Array.from(candidates.values()).slice(0, limit));
}

export async function getAdjacentPosts(slug: string): Promise<{
  prev: PostWithRelations | null;
  next: PostWithRelations | null;
}> {
  const currentRows = await db.select().from(posts).where(eq(posts.slug, slug)).limit(1);
  const current = currentRows[0];
  if (!current || !current.publishedAt) return { prev: null, next: null };

  const rows = await db
    .select()
    .from(posts)
    .where(eq(posts.status, "published"))
    .orderBy(asc(posts.publishedAt));
  const published = rows.filter(isPublishedRow);
  const idx = published.findIndex((p) => p.slug === slug);
  const prevRow = idx > 0 ? published[idx - 1] : null;
  const nextRow = idx >= 0 && idx < published.length - 1 ? published[idx + 1] : null;
  const [prev, next] = await Promise.all([
    prevRow ? hydratePosts([prevRow]).then((a) => a[0] ?? null) : Promise.resolve(null),
    nextRow ? hydratePosts([nextRow]).then((a) => a[0] ?? null) : Promise.resolve(null),
  ]);
  return { prev, next };
}

/** Archive grouped by YYYY-MM. */
export async function getArchiveGroups(): Promise<
  Array<{ ym: string; posts: PostWithRelations[] }>
> {
  const latest = await getLatestPosts(200);
  const byMonth = new Map<string, PostWithRelations[]>();
  for (const p of latest) {
    const key = (p.publishedAt || p.updatedAt).slice(0, 7);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(p);
  }
  return Array.from(byMonth.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([ym, ps]) => ({
      ym,
      posts: ps.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || "")),
    }));
}

/* ------------------------------------------------------------------ */
/* Redirects                                                           */
/* ------------------------------------------------------------------ */

export async function getRedirectTarget(oldSlug: string): Promise<string | null> {
  const rows = await db
    .select()
    .from(redirects)
    .where(eq(redirects.oldSlug, oldSlug))
    .limit(1);
  return rows[0]?.newSlug ?? null;
}

/* ------------------------------------------------------------------ */
/* Taxonomy reads                                                      */
/* ------------------------------------------------------------------ */

export async function getAllCategories() {
  return db.select().from(categories).orderBy(asc(categories.name));
}

export async function getAllTags() {
  return db.select().from(tags).orderBy(asc(tags.name));
}

export async function getAllAuthors() {
  return db.select().from(authors).orderBy(asc(authors.name));
}

export async function getAuthorBySlug(slug: string) {
  const rows = await db.select().from(authors).where(eq(authors.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getCategoryBySlug(slug: string) {
  const rows = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getTagBySlug(slug: string) {
  const rows = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  return rows[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* Pages                                                               */
/* ------------------------------------------------------------------ */

export async function getPageBySlug(slug: string) {
  const rows = await db.select().from(pages).where(eq(pages.slug, slug)).limit(1);
  return rows[0] ?? null;
}

/* ------------------------------------------------------------------ */
/* Settings (cached in-memory for request lifetime)                    */
/* ------------------------------------------------------------------ */

const settingsCache = new Map<string, string>();

export async function getSetting(key: string): Promise<string> {
  if (settingsCache.has(key)) return settingsCache.get(key)!;
  const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  const v = rows[0]?.value ?? "";
  settingsCache.set(key, v);
  return v;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(settings);
  const out: Record<string, string> = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
}

/* ------------------------------------------------------------------ */
/* Admin reads (include drafts)                                        */
/* ------------------------------------------------------------------ */

export async function getPostByIdAdmin(id: number) {
  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  const post = rows[0];
  if (!post) return null;
  const tagRows = await db
    .select({ tag: tags })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, id));
  return {
    ...post,
    tagIds: tagRows.map((r) => r.tag.id),
    tagSlugs: tagRows.map((r) => r.tag.slug),
  };
}

export async function getAllPostsAdmin(status?: string, page = 1, perPage = 20) {
  const base = db.select().from(posts);
  const filtered =
    status && status !== "all"
      ? base.where(eq(posts.status, status as never))
      : base;
  const countRows = await db
    .select({ n: sql<number>`count(*)` })
    .from(posts)
    .where(status && status !== "all" ? eq(posts.status, status as never) : sql`1=1`);
  const total = Number(countRows[0]?.n ?? 0);
  const rows = await filtered
    .orderBy(desc(posts.updatedAt))
    .limit(perPage)
    .offset((page - 1) * perPage);
  return { rows, total };
}

export async function getDashboardStats() {
  const [totalRows, draftRows, scheduledRows, msgRows, mediaRows] = await Promise.all([
    db.select({ n: sql<number>`count(*)` }).from(posts),
    db
      .select({ n: sql<number>`count(*)` })
      .from(posts)
      .where(eq(posts.status, "draft")),
    db
      .select({ n: sql<number>`count(*)` })
      .from(posts)
      .where(eq(posts.status, "scheduled")),
    db.select({ n: sql<number>`count(*)` }).from(contactMessages).where(eq(contactMessages.isRead, false)),
    db.select({ n: sql<number>`count(*)` }).from(media),
  ]);
  const recent = await db.select().from(posts).orderBy(desc(posts.updatedAt)).limit(5);
  const top = await db
    .select({ slug: posts.slug, title: posts.title, viewCount: posts.viewCount })
    .from(posts)
    .orderBy(desc(posts.viewCount))
    .limit(5);
  return {
    totalPosts: Number(totalRows[0]?.n ?? 0),
    drafts: Number(draftRows[0]?.n ?? 0),
    scheduled: Number(scheduledRows[0]?.n ?? 0),
    unreadMessages: Number(msgRows[0]?.n ?? 0),
    mediaCount: Number(mediaRows[0]?.n ?? 0),
    recent,
    top,
  };
}

/* ------------------------------------------------------------------ */
/* Hydration helper                                                    */
/* ------------------------------------------------------------------ */

async function hydratePosts(
  rows: Array<typeof posts.$inferSelect>,
): Promise<PostWithRelations[]> {
  if (!rows.length) return [];
  const authorIds = [...new Set(rows.map((r) => r.authorId))];
  const catIds = [...new Set(rows.map((r) => r.categoryId).filter(Boolean) as number[])];
  const postIds = rows.map((r) => r.id);

  const [authorRows, catRows, tagRows] = await Promise.all([
    db.select().from(authors).where(inArray(authors.id, authorIds)),
    catIds.length
      ? db.select().from(categories).where(inArray(categories.id, catIds))
      : Promise.resolve([] as typeof categories.$inferSelect[]),
    db
      .select({ postId: postTags.postId, tag: tags })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(inArray(postTags.postId, postIds)),
  ]);

  const authorMap = new Map(authorRows.map((a) => [a.id, a]));
  const catMap = new Map(catRows.map((c) => [c.id, c]));
  const tagsByPost = new Map<number, Array<{ id: number; slug: string; name: string }>>();
  for (const r of tagRows) {
    if (!tagsByPost.has(r.postId)) tagsByPost.set(r.postId, []);
    tagsByPost.get(r.postId)!.push({ id: r.tag.id, slug: r.tag.slug, name: r.tag.name });
  }

  return rows
    .map((r) => {
      const author = authorMap.get(r.authorId);
      if (!author) return null;
      const cat = r.categoryId ? catMap.get(r.categoryId) : null;
      return {
        ...r,
        featured: Boolean(r.featured),
        allowAds: Boolean(r.allowAds),
        noindex: Boolean(r.noindex),
        author: {
          id: author.id,
          slug: author.slug,
          name: author.name,
          title: author.title,
          avatarUrl: author.avatarUrl,
        },
        category: cat ? { id: cat.id, slug: cat.slug, name: cat.name } : null,
        tags: tagsByPost.get(r.id) ?? [],
      } as PostWithRelations;
    })
    .filter((x): x is PostWithRelations => Boolean(x));
}

/* ------------------------------------------------------------------ */
/* View counter (fire-and-forget, daily aggregate)                     */
/* ------------------------------------------------------------------ */

export async function incrementView(postId: number): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  // Best-effort: never throw to the request.
  try {
    await db
      .insert(postViews)
      .values({ postId, date, count: 1 })
      .onConflictDoUpdate({
        target: [postViews.postId, postViews.date],
        set: { count: sql`${postViews.count} + 1` },
      });
    await db
      .update(posts)
      .set({ viewCount: sql`${posts.viewCount} + 1` })
      .where(eq(posts.id, postId));
  } catch {
    // ignore
  }
}

export { gte, lte };
