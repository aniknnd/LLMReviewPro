import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getAllPublishedSlugs, getAllCategories, getAllTags, getAllAuthors } from "@/lib/queries";

/**
 * Dynamic sitemap.xml with lastmod.
 * Includes: home, blog index, posts, categories, tags (only if >=3 posts? we
 * list all but thin tags can be noindexed via metadata), authors,
 * trust pages, archive, search is excluded (noindex). Admin excluded.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, categories, tags, authors] = await Promise.all([
    getAllPublishedSlugs().catch(() => []),
    getAllCategories().catch(() => []),
    getAllTags().catch(() => []),
    getAllAuthors().catch(() => []),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: site.url, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/blog`, changeFrequency: "daily", priority: 0.9 },
    { url: `${site.url}/archive`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${site.url}/about`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${site.url}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${site.url}/privacy-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site.url}/terms-of-service`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site.url}/disclaimer`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site.url}/cookie-policy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${site.url}/editorial-policy`, changeFrequency: "yearly", priority: 0.4 },
  ];

  const postRoutes: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${site.url}/blog/${p.slug}`,
    lastModified: new Date(p.updatedAt || p.publishedAt || new Date()),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const catRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${site.url}/category/${c.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const tagRoutes: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${site.url}/tag/${t.slug}`,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  const authorRoutes: MetadataRoute.Sitemap = authors.map((a) => ({
    url: `${site.url}/author/${a.slug}`,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticRoutes, ...postRoutes, ...catRoutes, ...tagRoutes, ...authorRoutes];
}
