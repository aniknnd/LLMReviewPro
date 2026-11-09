/**
 * Markdown → HTML rendering with sanitization, TOC extraction, FAQ parsing.
 *
 * Pipeline: unified → remark-parse → remark-gfm → rehype → rehype-slug
 *           → rehype-autolink-headings → rehype-highlight (code) → rehype-sanitize
 *           → rehype-stringify.
 *
 * - `rehype-sanitize` strips scripts/event handlers (AdSense CSP compatible).
 * - Headings get ids via rehype-slug, anchors via autolink-headings.
 * - Tables, code blocks, images all supported (GFM).
 * - TOC is extracted by parsing the HAST (no cheerio needed).
 */
import "server-only";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

export interface TocItem {
  id: string;
  text: string;
  depth: 2 | 3;
}

export interface FaqItem {
  question: string;
  answer: string;
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings, {
    behavior: "append",
    properties: {
      className: ["anchor-link"],
      ariaLabel: "Link to heading",
    },
    content: [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["anchor-icon"], "aria-hidden": true },
        children: [{ type: "text", value: "#" }],
      },
    ],
  })
  .use(rehypeHighlight)
  .use(rehypeSanitize, {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      // Allow class on code/pre (highlight.js) and anchor links.
      code: [["className", /language-.*/]],
      pre: [["className", /hljs.*/]],
      span: [["className", /.*/]],
      a: [
        ...(defaultSchema.attributes?.a || []),
        ["className", /anchor-link/],
        ["target", "_blank", "rel", "noopener noreferrer"],
      ],
    },
    // Keep alt text on images for SEO; sanitize removes on* handlers.
    tagNames: [
      ...(defaultSchema.tagNames || []),
      "figure",
      "figcaption",
      "video",
      "source",
    ],
  })
  .use(rehypeStringify, { allowDangerousHtml: false });

/** Render markdown to sanitized HTML. */
export async function renderMarkdown(md: string): Promise<string> {
  if (!md?.trim()) return "";
  const file = await processor.process(md);
  return String(file);
}

/** Extract H2/H3 headings for the table of contents. */
export function extractToc(html: string): TocItem[] {
  if (!html) return [];
  const items: TocItem[] = [];
  // Regex-parse h2/h3 ids (rehype-slug guarantees `id="..."`).
  const re = /<h([23])[^>]*\sid="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
  let m: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((m = re.exec(html))) {
    const depth = Number(m[1]) as 2 | 3;
    const id = m[2];
    // Strip nested anchor span + tags → plain text.
    const text = m[3]
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (id && text) items.push({ id, text, depth });
  }
  return items;
}

/**
 * Parse a trailing `## FAQ` / `### FAQ` section into Q&A pairs.
 * Supports `### Question?` headings followed by paragraphs, or
 * `**Q:** ...` / `**A:** ...` pairs. Returns [] when no FAQ section.
 */
export function parseFaq(md: string): FaqItem[] {
  if (!md) return [];
  const faqMatch = md.match(/#{1,3}\s*FAQ[\s\S]*/i);
  if (!faqMatch) return [];
  const section = faqMatch[0];

  const faqs: FaqItem[] = [];
  // Pattern 1: ### Question? \n answer...
  const hRe = /^#{3}\s+(.+?)\s*\n([\s\S]+?)(?=^#{1,3}\s+|\s*$)/gm;
  let m: RegExpExecArray | null;
  // eslint-disable-next-line no-cond-assign
  while ((m = hRe.exec(section))) {
    const q = m[1].trim();
    const a = m[2].trim().replace(/\n{3,}/g, "\n\n");
    if (q && a) faqs.push({ question: q, answer: a });
  }
  if (faqs.length) return faqs;

  // Pattern 2: **Q:** ... **A:** ...
  const qaRe =
    /\*\*Q:\*\*\s*(.+?)\n+\*\*A:\*\*\s*([\s\S]+?)(?=\n\*\*Q:\*\*|\s*$)/g;
  // eslint-disable-next-line no-cond-assign
  while ((m = qaRe.exec(section))) {
    faqs.push({ question: m[1].trim(), answer: m[2].trim() });
  }
  return faqs;
}

/** Plain-text excerpt from markdown (first ~160 chars). */
export function markdownToExcerpt(md: string, max = 160): string {
  if (!md) return "";
  const text = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*`_>\-–|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Estimate reading time from rendered HTML (words / 200 wpm). */
export function readingTimeFromHtml(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = text ? text.split(" ").length : 0;
  return Math.max(1, Math.round(words / 200));
}
