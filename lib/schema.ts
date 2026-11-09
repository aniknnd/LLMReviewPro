/**
 * Drizzle ORM schema for LLMReviewPro.
 *
 * SQLite via better-sqlite3. Timestamps are stored as TEXT (ISO 8601 UTC).
 * Plain SQL migrations live in `migrations/001_init.sql` and are applied
 * by `scripts/migrate.mjs`. This file is the typed source of truth used
 * by Drizzle queries for type safety and IntelliSense.
 *
 * Design notes:
 * - Posts store Markdown in `content`; `contentHtml` is a render cache for fast TTFB.
 * - `redirects` powers automatic 301s when a post slug changes.
 * - `postViews` is aggregated per day (privacy-friendly, no IP stored).
 * - `revisions` snapshots post fields on every save (last 25 per post).
 */
import {
  integer,
  sqliteTable,
  text,
  real,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

// SQLite default: UTC now. Plain SQL migrations define defaults too.
const nowDefault = sql`datetime('now')`;

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull().default("Admin"),
  role: text("role", { enum: ["admin", "editor"] })
    .notNull()
    .default("admin"),
  createdAt: text("created_at")
    .notNull()
    .default(nowDefault),
  updatedAt: text("updated_at")
    .notNull()
    .default(nowDefault),
});

/* ------------------------------------------------------------------ */
/* Authors (E-E-A-T)                                                   */
/* ------------------------------------------------------------------ */

export const authors = sqliteTable("authors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  title: text("title").notNull().default("Contributor"),
  bio: text("bio").notNull().default(""),
  bioMd: text("bio_md").notNull().default(""),
  avatarUrl: text("avatar_url").notNull().default(""),
  twitter: text("twitter").notNull().default(""),
  github: text("github").notNull().default(""),
  linkedin: text("linkedin").notNull().default(""),
  website: text("website").notNull().default(""),
  expertise: text("expertise").notNull().default(""),
  credentials: text("credentials").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(nowDefault),
  updatedAt: text("updated_at")
    .notNull()
    .default(nowDefault),
});

/* ------------------------------------------------------------------ */
/* Categories & Tags                                                   */
/* ------------------------------------------------------------------ */

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  // FK to categories.id enforced in SQL migration (self-ref breaks TS inference).
  parentId: integer("parent_id"),
  seoTitle: text("seo_title").notNull().default(""),
  seoDescription: text("seo_description").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(nowDefault),
  updatedAt: text("updated_at")
    .notNull()
    .default(nowDefault),
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  createdAt: text("created_at")
    .notNull()
    .default(nowDefault),
});

/* ------------------------------------------------------------------ */
/* Posts                                                               */
/* ------------------------------------------------------------------ */

export type PostStatus = "draft" | "scheduled" | "published" | "archived";

export const posts = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull().default(""),
  content: text("content").notNull().default(""),
  contentHtml: text("content_html").notNull().default(""),
  status: text("status", {
    enum: ["draft", "scheduled", "published", "archived"],
  })
    .notNull()
    .default("draft"),
  authorId: integer("author_id")
    .notNull()
    .references(() => authors.id, { onDelete: "restrict" }),
  categoryId: integer("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  featuredImageUrl: text("featured_image_url").notNull().default(""),
  featuredImageAlt: text("featured_image_alt").notNull().default(""),
  featured: integer("featured", { mode: "boolean" })
    .notNull()
    .default(false),
  publishedAt: text("published_at"),
  scheduledAt: text("scheduled_at"),
  viewCount: integer("view_count").notNull().default(0),
  readingTime: integer("reading_time").notNull().default(3),
  metaTitle: text("meta_title").notNull().default(""),
  metaDescription: text("meta_description").notNull().default(""),
  canonicalUrl: text("canonical_url").notNull().default(""),
  ogImage: text("og_image").notNull().default(""),
  focusKeyword: text("focus_keyword").notNull().default(""),
  faqJson: text("faq_json").notNull().default("[]"),
  allowAds: integer("allow_ads", { mode: "boolean" })
    .notNull()
    .default(true),
  noindex: integer("noindex", { mode: "boolean" })
    .notNull()
    .default(false),
  createdBy: integer("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at")
    .notNull()
    .default(nowDefault),
  updatedAt: text("updated_at")
    .notNull()
    .default(nowDefault),
});

export const postTags = sqliteTable("post_tags", {
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
  // composite primary key enforced in SQL migration (Drizzle: define PK via .primaryKey)
});

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

export const media = sqliteTable("media", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull().default(""),
  path: text("path").notNull(),
  url: text("url").notNull(),
  mime: text("mime").notNull().default(""),
  size: integer("size").notNull().default(0),
  alt: text("alt").notNull().default(""),
  width: integer("width"),
  height: integer("height"),
  uploadedBy: integer("uploaded_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at")
    .notNull()
    .default(nowDefault),
});

/* ------------------------------------------------------------------ */
/* Static pages (trust pages)                                          */
/* ------------------------------------------------------------------ */

export const pages = sqliteTable("pages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  contentHtml: text("content_html").notNull().default(""),
  metaTitle: text("meta_title").notNull().default(""),
  metaDescription: text("meta_description").notNull().default(""),
  updatedAt: text("updated_at")
    .notNull()
    .default(nowDefault),
  createdAt: text("created_at")
    .notNull()
    .default(nowDefault),
});

/* ------------------------------------------------------------------ */
/* Contact messages                                                    */
/* ------------------------------------------------------------------ */

export const contactMessages = sqliteTable("contact_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull().default(""),
  message: text("message").notNull(),
  isRead: integer("is_read", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at")
    .notNull()
    .default(nowDefault),
});

/* ------------------------------------------------------------------ */
/* Post views (privacy-friendly: aggregated per day, no IP)            */
/* ------------------------------------------------------------------ */

export const postViews = sqliteTable("post_views", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  count: integer("count").notNull().default(1),
});

/* ------------------------------------------------------------------ */
/* Revisions                                                           */
/* ------------------------------------------------------------------ */

export const revisions = sqliteTable("revisions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  postId: integer("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  title: text("title").notNull().default(""),
  content: text("content").notNull().default(""),
  excerpt: text("excerpt").notNull().default(""),
  snapshot: text("snapshot").notNull().default("{}"),
  createdBy: integer("created_by").references(() => users.id, {
    onDelete: "set null",
  }),
  createdAt: text("created_at")
    .notNull()
    .default(nowDefault),
});

/* ------------------------------------------------------------------ */
/* Redirects (301 for slug changes)                                    */
/* ------------------------------------------------------------------ */

export const redirects = sqliteTable("redirects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  oldSlug: text("old_slug").notNull().unique(),
  newSlug: text("new_slug").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(nowDefault),
});

/* ------------------------------------------------------------------ */
/* Settings                                                            */
/* ------------------------------------------------------------------ */

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull().default(""),
  updatedAt: text("updated_at")
    .notNull()
    .default(nowDefault),
});

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type User = typeof users.$inferSelect;
export type Author = typeof authors.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type Revision = typeof revisions.$inferSelect;

// numeric helpers used elsewhere
export const _real = real("real_unused"); // placeholder to keep import used in some bundlers
