#!/usr/bin/env node
/**
 * Seed sample data: authors, categories, tags, posts, pages, settings.
 * Safe to re-run: uses INSERT OR REPLACE / IGNORE semantics.
 *
 * Run: DB_PATH=./data/blog.db node scripts/seed.mjs
 *      node scripts/migrate.mjs && node scripts/seed.mjs
 */
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.DB_PATH || "./data/blog.db";
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const now = new Date().toISOString();
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

/* ---------------- Markdown bodies ---------------- */

const post1Md = `## TL;DR

GPT-5, Claude 4, and Gemini 2.5 are now all stabilised in production APIs. This post benchmarks each on price, context window, latency, and code generation — with a reproducible test suite you can run yourself.

## What changed in 2026

- **GPT-5** ships with a 1M-token context window and natively retryable tool calls.
- **Claude 4 Sonnet** keeps the best agentic coding scores with 200K context.
- **Gemini 2.5 Pro** owns the long-context + free-tier tier for exploration.

## Benchmark setup

We ran 120 prompts across reasoning, coding, and retrieval. All models were called at temperature 0.2 with identical system prompts.

\`\`\`ts
const models = ["gpt-5", "claude-4-sonnet", "gemini-2.5-pro"];
// full suite: github.com/llmreviewpro/benchmarks (MIT)
models.forEach(async (m) => {
  const res = await evalSuite(m, { temp: 0.2, n: 120 });
  log(m, res);
});
\`\`\`

| Model | Context | $/1M in | Coding* | Reasoning* |
|-------|---------|---------|---------|------------|
| GPT-5 | 1,000K | $8 | 87 | 89 |
| Claude 4 Sonnet | 200K | $6 | 90 | 86 |
| Gemini 2.5 Pro | 1,000K | $3.50 | 78 | 84 |

*Internal aggregate; methodology linked above.

## Verdict

Pick **Claude 4** for shipping code, **GPT-5** for reasoning-heavy tool use, **Gemini 2.5** for large-document search on a budget.

## FAQ

### Which model has the largest context window?

GPT-5 and Gemini 2.5 Pro both expose 1M tokens. Claude 4 Sonnet is 200K.

### Which is cheapest for bulk inference?

Gemini 2.5 Pro at $3.50 per 1M input tokens.

### Can I switch between providers easily?

Yes — our router shows a 40-line OpenAI-compatible adapter that covers all three.
`;

const post2Md = `## Why fine-tuning is back

Retrieval handles *finding* facts; fine-tuning handles *behaviour*. When your product needs a single consistent tone across 10k calls, RAG alone drifts.

## The 3-step recipe

1. **Collect 500–2,000 golden examples** — real prompts, ideal responses.
2. **Train a LoRA adapter** — 10 epochs, lr 2e-4, batch 16.
3. **Evaluate on a held-out set** — exact-match + human review.

\`\`\`python
# Example: LLaMA-Factory LoRA run
from training import train_lora
train_lora(
    model="llama-3.1-8b",
    data="dataset.jsonl",
    r=16, alpha=32,
    epochs=3, lr=2e-4,
)
\`\`\`

## Cost reality check

A 8B LoRA run costs under $2 on a single A10G. The win is not raw accuracy — it's *consistency*: 94% style adherence vs 61% with prompting alone.

## FAQ

### Is fine-tuning better than RAG?

They solve different problems. Use RAG for knowledge, fine-tuning for behaviour. Most production systems use both.

### How many examples do I need?

Start with 500 high-quality pairs. Quality beats quantity.
`;

const post3Md = `## Agents, explained

An LLM agent is a loop: **perceive → plan → act → observe**. The model plans, tools act, results feed back into the next prompt.

## Minimal loop

\`\`\`ts
async function runAgent(goal: string) {
  let obs = "";
  for (let step = 0; step < 10; step++) {
    const action = await llm.plan({ goal, obs });
    obs = await tools.execute(action);
    if (action.done) break;
  }
}
\`\`\`

## What breaks in production

- **Runaway loops** — cap steps and add a cost budget per run.
- **Tool hallucination** — validate every tool argument with Zod.
- **No traces** — log every step; you cannot debug what you cannot see.

## FAQ

### Do I need LangGraph?

No. For anything under 10 steps, plain async/await is clearer and cheaper to maintain.
`;

const post4Md = `## Pricing, decoded

Per-token pricing hides the real cost: retries, tool calls, and context re-sends. This post builds a cost model you can paste into a spreadsheet.

## Formula

\`\`\`
cost = (input_tokens × input_price + output_tokens × output_price) × (1 + retry_rate)
\`\`\`

For a typical support bot (2k input, 300 output, 4% retry), GPT-5 costs **$0.019/request** vs **$0.014** for Claude 4 — a 26% gap that compounds at scale.

## FAQ

### Which model is cheapest per 1M tokens?

Gemini 2.5 Flash at $0.30 input. See the full table.
`;

const post5Md = `## Evaluation in practice

Teams ship LLM features without evals and discover failures in production chat logs. This post covers the cheapest eval that actually catches regressions.

## Checklist

- Golden set: 100 prompts with expected answers.
- Automated checks: JSON schema, keyword match, length.
- Human spot-check: 10% of traffic per week.

## FAQ

### How often should I re-evaluate?

Every model version bump and weekly on your golden set.
`;

/* ---------------- Seed ---------------- */

const seed = db.transaction(() => {
  // Authors
  const upsertAuthor = db.prepare(`
    INSERT INTO authors (slug, name, title, bio, bio_md, avatar_url, twitter, github, linkedin, website, expertise, credentials, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET name=excluded.name, title=excluded.title, bio=excluded.bio, bio_md=excluded.bio_md, updated_at=excluded.updated_at
  `);
  upsertAuthor.run("sarah-chen", "Sarah Chen", "Senior LLM Reviewer", "Sarah benchmarks inference speed and cost for a living. Former ML engineer, 8 years in search & ranking.", "Sarah benchmarks inference speed and cost. Former ML engineer.", "", "@sarahcodes", "github.com/sarahcodes", "", "https://sarahchen.dev", "LLM benchmarking, inference optimization", "MEng ML, Stanford", now);
  upsertAuthor.run("marcus-okafor", "Marcus Okafor", "AI Systems Writer", "Marcus writes about agents, evaluation, and production LLM systems. He has shipped three LLM products to 1M+ users.", "Marcus covers production LLM systems.", "", "@marcusbuilds", "github.com/marcusokafor", "", "", "Agents, evaluation, LLM Ops", "ex-Google, ex-Stripe ML", now);

  const author1 = db.prepare("SELECT id FROM authors WHERE slug='sarah-chen'").get().id;
  const author2 = db.prepare("SELECT id FROM authors WHERE slug='marcus-okafor'").get().id;

  // Categories
  const upsertCat = db.prepare(`
    INSERT INTO categories (slug, name, description, seo_title, seo_description, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET name=excluded.name, description=excluded.description, updated_at=excluded.updated_at
  `);
  upsertCat.run("news", "News", "Model releases and industry updates.", "LLM News & Model Releases", "Daily LLM news: releases, pricing, and research updates.", now);
  upsertCat.run("comparisons", "Comparisons", "Side-by-side model benchmarks.", "LLM Comparisons & Benchmarks", "Head-to-head LLM benchmarks.", now);
  upsertCat.run("tutorials", "Tutorials", "Hands-on guides and how-tos.", "LLM Tutorials & Guides", "Practical LLM tutorials.", now);
  upsertCat.run("reviews", "Reviews", "Deep-dive feature reviews.", "LLM Reviews", "In-depth LLM feature reviews.", now);

  const cat = (slug) => db.prepare("SELECT id FROM categories WHERE slug=?").get(slug).id;

  // Tags
  const upsertTag = db.prepare(`
    INSERT INTO tags (slug, name, description) VALUES (?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET name=excluded.name
  `);
  [["gpt-5", "GPT-5", "OpenAI GPT-5 coverage."], ["claude", "Claude", "Anthropic Claude coverage."], ["gemini", "Gemini", "Google Gemini coverage."], ["agents", "Agents", "Agent loops, tools, and evals."], ["fine-tuning", "Fine-tuning", "LoRA, adapters, and datasets."], ["pricing", "Pricing", "Cost analysis per token."], ["benchmarks", "Benchmarks", "Evaluation suites."], ["llama", "LLaMA", "Open-weight LLaMA coverage."]].forEach(([s, n, d]) => upsertTag.run(s, n, d));
  const tag = (slug) => db.prepare("SELECT id FROM tags WHERE slug=?").get(slug).id;

  // Admin user from env
  const email = process.env.ADMIN_EMAIL || "admin@example.com";
  const password = process.env.ADMIN_PASSWORD || "Admin123!";
  if (password.length < 8) throw new Error("ADMIN_PASSWORD must be >= 8 chars");
  const hash = bcrypt.hashSync(password, 10);
  db.prepare(`
    INSERT INTO users (email, password_hash, name, role, updated_at)
    VALUES (?, ?, ?, 'admin', ?)
    ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash, updated_at=excluded.updated_at
  `).run(email, hash, "Admin", now);

  // Posts
  const insertPost = db.prepare(`
    INSERT INTO posts (slug, title, excerpt, content, content_html, status, author_id, category_id,
      featured_image_url, featured_image_alt, featured, published_at, reading_time, meta_title, meta_description,
      focus_keyword, faq_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, '', 'published', ?, ?, '', '', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET title=excluded.title, excerpt=excluded.excerpt, updated_at=excluded.updated_at
  `);
  const linkTag = db.prepare("INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)");
  const getPostId = db.prepare("SELECT id FROM posts WHERE slug=?");

  const seedPosts = [
    {
      slug: "gpt-5-vs-claude-4-vs-gemini-2-5-benchmark-2026",
      title: "GPT-5 vs Claude 4 vs Gemini 2.5: The 2026 Benchmark That Matters",
      excerpt: "We benchmarked GPT-5, Claude 4 Sonnet, and Gemini 2.5 Pro on 120 prompts — here's which model to pick for coding, reasoning, and long-context search.",
      md: post1Md, authorId: author1, categoryId: cat("comparisons"), featured: 1, daysAgo: 1,
      focus: "GPT-5 vs Claude 4 benchmark", tags: ["gpt-5", "claude", "gemini", "benchmarks"],
      faq: JSON.stringify([
        { question: "Which model has the largest context window?", answer: "GPT-5 and Gemini 2.5 Pro both expose 1M tokens. Claude 4 Sonnet is 200K." },
        { question: "Which is cheapest for bulk inference?", answer: "Gemini 2.5 Pro at $3.50 per 1M input tokens." },
      ]),
    },
    {
      slug: "when-to-fine-tune-vs-rag-llm-guide",
      title: "When to Fine-Tune vs Use RAG: A Practical Decision Guide",
      excerpt: "Fine-tuning controls behaviour; RAG controls knowledge. Here's the 3-step LoRA recipe, cost model, and when each wins.",
      md: post2Md, authorId: author2, categoryId: cat("tutorials"), featured: 0, daysAgo: 2,
      focus: "fine-tuning vs RAG", tags: ["fine-tuning", "llama"],
      faq: "[]",
    },
    {
      slug: "llm-agent-loops-explained",
      title: "LLM Agent Loops Explained: Perceive, Plan, Act, Observe",
      excerpt: "The minimal agent loop in 15 lines of TypeScript — plus the three failure modes that break agents in production.",
      md: post3Md, authorId: author2, categoryId: cat("news"), featured: 0, daysAgo: 3,
      focus: "LLM agent loop", tags: ["agents"],
      faq: JSON.stringify([{ question: "Do I need LangGraph?", answer: "No. For anything under 10 steps, plain async/await is clearer and cheaper to maintain." }]),
    },
    {
      slug: "llm-pricing-cost-model-2026",
      title: "LLM Pricing, Decoded: The Real Cost Per Request",
      excerpt: "Per-token pricing hides retries and context re-sends. Build a cost model that survives production traffic.",
      md: post4Md, authorId: author1, categoryId: cat("reviews"), featured: 0, daysAgo: 5,
      focus: "LLM pricing per token", tags: ["pricing", "benchmarks"],
      faq: "[]",
    },
    {
      slug: "llm-evaluation-golden-set-checklist",
      title: "LLM Evaluation in Practice: The Cheapest Golden Set That Works",
      excerpt: "Stop shipping on vibes. A 100-prompt golden set catches regressions before your users do.",
      md: post5Md, authorId: author2, categoryId: cat("tutorials"), featured: 0, daysAgo: 7,
      focus: "LLM evaluation golden set", tags: ["benchmarks", "agents"],
      faq: "[]",
    },
  ];

  for (const p of seedPosts) {
    insertPost.run(
      p.slug, p.title, p.excerpt, p.md, p.authorId, p.categoryId,
      p.featured, daysAgo(p.daysAgo), 4, "", "", p.focus, p.faq, now, now,
    );
    const id = getPostId.get(p.slug).id;
    p.tags.forEach((t) => linkTag.run(id, tag(t)));
    console.log(`[seed] post: ${p.slug}`);
  }

  // Pages (trust pages)
  const upsertPage = db.prepare(`
    INSERT INTO pages (slug, title, content, meta_title, meta_description, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET title=excluded.title, updated_at=excluded.updated_at
  `);
  const pages = [
    ["about", "About LLM Review Pro", "# About LLM Review Pro\n\nLLM Review Pro covers Large Language Models with independent testing. Every benchmark is reproducible; every review discloses methodology.\n\n## Our process\n\n- 120+ prompt eval suites per model\n- Cost per request, not just per token\n- Code, reasoning, and retrieval scored separately\n\n## Contact\n\nUse the [Contact](/contact) page for corrections and press.", "About LLM Review Pro", "Independent LLM news, reviews, and benchmarks."],
    ["privacy-policy", "Privacy Policy", "# Privacy Policy\n\nWe do not sell personal data. Analytics are aggregated per day with no IP storage. Ad cookies are only loaded after consent (see Cookie Policy).", "Privacy Policy — LLM Review Pro", "How we handle data on LLM Review Pro."],
    ["terms-of-service", "Terms of Service", "# Terms of Service\n\nContent is provided for informational purposes. Benchmarks are estimates; verify pricing with providers before purchasing.", "Terms of Service — LLM Review Pro", "Terms of use for LLM Review Pro."],
    ["disclaimer", "Disclaimer", "# Disclaimer\n\nLLM Review Pro may contain affiliate links. If you purchase through them, we may earn a commission at no extra cost to you. Model names are trademarks of their owners.", "Disclaimer — LLM Review Pro", "Affiliate and trademark disclaimer."],
    ["cookie-policy", "Cookie Policy", "# Cookie Policy\n\nWe use a first-party consent banner (Google CMP compatible). AdSense cookies load only after you accept. Essential cookies (session, consent) are always on.", "Cookie Policy — LLM Review Pro", "Cookies and consent on LLM Review Pro."],
    ["editorial-policy", "Editorial & Content Policy", "# Editorial & Content Policy\n\nWe publish corrections within 48 hours, label sponsored content, and never accept payment for coverage. Authors disclose expertise and tooling.", "Editorial Policy — LLM Review Pro", "How we write and review LLM coverage."],
  ];
  pages.forEach(([slug, title, md, mt, md2]) => upsertPage.run(slug, title, md, mt, md2, now));

  // Settings
  const upsertSetting = db.prepare("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at");
  [["ads_enabled", "true"], ["site_name", "LLM Review Pro"], ["contact_email", "hello@llmreviewpro.com"]].forEach(([k, v]) => upsertSetting.run(k, v, now));

  // contact_messages sample
  db.prepare("INSERT INTO contact_messages (name, email, subject, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run("Alex Rivera", "alex@example.com", "Benchmark question", "How did you measure latency? P95 or p50?", 0, now);
});

seed();
console.log("[seed] done.");
db.close();
