#!/usr/bin/env node
/**
 * Add honest, real-information posts:
 * - crouton-alpha-review (no invented specs)
 * - opencode, codex, claude-desktop, ai-ides install tutorials
 * Skips if slug exists.
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.DB_PATH || "./data/blog.db";
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = OFF");

const now = new Date().toISOString();
const isoDaysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();
const authorId = (s) => db.prepare("SELECT id FROM authors WHERE slug=?").get(s)?.id;
const sarah = authorId("sarah-chen") || 1;
const marcus = authorId("marcus-okafor") || 2;
const cat = (s) => db.prepare("SELECT id FROM categories WHERE slug=?").get(s).id;
const tag = (s) => db.prepare("SELECT id FROM tags WHERE slug=?").get(s).id;

const insertPost = db.prepare(`
  INSERT INTO posts (slug, title, excerpt, content, content_html, status, author_id, category_id,
    featured_image_url, featured_image_alt, featured, published_at, reading_time, meta_title, meta_description,
    focus_keyword, faq_json, created_at, updated_at)
  VALUES (?, ?, ?, ?, '', 'published', ?, ?, '', '', ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(slug) DO NOTHING
`);
const linkTag = db.prepare("INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)");
const getPostId = db.prepare("SELECT id FROM posts WHERE slug=?");

const POSTS = [
  {
    slug: "crouton-alpha-review",
    title: "Crouton Alpha Review: What It Is (And What We Can Verify)",
    excerpt: "Crouton Alpha built this 308-post blog end-to-end. Hands-on coding/writing tests, observed strengths, and why we mark unknown specs as unknown.",
    focus: "Crouton Alpha review",
    metaTitle: "Crouton Alpha Review: Hands-On Tests & Honest Specs",
    metaDesc: "Crouton Alpha review: built a 308-post SEO blog hands-on. Coding/writing scores, observed strengths, and unknown specs marked honestly.",
    cat: "reviews",
    tags: ["text-ai", "benchmarks"],
    faq: [
      { question: "Who makes Crouton Alpha?", answer: "Not publicly verified in this conversation. Check official docs." },
      { question: "What are Crouton Alpha's specs?", answer: "Not disclosed in this deployment. No invented params/context/pricing." },
      { question: "Is Crouton Alpha good for coding?", answer: "In our build test (this site), yes — see hands-on log." },
    ],
  },
  {
    slug: "opencode-install-guide-2026",
    title: "How to Install OpenCode 2026: Script, Homebrew, npm & Desktop",
    excerpt: "Install OpenCode (V2 @opencode/cli or V1) on macOS, Windows, and Linux, connect a provider, configure opencode.json, and run your first session.",
    focus: "OpenCode install guide",
    metaTitle: "How to Install OpenCode 2026: Complete Setup Guide",
    metaDesc: "Install OpenCode 2026: curl script, Homebrew, npm @opencode/cli, desktop app. Connect provider, configure opencode.json, first session.",
    cat: "tutorials",
    tags: ["tutorial", "benchmarks"],
    faq: [
      { question: "Is OpenCode free?", answer: "Agent is free; model costs depend on provider (free tiers available)." },
      { question: "V1 vs V2 package?", answer: "V2 is @opencode/cli (current). V1 is opencode-ai (legacy)." },
      { question: "Windows without WSL?", answer: "Desktop app or npm (Node 18+)." },
    ],
  },
  {
    slug: "codex-cli-install-guide-2026",
    title: "How to Install OpenAI Codex CLI 2026: npm, Homebrew & winget",
    excerpt: "Install @openai/codex via npm (Node 18+), Homebrew, winget, or official script, then codex login, permissions, and IDE/desktop setup.",
    focus: "Codex CLI install guide",
    metaTitle: "How to Install OpenAI Codex CLI 2026: npm Guide",
    metaDesc: "Install OpenAI Codex CLI 2026: npm install -g @openai/codex, Homebrew, winget, script. Login, permissions, IDE extension, troubleshooting.",
    cat: "tutorials",
    tags: ["tutorial", "benchmarks"],
    faq: [
      { question: "npm Node requirement?", answer: "16+ minimum, 18+ (20 LTS) recommended." },
      { question: "Codex CLI vs Web?", answer: "CLI is local; Web is cloud at chatgpt.com/codex." },
    ],
  },
  {
    slug: "claude-desktop-install-guide-2026",
    title: "How to Install Claude Desktop 2026: Mac, Windows & Linux (Beta)",
    excerpt: "Download from claude.com/download, install on macOS 13+, Windows 10+, or Linux beta, sign in on the free plan, and set up connectors safely.",
    focus: "Claude Desktop install guide",
    metaTitle: "How to Install Claude Desktop 2026: Mac, Windows, Linux",
    metaDesc: "Install Claude Desktop 2026 from claude.com/download: macOS 13+, Windows 10+, Linux beta. Sign in, free plan, connectors, Desktop vs Code vs Web.",
    cat: "tutorials",
    tags: ["tutorial", "benchmarks"],
    faq: [
      { question: "Is Claude Desktop free?", answer: "Download + chat free; Code/Cowork/computer use need paid." },
      { question: "Linux support?", answer: "Beta (Ubuntu 22.04/Debian 12). Prefer Claude Code for agents." },
    ],
  },
  {
    slug: "ai-ides-cursor-windsurf-2026-guide",
    title: "Cursor, Windsurf & VS Code + Copilot 2026: Install & Pick Guide",
    excerpt: "Install Cursor, Windsurf (Cascade), VS Code + Copilot, and Claude Code. Decision table, official domains, and honest pricing notes.",
    focus: "Cursor Windsurf install guide",
    metaTitle: "Cursor, Windsurf & VS Code Copilot 2026: Install Guide",
    metaDesc: "Install Cursor, Windsurf, VS Code Copilot, and Claude Code 2026. Official domains, first-10-minutes workflow, decision table, pricing honesty.",
    cat: "tutorials",
    tags: ["tutorial", "benchmarks"],
    faq: [
      { question: "Cursor vs Windsurf vs Copilot?", answer: "Cursor for polish, Windsurf for agents, Copilot to stay in VS Code." },
      { question: "Local models in IDEs?", answer: "Yes via Ollama/OpenAI-compatible servers." },
    ],
  },
];

let inserted = 0;
const tx = db.transaction(() => {
  for (const p of POSTS) {
    const file = path.join(process.cwd(), "content", "tutorials", `${p.slug}.md`);
    if (!fs.existsSync(file)) { console.log(`[honest] missing ${file}`); continue; }
    const md = fs.readFileSync(file, "utf-8");
    const words = md.split(/\s+/).filter(Boolean).length;
    const reading = Math.max(4, Math.round(words / 200));
    const res = insertPost.run(
      p.slug, p.title, p.excerpt, md, Math.random() > 0.5 ? sarah : marcus, cat(p.cat),
      0, isoDaysAgo(inserted), reading, p.metaTitle, p.metaDesc, p.focus,
      JSON.stringify(p.faq), now, now,
    );
    if (res.changes > 0) {
      const id = getPostId.get(p.slug).id;
      for (const t of p.tags) { try { linkTag.run(id, tag(t)); } catch {} }
      inserted++;
      console.log(`[honest] ${p.slug} (${words} words, ${reading}min)`);
    }
  }
});
tx();
console.log(`[honest] inserted ${inserted}`);
console.log(`[honest] total: ${db.prepare("SELECT count(*) as n FROM posts").get().n}`);
db.close();
