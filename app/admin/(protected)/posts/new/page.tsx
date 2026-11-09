import type { Metadata } from "next";
import PostEditor from "@/components/admin/PostEditor";
import { getAllAuthors, getAllCategories, getAllTags } from "@/lib/queries";

export const metadata: Metadata = {
  title: "New post",
  robots: { index: false, follow: false },
};

export default async function NewPostPage() {
  const [authors, categories, tags] = await Promise.all([
    getAllAuthors().catch(() => []),
    getAllCategories().catch(() => []),
    getAllTags().catch(() => []),
  ]);

  const initial = {
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    status: "draft" as const,
    authorId: authors[0]?.id ?? 1,
    categoryId: (categories[0]?.id ?? null) as number | null,
    tagIds: [] as number[],
    featuredImageUrl: "",
    featuredImageAlt: "",
    featured: false,
    scheduledAt: "",
    metaTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    ogImage: "",
    focusKeyword: "",
    faqJson: "[]",
    allowAds: true,
    noindex: false,
  };

  return (
    <PostEditor
      initial={initial}
      categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
      tags={tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug }))}
      authors={authors.map((a) => ({ id: a.id, name: a.name }))}
      revalidateSlug=""
    />
  );
}
