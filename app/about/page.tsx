import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { buildMetadata, breadcrumbJsonLd, escapeJsonLd } from "@/lib/seo";
import { getPageBySlug, getAllAuthors } from "@/lib/queries";
import { renderMarkdown } from "@/lib/markdown";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("about").catch(() => null);
  return buildMetadata({
    title: page?.metaTitle || "About",
    description: page?.metaDescription || `About ${site.name}: editorial process, team, and standards.`,
    path: "/about",
  });
}

export default async function AboutPage() {
  const [page, authors] = await Promise.all([
    getPageBySlug("about").catch(() => null),
    getAllAuthors().catch(() => []),
  ]);
  const html = page?.contentHtml || (page ? await renderMarkdown(page.content) : "");

  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(crumbs) }} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "About", href: "/about" }]} />
      <h1 className="text-4xl font-bold">{page?.title || "About"}</h1>

      {html ? (
        <div className="prose-llm mt-6" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <div className="prose-llm mt-6">
          <p>
            {site.name} is an independent publication covering large language
            models — releases, features, benchmarks, and tutorials — with
            disclosed methodology and reproducible tests.
          </p>
        </div>
      )}

      {authors.length > 0 && (
        <section aria-labelledby="team-heading" className="mt-12">
          <h2 id="team-heading" className="text-2xl font-bold">
            Our team
          </h2>
          <ul className="mt-4 space-y-3">
            {authors.map((a) => (
              <li key={a.slug}>
                <Link href={`/author/${a.slug}`} className="font-semibold hover:text-[var(--accent)]">
                  {a.name}
                </Link>{" "}
                <span className="text-[var(--muted)]">— {a.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10">
        <Link href="/contact" className="font-medium text-[var(--accent)] hover:underline">
          Contact the team →
        </Link>
      </p>
    </div>
  );
}
