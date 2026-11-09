import type { Metadata } from "next";
import { site } from "@/lib/site";
import { buildMetadata, breadcrumbJsonLd, escapeJsonLd } from "@/lib/seo";
import Breadcrumbs from "@/components/Breadcrumbs";
import ContactForm from "@/components/ContactForm";
import { getPageBySlug } from "@/lib/queries";
import { renderMarkdown } from "@/lib/markdown";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Contact",
    description: `Contact ${site.name} for corrections, press, and feedback.`,
    path: "/contact",
  });
}

export default async function ContactPage() {
  const page = await getPageBySlug("contact").catch(() => null);
  const html = page?.contentHtml || (page ? await renderMarkdown(page.content) : "");
  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Contact", path: "/contact" },
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(crumbs) }} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Contact", href: "/contact" }]} />
      <h1 className="text-4xl font-bold">Contact</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        We read every message. For corrections to benchmarks, include a link and
        your test setup. Typical response time: 1–3 business days.
      </p>
      {html && (
        <div className="prose-llm mt-6" dangerouslySetInnerHTML={{ __html: html }} />
      )}
      <div className="mt-8">
        <ContactForm />
      </div>
      <p className="mt-6 text-sm text-[var(--muted)]">
        Prefer email? <a href={`mailto:${site.name}@${new URL(site.url).hostname}`} className="text-[var(--accent)] hover:underline">{site.name}@{new URL(site.url).hostname}</a>
      </p>
    </div>
  );
}
