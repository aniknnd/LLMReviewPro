import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { buildMetadata, breadcrumbJsonLd, escapeJsonLd } from "@/lib/seo";
import { getArchiveGroups } from "@/lib/queries";
import { monthLabel, formatDate } from "@/lib/utils";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Archive",
    description: `Browse every ${site.name} article by month.`,
    path: "/archive",
    keywords: ["LLM archive", "AI article archive", "blog archive"],
  });
}

export default async function ArchivePage() {
  const groups = await getArchiveGroups();
  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Archive", path: "/archive" },
  ]);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(crumbs) }} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Archive", href: "/archive" }]} />
      <h1 className="text-4xl font-bold">Archive</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        Every published article, grouped by month.
      </p>

      {groups.length === 0 ? (
        <p className="mt-8 text-[var(--muted)]">
          No archived articles yet.{" "}
          <Link href="/blog" className="text-[var(--accent)] hover:underline">
            See latest →
          </Link>
        </p>
      ) : (
        <div className="mt-8 space-y-12">
          {groups.map((g) => (
            <section key={g.ym} aria-labelledby={`m-${g.ym}`}>
              <h2 id={`m-${g.ym}`} className="text-2xl font-bold">
                {monthLabel(g.ym)}
                <span className="ml-2 text-base font-normal text-[var(--muted)]">
                  ({g.posts.length})
                </span>
              </h2>
              <ul className="mt-4 divide-y divide-[var(--border)] border-y border-[var(--border)]">
                {g.posts.map((p) => (
                  <li key={p.slug} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-baseline sm:gap-4">
                    <time
                      dateTime={p.publishedAt || p.updatedAt}
                      className="shrink-0 text-sm text-[var(--muted)]"
                    >
                      {formatDate(p.publishedAt || p.updatedAt)}
                    </time>
                    <Link href={`/blog/${p.slug}`} className="font-medium hover:text-[var(--accent)]">
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
