"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, tags, authors } from "@/lib/schema";
import { categorySchema, tagSchema, authorSchema } from "@/lib/validators";
import { verifySession } from "@/lib/dal";
import { slugOrFallback } from "@/lib/utils";

export async function saveCategory(input: {
  name: string;
  description: string;
  seoTitle?: string;
  slug?: string;
  id?: number;
}) {
  await verifySession();
  const slug = slugOrFallback(input.slug || input.name, "category");
  const parsed = categorySchema.safeParse({
    name: input.name,
    slug,
    description: input.description || "",
    seoTitle: input.seoTitle || "",
    seoDescription: "",
  });
  if (!parsed.success) redirect("/admin/categories?error=invalid");

  const now = new Date().toISOString();
  if (input.id) {
    await db
      .update(categories)
      .set({
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
        seoTitle: parsed.data.seoTitle,
        seoDescription: parsed.data.seoDescription,
        updatedAt: now,
      })
      .where(eq(categories.id, input.id));
  } else {
    await db
      .insert(categories)
      .values({
        name: parsed.data.name,
        slug: parsed.data.slug,
        description: parsed.data.description,
        seoTitle: parsed.data.seoTitle,
        seoDescription: parsed.data.seoDescription,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();
  }
  revalidatePath("/");
  revalidatePath("/blog");
  redirect("/admin/categories");
}

export async function deleteCategory(id: number) {
  await verifySession();
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/");
  redirect("/admin/categories");
}

export async function saveTag(input: { name: string; description?: string; slug?: string }) {
  await verifySession();
  const slug = slugOrFallback(input.slug || input.name, "tag");
  const parsed = tagSchema.safeParse({ name: input.name, slug, description: input.description || "" });
  if (!parsed.success) redirect("/admin/tags?error=invalid");
  await db
    .insert(tags)
    .values({ name: parsed.data.name, slug: parsed.data.slug, description: parsed.data.description })
    .onConflictDoNothing();
  revalidatePath("/blog");
  redirect("/admin/tags");
}

export async function deleteTag(id: number) {
  await verifySession();
  await db.delete(tags).where(eq(tags.id, id));
  revalidatePath("/blog");
  redirect("/admin/tags");
}

export async function saveAuthor(input: {
  id?: number;
  name: string;
  title: string;
  bio: string;
  bioMd: string;
  avatarUrl: string;
  twitter: string;
  github: string;
  linkedin: string;
  website: string;
  expertise: string;
  credentials: string;
  slug?: string;
}) {
  await verifySession();
  const slug = slugOrFallback(input.slug || input.name, "author");
  const parsed = authorSchema.safeParse({
    name: input.name,
    slug,
    title: input.title,
    bio: input.bio,
    bioMd: input.bioMd,
    avatarUrl: input.avatarUrl || "",
    twitter: input.twitter,
    github: input.github,
    linkedin: input.linkedin,
    website: input.website || "",
    expertise: input.expertise,
    credentials: input.credentials,
  });
  if (!parsed.success) redirect("/admin/authors?error=invalid");

  const now = new Date().toISOString();
  if (input.id) {
    await db
      .update(authors)
      .set({ ...parsed.data, updatedAt: now })
      .where(eq(authors.id, input.id));
  } else {
    await db
      .insert(authors)
      .values({ ...parsed.data, createdAt: now, updatedAt: now })
      .onConflictDoNothing();
  }
  revalidatePath("/");
  revalidatePath("/about");
  redirect("/admin/authors");
}

export async function deleteAuthor(id: number) {
  await verifySession();
  // FK restrict prevents deletion when posts reference this author.
  await db.delete(authors).where(eq(authors.id, id)).catch(() => {});
  revalidatePath("/");
  redirect("/admin/authors");
}
