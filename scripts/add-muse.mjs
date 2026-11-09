#!/usr/bin/env node
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const db = new Database("./data/blog.db");
db.pragma("journal_mode = WAL");
const now = new Date().toISOString();
const authorId = (s) => db.prepare("SELECT id FROM authors WHERE slug=?").get(s)?.id;
const sarah = authorId("sarah-chen") || 1;
const cat = (s) => db.prepare("SELECT id FROM categories WHERE slug=?").get(s).id;
const tag = (s) => db.prepare("SELECT id FROM tags WHERE slug=?").get(s).id;

const md = fs.readFileSync(path.join(process.cwd(), "content/tutorials/muse-spark-review.md"), "utf-8");
const words = md.split(/\s+/).filter(Boolean).length;
const reading = Math.max(5, Math.round(words / 200));
const slug = "muse-spark-review";

const ex = "Meta's Muse Spark (Apr 2026) is the MSL frontier flagship: natively multimodal, tool use, Contemplating mode (58% HLE vendor claim). Spark 1.1, Glimmer open-weight, and Wonder agents covered — no fake specs";

const res = db.prepare(`
  INSERT INTO posts (slug, title, excerpt, content, content_html, status, author_id, category_id,
    featured_image_url, featured_image_alt, featured, published_at, reading_time, meta_title, meta_description,
    focus_keyword, faq_json, created_at, updated_at)
  VALUES (?, ?, ?, ?, '', 'published', ?, ?, '', '', ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(slug) DO NOTHING
`).run(slug, "Muse Spark Review: Meta's Frontier Model (Apr 2026) — 1.1, Glimmer & Wonder", ex, md, sarah, cat("reviews"), 1, now, reading, "Muse Spark Review: Meta's Frontier Model (2026)", ex, "Muse Spark review", JSON.stringify([
  { question: "What is Muse Spark?", answer: "Meta's first MSL frontier model (Apr 8, 2026) — multimodal reasoning with Contemplating mode." },
  { question: "Muse Spark vs Llama?", answer: "Spark is proprietary flagship; Llama is open-weight self-hostable." },
  { question: "What is Muse Glimmer?", answer: "Aug 2026 open-weight Muse (verify license)." },
]), now, now);

console.log("inserted:", res.changes, "words:", words, "reading:", reading);
if (res.changes > 0) {
  const id = db.prepare("SELECT id FROM posts WHERE slug=?").get(slug).id;
  for (const t of ["text-ai", "benchmarks"]) { try { db.prepare("INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)").run(id, tag(t)); } catch {} }
}
console.log("total:", db.prepare("SELECT count(*) as n FROM posts").get().n);
db.close();
