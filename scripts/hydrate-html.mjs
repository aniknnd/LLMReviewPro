#!/usr/bin/env node
/**
 * Render all posts/pages markdown → HTML and cache in DB for fast TTFB.
 * Usage: node scripts/hydrate-html.mjs
 */
import Database from "better-sqlite3";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings, { behavior: "append", properties: { className: ["anchor-link"], ariaLabel: "Link to heading" }, content: [{ type: "element", tagName: "span", properties: { className: ["anchor-icon"], "aria-hidden": true }, children: [{ type: "text", value: "#" }] }] })
  .use(rehypeHighlight)
  .use(rehypeSanitize, { ...defaultSchema, attributes: { ...defaultSchema.attributes, code: [["className", /language-.*/]], pre: [["className", /hljs.*/]], span: [["className", /.*/]], a: [...(defaultSchema.attributes?.a || []), ["className", /anchor-link/], ["target", "_blank", "rel", "noopener noreferrer"]] }, tagNames: [...(defaultSchema.tagNames || []), "figure", "figcaption", "video", "source"] })
  .use(rehypeStringify, { allowDangerousHtml: false });

const dbPath = process.env.DB_PATH || "./data/blog.db";
const db = new Database(dbPath);

const posts = db.prepare("SELECT id, content FROM posts").all();
const updPost = db.prepare("UPDATE posts SET content_html=? WHERE id=?");
for (const p of posts) {
  const html = p.content?.trim() ? String(await processor.process(p.content)) : "";
  updPost.run(html, p.id);
}
console.log(`[hydrate] posts: ${posts.length}`);

const pages = db.prepare("SELECT id, content FROM pages").all();
const updPage = db.prepare("UPDATE pages SET content_html=? WHERE id=?");
for (const p of pages) {
  const html = p.content?.trim() ? String(await processor.process(p.content)) : "";
  updPage.run(html, p.id);
}
console.log(`[hydrate] pages: ${pages.length}`);

db.close();
