import { site } from "@/lib/site";
import { getLatestPosts } from "@/lib/queries";

export const revalidate = 3600;

/**
 * RSS 2.0 feed (also serves Atom via content negotiation note).
 * Route: GET /feed.xml
 */
export async function GET() {
  const posts = await getLatestPosts(30).catch(() => []);
  const now = new Date().toUTCString();

  const items = posts
    .map((p) => {
      const link = `${site.url}/blog/${p.slug}`;
      const pubDate = new Date(p.publishedAt || p.updatedAt).toUTCString();
      const category = p.category ? `\n    <category>${escapeXml(p.category.name)}</category>` : "";
      const tags = p.tags.map((t) => `\n    <category>${escapeXml(t.name)}</category>`).join("");
      const enclosure = p.featuredImageUrl
        ? `\n    <enclosure url="${escapeXml(p.featuredImageUrl.startsWith("http") ? p.featuredImageUrl : site.url + p.featuredImageUrl)}" length="0" type="image/jpeg"/>`
        : "";
      return `  <item>
    <title>${escapeXml(p.title)}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <pubDate>${pubDate}</pubDate>
    <author>${escapeXml(p.author.name)}</author>
    <description>${escapeXml(p.excerpt)}</description>
    <content:encoded><![CDATA[${p.contentHtml || ""}]]></content:encoded>${category}${tags}${enclosure}
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(site.name)}</title>
    <link>${site.url}</link>
    <description>${escapeXml(site.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link xmlns:atom="http://www.w3.org/2005/Atom" href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
