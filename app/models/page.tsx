import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { buildMetadata, breadcrumbJsonLd, escapeJsonLd } from "@/lib/seo";
import { MODELS } from "@/lib/models-data";
import { getAllPublishedSlugs } from "@/lib/queries";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 86400;

/**
 * Models index — every real model we curate, oldest → newest,
 * grouped by provider/company. No invented entries.
 * Links point to /blog/<slug> only where a published review exists;
 * new/ historical entries show "No review yet" instead of 404 links.
 */
export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: `All LLM, video & image models (${MODELS.length}) — Oldest to Newest`,
    description: `Complete list of ${MODELS.length} real AI models by provider and company, oldest to newest: GPT, Claude, Gemini, Llama, Mistral, DeepSeek, Qwen, Veo, Kling, and more, with specs and links to hands-on reviews.`,
    path: "/models",
    keywords: ["all LLM models", "list of LLMs", "AI models by company", "GPT Claude Gemini Llama"],
  });
}

export default async function ModelsPage() {
  const slugs = await getAllPublishedSlugs().catch(() => []);
  const reviewed = new Set(slugs.map((s) => s.slug));

  // Flagship reviews use longer slugs — map catalog → published slug.
  const ALIAS: Record<string, string> = {
    "gpt-6-1-sol-review": "gpt-6-1-sol-review-openai-frontier",
    "claude-opus-5-5-review": "claude-opus-5-5-review-agentic-coding",
    "gemini-3-1-pro-review": "gemini-3-1-pro-3-8-flash-review",
    "gemini-3-8-flash-review": "gemini-3-1-pro-3-8-flash-review",
    "llama-4-maverick-review": "llama-4-deepseek-open-weight-review",
    "llama-4-scout-review": "llama-4-deepseek-open-weight-review",
    "deepseek-r1-review": "llama-4-deepseek-open-weight-review",
    "veo-3-1-review": "google-veo-3-1-review-video-audio",
    "kling-3-review": "kling-3-0-review-realistic-humans",
    "runway-gen-4-5-review": "runway-gen-4-5-review-director-control",
  };
  const reviewSlug = (slug: string) => ALIAS[slug] || slug;
  const hasReview = (slug: string) => reviewed.has(reviewSlug(slug));

  // Oldest → newest (YYYY-MM), then name
  const sorted = [...MODELS].sort((a, b) =>
    a.release.localeCompare(b.release) || a.name.localeCompare(b.name),
  );

  const byProvider = new Map<string, typeof MODELS>();
  for (const m of sorted) {
    if (!byProvider.has(m.provider)) byProvider.set(m.provider, []);
    byProvider.get(m.provider)!.push(m);
  }
  const providers = Array.from(byProvider.entries()).sort((a, b) => b[1].length - a[1].length);

  const textCount = MODELS.filter((m) => m.modality === "text").length;
  const videoCount = MODELS.filter((m) => m.modality === "video").length;
  const imageCount = MODELS.filter((m) => m.modality === "image").length;

  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Models", path: "/models" },
  ]);

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(crumbs) }} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Models", href: "/models" }]} />

      <h1 className="text-4xl font-bold">All AI models — oldest to newest</h1>
      <p className="mt-3 max-w-3xl text-[var(--muted)]">
        {MODELS.length} real models by provider and company — {textCount} text LLMs, {videoCount} video, {imageCount} image — from BERT (2018) to GPT-6 (2026). Every entry lists release, context, size, and license. Prices say “check console” where they change often — we do not invent numbers.
      </p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Use <Link href="/search" className="text-[var(--accent)] hover:underline">search</Link> for a model, or jump to a company below. Reviews are linked where we have hands-on tests.
      </p>

      {/* Provider jump links */}
      <nav aria-label="Providers" className="mt-6 flex flex-wrap gap-2">
        {providers.map(([provider, list]) => (
          <a
            key={provider}
            href={`#${provider.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
            className="rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium hover:border-[var(--accent)]"
          >
            {provider} ({list.length})
          </a>
        ))}
      </nav>

      {/* Timeline (oldest → newest) */}
      <section aria-labelledby="timeline-heading" className="mt-10">
        <h2 id="timeline-heading" className="text-2xl font-bold">Timeline — oldest to newest</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="bg-[var(--border)]/40 text-left">
              <tr>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Released</th>
                <th className="px-4 py-3">Context / Length</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">License</th>
                <th className="px-4 py-3 text-right">Review</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {sorted.map((m) => (
                <tr key={m.slug} className="hover:bg-[var(--border)]/30">
                  <td className="px-4 py-3">
                    <span className="font-medium">{m.name}</span>{" "}
                    <span className="text-xs text-[var(--muted)]">({m.family})</span>
                  </td>
                  <td className="px-4 py-3">{m.provider}</td>
                  <td className="px-4 py-3">{m.release}</td>
                  <td className="px-4 py-3">{m.context}</td>
                  <td className="px-4 py-3">{m.params}</td>
                  <td className="px-4 py-3">{m.license}</td>
                  <td className="px-4 py-3 text-right">
                    {hasReview(m.slug) ? (
                      <Link href={`/blog/${reviewSlug(m.slug)}`} className="text-[var(--accent)] hover:underline">
                        Read →
                      </Link>
                    ) : (
                      <span className="text-xs text-[var(--muted)]">No review yet</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Grouped by provider */}
      {providers.map(([provider, list]) => (
        <section key={provider} id={provider.toLowerCase().replace(/[^a-z0-9]+/g, "-")} aria-labelledby={`p-${provider}`} className="mt-12 scroll-mt-28">
          <h2 id={`p-${provider}`} className="text-2xl font-bold">
            {provider} <span className="text-base font-normal text-[var(--muted)]">({list.length} models)</span>
          </h2>
          <ul className="mt-4 space-y-2">
            {list.map((m) => (
              <li key={m.slug} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--card-bg)] px-4 py-3">
                <span>
                  {hasReview(m.slug) ? (
                    <Link href={`/blog/${reviewSlug(m.slug)}`} className="font-semibold hover:text-[var(--accent)]">
                      {m.name}
                    </Link>
                  ) : (
                    <span className="font-semibold">{m.name}</span>
                  )}{" "}
                  <span className="text-sm text-[var(--muted)]">
                    {m.family} · {m.release} · {m.context} · {m.license}
                  </span>
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {m.priceIn === "check console" ? "check console" : m.priceIn === "self-host" ? "self-host" : `${m.priceIn} / ${m.priceOut}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="mt-12 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 text-sm text-[var(--muted)]">
        <p>
          **Methodology:** {MODELS.length} models curated from public docs (OpenAI, Anthropic, Google, Meta, Mistral, DeepSeek, Alibaba, xAI + roundups). Historical foundations (BERT, GPT-1/2/3, T5, PaLM, BLOOM) are verifiable via Wikipedia and provider posts. Pricing says “check console” where it changes — we do not guess. Reviews are hands-on (our eval) where linked.
        </p>
        <p className="mt-2">
          Missing a model? <Link href="/contact" className="text-[var(--accent)] hover:underline">Tell us</Link> — we add real models only, with sources.
        </p>
      </div>
    </div>
  );
}
