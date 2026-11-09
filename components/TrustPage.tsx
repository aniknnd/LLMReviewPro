import Link from "next/link";
import { getPageBySlug } from "@/lib/queries";
import { renderMarkdown } from "@/lib/markdown";
import Breadcrumbs from "./Breadcrumbs";
import { breadcrumbJsonLd, escapeJsonLd } from "@/lib/seo";
import { formatDate } from "@/lib/utils";

interface Props {
  slug: string;
  title: string;
  path: string;
}

/**
 * Shared trust-page renderer (Privacy, Terms, etc.).
 * Content is editable in the admin (/admin/pages) and cached as HTML.
 * Shows “Last updated” when available (trust signal for AdSense).
 */
export default async function TrustPage({ slug, title, path }: Props) {
  const page = await getPageBySlug(slug).catch(() => null);
  const html = page?.contentHtml || (page ? await renderMarkdown(page.content) : "");

  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: title, path },
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(crumbs) }} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: title, href: path }]} />
      <h1 className="text-4xl font-bold">{page?.title || title}</h1>
      {page && (
        <p className="mt-2 text-sm text-[var(--muted)]">
          Last updated <time dateTime={page.updatedAt}>{formatDate(page.updatedAt)}</time>
        </p>
      )}
      {html ? (
        <div className="prose-llm mt-6" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <p className="prose-llm mt-6">Content coming soon. Please check back later.</p>
      )}
      <div className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 text-sm">
        <p className="font-semibold">Questions about this page?</p>
        <p className="mt-1 text-[var(--muted)]">
          <Link href="/contact" className="text-[var(--accent)] hover:underline">
            Contact us →
          </Link>{" "}
          ·{" "}
          <Link href="/about" className="text-[var(--accent)] hover:underline">
            About us
          </Link>
        </p>
      </div>
    </div>
  );
}
