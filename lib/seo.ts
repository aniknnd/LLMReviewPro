/**
 * SEO helpers: metadata builders + JSON-LD structured data.
 *
 * Follows Next.js Metadata API + JSON-LD guide:
 * - `generateMetadata` returns unique title/description/canonical/OG/Twitter.
 * - JSON-LD is rendered as `<script type="application/ld+json">` with
 *   `JSON.stringify(...).replace(/</g, '\\u003c')` to prevent XSS.
 * - Schemas: WebSite (+SearchAction), Organization, Article/BlogPosting,
 *   BreadcrumbList, Person (author), FAQPage when applicable.
 */
import type { Metadata } from "next";
import { site, absoluteUrl } from "./site";
import { toIso, truncate, escapeJsonLd } from "./utils";

export { escapeJsonLd };

/* ------------------------------------------------------------------ */
/* Core metadata helper                                                */
/* ------------------------------------------------------------------ */

interface BuildMetadataInput {
  title: string;
  description: string;
  path: string; // e.g. "/blog/my-post"
  canonical?: string;
  image?: string;
  type?: "website" | "article";
  publishedAt?: string | null;
  updatedAt?: string | null;
  authors?: string[];
  keywords?: string[];
  noindex?: boolean;
  locale?: string;
}

export function buildMetadata(input: BuildMetadataInput): Metadata {
  const canonical = input.canonical || absoluteUrl(input.path);
  const ogImage = input.image
    ? input.image.startsWith("http")
      ? input.image
      : absoluteUrl(input.image)
    : `${site.url}/opengraph-image`;

  const description = truncate(input.description || site.description, 160);

  const meta: Metadata = {
    metadataBase: new URL(site.url),
    title: input.title,
    description,
    keywords: input.keywords,
    alternates: {
      canonical,
      types: {
        "application/rss+xml": site.rssUrl,
      },
    },
    openGraph: {
      title: input.title,
      description,
      url: canonical,
      siteName: site.name,
      locale: input.locale || site.locale,
      type: input.type || "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: input.title,
        },
      ],
      ...(input.type === "article"
        ? {
            publishedTime: input.publishedAt
              ? toIso(input.publishedAt)
              : undefined,
            modifiedTime: input.updatedAt
              ? toIso(input.updatedAt)
              : undefined,
            authors: input.authors,
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description,
      site: site.twitterHandle,
      creator: site.twitterHandle,
      images: [ogImage],
    },
    robots: input.noindex
      ? { index: false, follow: true }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };

  return meta;
}

/* ------------------------------------------------------------------ */
/* JSON-LD builders                                                    */
/* ------------------------------------------------------------------ */

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: site.name,
    url: site.url,
    description: site.description,
    inLanguage: "en",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${site.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    logo: `${site.url}/logo.svg`,
    description: site.description,
    sameAs: [site.twitterHandle.startsWith("http") ? site.twitterHandle : `https://x.com/${site.twitterHandle.replace("@", "")}`],
  };
}

export function articleJsonLd(opts: {
  title: string;
  description: string;
  slug: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
  image?: string;
  authorName: string;
  authorSlug: string;
  authorAvatar?: string;
  categoryName?: string;
  tags?: string[];
  headline?: string;
}) {
  const url = absoluteUrl(`/blog/${opts.slug}`);
  const image = opts.image
    ? opts.image.startsWith("http")
      ? opts.image
      : absoluteUrl(opts.image)
    : `${site.url}/opengraph-image`;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.headline || truncate(opts.title, 110),
    alternativeHeadline: opts.title,
    description: opts.description,
    url,
    image: [image],
    datePublished: opts.publishedAt ? toIso(opts.publishedAt) : undefined,
    dateModified: opts.updatedAt ? toIso(opts.updatedAt) : undefined,
    author: {
      "@type": "Person",
      name: opts.authorName,
      url: absoluteUrl(`/author/${opts.authorSlug}`),
      ...(opts.authorAvatar ? { image: opts.authorAvatar } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: site.name,
      logo: { "@type": "ImageObject", url: `${site.url}/logo.svg` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    ...(opts.categoryName
      ? { articleSection: opts.categoryName }
      : {}),
    ...(opts.tags?.length ? { keywords: opts.tags.join(", ") } : {}),
    inLanguage: "en",
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function personJsonLd(opts: {
  name: string;
  slug: string;
  title?: string;
  bio?: string;
  avatar?: string;
  twitter?: string;
  github?: string;
  linkedin?: string;
  website?: string;
  expertise?: string;
}) {
  const url = absoluteUrl(`/author/${opts.slug}`);
  const sameAs = [opts.twitter, opts.github, opts.linkedin, opts.website].filter(
    Boolean,
  ) as string[];
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: opts.name,
    url,
    ...(opts.title ? { jobTitle: opts.title } : {}),
    ...(opts.bio ? { description: opts.bio } : {}),
    ...(opts.avatar ? { image: opts.avatar } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(opts.expertise ? { knowsAbout: opts.expertise.split(",").map((s) => s.trim()) } : {}),
  };
}

export function faqJsonLd(faqs: Array<{ question: string; answer: string }>) {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function parseFaqJson(faqJson: string): FaqItem[] {
  try {
    const arr = JSON.parse(faqJson || "[]");
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (x): x is FaqItem =>
        typeof x?.question === "string" && typeof x?.answer === "string",
    );
  } catch {
    return [];
  }
}

/** Infer FAQ data: prefer JSON, fall back to markdown parsing helper. */
export function getFaqItems(
  faqJson: string,
  markdown: string,
  parseFn: (md: string) => FaqItem[],
): FaqItem[] {
  const fromJson = parseFaqJson(faqJson);
  if (fromJson.length) return fromJson;
  return parseFn(markdown);
}
