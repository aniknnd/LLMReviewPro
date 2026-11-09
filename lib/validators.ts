/**
 * Zod validation schemas for all server actions / route handlers.
 * Every mutation validates input on the server before touching the DB.
 */
import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email.").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export type LoginInput = z.infer<typeof loginSchema>;

/* ------------------------------------------------------------------ */
/* Posts                                                               */
/* ------------------------------------------------------------------ */

export const postStatusEnum = z.enum(["draft", "scheduled", "published", "archived"]);

export const postSchema = z.object({
  title: z.string().min(3, "Title is too short.").max(200).trim(),
  slug: z
    .string()
    .min(3, "Slug is too short.")
    .max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase words separated by hyphens.")
    .trim(),
  excerpt: z.string().max(500).trim().default(""),
  content: z.string().min(50, "Content must be at least 50 characters.").max(200000),
  status: postStatusEnum,
  authorId: z.coerce.number().int().positive(),
  categoryId: z.coerce.number().int().positive().optional().nullable(),
  tagIds: z.array(z.coerce.number().int().positive()).max(15).default([]),
  featuredImageUrl: z.string().max(2000).trim().default(""),
  featuredImageAlt: z.string().max(300).trim().default(""),
  featured: z.boolean().default(false),
  publishedAt: z.string().optional().nullable(),
  scheduledAt: z.string().optional().nullable(),
  metaTitle: z.string().max(80).trim().default(""),
  metaDescription: z.string().max(180).trim().default(""),
  canonicalUrl: z.union([z.string().url(), z.literal("")]).default(""),
  ogImage: z.string().max(2000).trim().default(""),
  focusKeyword: z.string().max(120).trim().default(""),
  faqJson: z.string().max(20000).default("[]"),
  allowAds: z.boolean().default(true),
  noindex: z.boolean().default(false),
});

export type PostInput = z.infer<typeof postSchema>;

/* ------------------------------------------------------------------ */
/* Taxonomy & authors                                                  */
/* ------------------------------------------------------------------ */

export const categorySchema = z.object({
  name: z.string().min(2).max(100).trim(),
  slug: z.string().min(2).max(150).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(1000).trim().default(""),
  parentId: z.coerce.number().int().positive().optional().nullable(),
  seoTitle: z.string().max(80).trim().default(""),
  seoDescription: z.string().max(180).trim().default(""),
});

export const tagSchema = z.object({
  name: z.string().min(1).max(80).trim(),
  slug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().max(500).trim().default(""),
});

export const authorSchema = z.object({
  name: z.string().min(2).max(120).trim(),
  slug: z.string().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().max(120).trim().default("Contributor"),
  bio: z.string().max(1000).trim().default(""),
  bioMd: z.string().max(5000).trim().default(""),
  avatarUrl: z.union([z.string().url(), z.literal("")]).default(""),
  twitter: z.string().max(200).trim().default(""),
  github: z.string().max(200).trim().default(""),
  linkedin: z.string().max(200).trim().default(""),
  website: z.union([z.string().url(), z.literal("")]).default(""),
  expertise: z.string().max(500).trim().default(""),
  credentials: z.string().max(500).trim().default(""),
});

/* ------------------------------------------------------------------ */
/* Pages & contact                                                     */
/* ------------------------------------------------------------------ */

export const pageSchema = z.object({
  slug: z.string().min(2).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(2).max(150).trim(),
  content: z.string().min(20, "Content is too short.").max(100000),
  metaTitle: z.string().max(80).trim().default(""),
  metaDescription: z.string().max(180).trim().default(""),
});

export const contactSchema = z.object({
  name: z.string().min(2, "Name is required.").max(120).trim(),
  email: z.string().email("Please enter a valid email.").trim(),
  subject: z.string().max(200).trim().default(""),
  message: z.string().min(10, "Message must be at least 10 characters.").max(5000).trim(),
  // Honeypot (hidden field) — bots fill it, humans don't.
  company: z.string().max(200).optional().default(""),
});

export type ContactInput = z.infer<typeof contactSchema>;

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

export const mediaMetaSchema = z.object({
  alt: z.string().max(300).trim().default(""),
  filename: z.string().min(1).max(255).trim(),
});
