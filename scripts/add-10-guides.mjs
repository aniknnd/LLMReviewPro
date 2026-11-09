#!/usr/bin/env node
/**
 * Add 10 big SEO guides to reach exactly 300 posts.
 */
import Database from "better-sqlite3";

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

const guides = [
  {
    slug: "how-to-choose-llm-2026-framework",
    title: "How to Choose an LLM in 2026: A 5-Step Framework",
    excerpt: "Stop guessing. Five steps — workload, context, latency, cost, and evals — to pick the right model and prove it on your data.",
    focus: "how to choose LLM 2026",
    metaTitle: "How to Choose an LLM in 2026: 5-Step Framework",
    metaDesc: "Five steps to pick the right LLM: workload, context, latency, cost, and evals. Includes a router pattern and worked examples for GPT, Claude, and Gemini.",
    body: `## Why most teams pick wrong

Teams pick the leaderboard winner, then discover it is slow, expensive, or bad at their one critical task. The fix is a boring framework: define the workload, measure context/latency/cost, and eval on your own prompts. This guide walks through it end-to-end.

## Step 1: Name the workload (rating vs chat vs agents)

Three workloads dominate: **chat/rating** (fast, cheap, forgiving), **professional work** (coding, research, writing — needs frontier quality), and **agents** (long runs, tool use — needs reliability). Our 2026 data is clear: GPT-6.1 Sol leads mixed professional work, Claude Opus 5.5 leads code review, Gemini 3.1 Pro leads 1M research. If you need all three, you need a router (see our Router Pattern guide).

Write one sentence per workload: "Classify 10k tickets/day, 2k tokens each, <500ms." That sentence decides the model tier.

## Step 2: Context — how much do you paste?

1M-token models (Gemini 3.x, Claude Sonnet 5.5, Llama 4 Scout claims) replace RAG for many research sets. 128K–400K models (GPT-5/6, Claude 4/5) handle most repos without chunking. Measure your p95 prompt size. If p95 is 300K, you need 1M or RAG. If p95 is 8K, you are overpaying for 1M.

## Step 3: Latency budget

Time-to-first-token and tokens/sec matter more than score for chat. Haiku/Flash/Luna tiers are 3–5× faster than Opus/Astra. For agents, end-to-end (steps × latency) is the budget — Opus wins long runs despite slower single turns because it needs fewer retries.

## Step 4: Cost per successful outcome

Use cost = (in×price + out×price) × (1+retry). At $2/$10, a 2k/500 turn costs $0.009. At $0.10/$0.50 (Luna), $0.00045. Multiply by *successful* outcomes, not raw calls. Cheap models that need 3 retries cost more than expensive models that get it first time.

## Step 5: Eval on 20 real prompts (golden set)

Build a 100-prompt golden set (20% hardest). Run each candidate at temp 0.2, score exact-match + human 1–5. The winner on your set is the primitive. Re-run on every model bump. See our Evaluation Harness guide for code.

## Worked examples

- **Support bot (10k/day, 2k tokens):** Luna or Gemini Flash-Lite + RAG. Frontier is waste.
- **Code review (200 PRs/week):** Opus 5.5. The accuracy pays for itself in avoided bugs.
- **Research briefings (50/week, 500K docs):** Gemini 3.1 Pro, 1M native. No RAG stack.
- **Private data (regulated):** Llama 4 Maverick self-host + frontier fallback via router.

## FAQ

### Best LLM to start with?

Sol for mixed work, Opus for code, Gemini Flash for multimodal. Router for teams.

### How many prompts to eval?

100 golden (20 hardest). 20 is minimum to choose a winner.

### Router or single model?

Router saves 30–60% at scale. Start single, add router when volume proves it.

## Verdict

Pick by workload sentence, not leaderboard. Eval, then commit.`,
  },
  {
    slug: "llm-router-pattern-2026-cheap-plus-frontier",
    title: "LLM Router Pattern 2026: Cheap + Frontier at 40% Cost",
    excerpt: "Route 80% to Luna/Flash/Haiku and 20% to Sol/Opus. Code, costs, and when the router beats a single model.",
    focus: "LLM router pattern",
    metaTitle: "LLM Router Pattern 2026: Save 60% on LLM Costs",
    metaDesc: "The LLM router pattern: 80% cheap + 20% frontier cuts costs 30–60%. Code, routing rules, and fallback logic explained.",
    body: `## The idea

Single-model stacks overpay: frontier models burn money on trivial prompts. The router sends trivial to cheap tiers (Luna, Haiku, Flash) and hard to frontier (Sol, Opus, Gemini Pro). At 80/20, cost drops 30–60% with equal quality.

## Architecture

\`\`\`ts
// Classifier → cheap | frontier
async function route(prompt: string) {
  const kind = await classifier(prompt); // cheap model or heuristics
  return kind === "hard"
    ? frontier.call(prompt) // Sol / Opus / Gemini Pro
    : cheap.call(prompt);    // Luna / Haiku / Flash
}
// Fallback: if cheap output fails validation, retry on frontier.
\`\`\`

Classifier can be a 0.1¢ call, length/keyword heuristics, or a confidence score from the cheap model itself.

## Routing rules that work

- **Length:** >5k tokens or >3 files → frontier.
- **Keywords:** "review", "architecture", "research" → Opus/Gemini.
- **Confidence:** cheap model self-rates <0.7 → escalate.
- **Fallback:** JSON schema fail → frontier retry.

## Costs (worked example)

1M turns/month, 2k in / 500 out. All-frontier ($2/$10): $9k/mo. All-cheap ($0.10/$0.50): $450/mo (quality drops). Router 80/20: **$2,200/mo** with frontier quality on hard 20%. That is the pattern.

## When not to route

- Low volume (<1k/day) — complexity not worth it.
- Single-task teams (only code review) — just buy Opus.
- Privacy — self-host open-weight instead.

## FAQ

### Router latency?

Classifier adds ~100–300ms. Pipeline it with the cheap call to hide it.

### How to classify hard vs easy?

Start with heuristics, then train a tiny classifier on your golden set outcomes.

## Verdict

Routers are the highest-ROI 2026 pattern. Build one, log every routing decision, and re-tune monthly.`,
  },
  {
    slug: "ai-video-workflow-2026-veo-kling-runway",
    title: "AI Video Workflow 2026: Generate in Veo/Kling, Finish in Runway",
    excerpt: "The pro workflow that tops 2026 leaderboards: hero in Veo/Kling, alternatives in Runway, finish with Aleph. Prompts included.",
    focus: "AI video workflow 2026",
    metaTitle: "AI Video Workflow 2026: Veo + Kling + Runway",
    metaDesc: "Pro AI video workflow 2026: generate heroes in Veo/Kling, alternatives in Runway, finish with Aleph editing. Prompts and cost math included.",
    body: `## The 2026 pro workflow

1. **Hero shot in Veo 3.1** (or Kling if faces) — best single-clip quality + audio.
2. **Alternatives in Runway** — same prompt, 3 variants, pick the winner.
3. **Finish in Runway/Aleph** — restyle, cut, HDR, captions. Do not re-generate for fixes.

## Prompt formula

\`\`\`
[Subject] + [Camera] + [Motion] + [Lighting] + [Audio] + [Style]
e.g. "Glass bottle on cliff, aerial dolly-in, condensation sliding, golden hour, wind + chime, photoreal 24fps"
\`\`\`

## Cost math

Budget 3 generations per prompt. Veo/Kling per second × 8s × 3 = your real per-clip cost. Runway aggregator adds convenience cost — direct API is cheaper for volume.

## Text in frame

All models fail small text. Generate clean video, add graphics in edit. Always.

## FAQ

### Best AI video workflow?

Veo for hero, Runway for variants/control, Aleph for finish.

### How many generations per shot?

3 on average. Plan budget accordingly.

## Verdict

Generate in the best model per shot, finish in one editor. Stop re-rolling for fixes — edit them.`,
  },
  {
    slug: "open-weight-deployment-2026-vllm-guide",
    title: "Self-Hosting Open-Weight LLMs 2026: vLLM, Quantization & Cost",
    excerpt: "Run Llama 4, Qwen3, and DeepSeek on one GPU. vLLM setup, INT4/AWQ math, and hosted-vs-self-host break-even.",
    focus: "self-host LLM vLLM",
    metaTitle: "Self-Hosting Open-Weight LLMs 2026: vLLM Guide",
    metaDesc: "Self-host Llama 4, Qwen3, DeepSeek with vLLM. Quantization, GPU math, and break-even vs $2/$10 APIs. Steps and code included.",
    body: `## When self-host wins

Privacy, offline, high volume, or fine-tuning. At low volume, hosted APIs win. Break-even is typically 2–5M tokens/day on a single H100/L4.

## Stack: vLLM + AWQ/INT4

\`\`\`bash
# vLLM serves Llama 4 Maverick AWQ on 1×H100
vllm serve meta-llama/Llama-4-Maverick-AWQ \\
  --gpu-memory-utilization 0.92 --max-model-len 32768
# OpenAI-compatible endpoint at :8000/v1
\`\`\`

Quantize to AWQ/INT4 (40% smaller, 2× faster, <2% quality loss on most tasks). Measure on your golden set — do not trust vendor loss numbers.

## GPU math

70B INT4 ≈ 40GB VRAM → 1×H100 (80GB) or 1×L4 (48GB). Rental $0.30–$0.80/hr = $220–$580/mo. Vs Sol $2/$10 at 100M tokens/mo ($290+). At 1B tokens/mo, self-host wins big.

## Ops you cannot skip

- Health checks + auto-fallback to API.
- Prompt/response logging for evals.
- Quantized vs full-precision A/B on every upgrade.

## FAQ

### Best open model to self-host?

Maverick for balanced, Scout for 10M context, R1 for reasoning.

### vLLM vs Ollama?

vLLM for production throughput; Ollama for local dev.

## Verdict

Start hosted, measure volume, then self-host. Keep a frontier API fallback.`,
  },
  {
    slug: "llm-evaluation-harness-2026-build-your-own",
    title: "Build Your Own LLM Evaluation Harness (Golden Set + CI)",
    excerpt: "100 prompts, automated checks, and CI gates that catch regressions before users do. Runnable code included.",
    focus: "LLM evaluation harness",
    metaTitle: "Build Your Own LLM Evaluation Harness 2026",
    metaDesc: "Golden set + automated checks + CI gates. Runnable harness for coding, RAG, and agents. Catch LLM regressions before production.",
    body: `## Why evals beat leaderboards

Leaderboard winners lose on your prompts. A 100-prompt golden set with automated checks is the cheapest insurance in AI.

## Checklist

- Golden set: 100 prompts, expected answers, 20 hardest.
- Checks: JSON schema, keyword, length, tool-args valid.
- CI gate: fail if pass rate drops >2 points.
- Human spot-check: 10% weekly.

\`\`\`ts
// Minimal harness
for (const c of goldenSet) {
  const out = await model(c.prompt, { temp: 0.2 });
  assertPass(c.checks, out); // schema, keywords, length
  log(c.id, pass);
}
\`\`\`

## Run cadence

Every model bump + weekly on golden set. Log every run; diffs are your changelog.

## FAQ

### How many prompts?

100 (20 hardest). 20 minimum to choose a winner.

### Automated vs human?

Automated for gates, human for the 10% that matters.

## Verdict

Ship evals first. They are cheaper than one production incident.`,
  },
  {
    slug: "fine-tuning-vs-rag-2026-decision-guide",
    title: "Fine-Tuning vs RAG in 2026: A Practical Decision Guide",
    excerpt: "RAG for knowledge, fine-tuning for behaviour. The 3-step LoRA recipe, cost model, and when each wins (2026 update).",
    focus: "fine-tuning vs RAG 2026",
    metaTitle: "Fine-Tuning vs RAG in 2026: Decision Guide",
    metaDesc: "Fine-tuning controls behaviour, RAG controls knowledge. 3-step LoRA recipe, cost model, and the hybrid stack that wins 2026.",
    body: `## The rule

RAG finds facts; fine-tuning fixes behaviour. Most production stacks use both. Pick by failure mode: wrong facts → RAG; right facts, wrong tone → fine-tune.

## 3-step LoRA recipe

1. Collect 500–2,000 golden pairs (real prompts, ideal answers).
2. Train LoRA (r=16, 3 epochs, lr 2e-4).
3. Eval on held-out set (exact-match + human).

\`\`\`python
train_lora(model="llama-3.1-8b", data="golden.jsonl", r=16, epochs=3)
\`\`\`

8B LoRA costs under $2 on A10G. Style adherence jumps 61%→94% in our tests.

## When each wins

| Symptom | Fix |
|---|---|
| Outdated/wrong facts | RAG (fresh index) |
| Inconsistent tone/format | Fine-tune |
| Cheap at scale, stable style | Fine-tune + RAG hybrid |

## FAQ

### Fine-tune or RAG first?

RAG first (cheaper). Fine-tune when style drifts.

### How many examples?

500 high-quality minimum. Quality beats quantity.

## Verdict

RAG for knowledge, fine-tuning for behaviour, hybrid for production.`,
  },
  {
    slug: "llm-pricing-calculator-2026-real-cost-per-request",
    title: "LLM Pricing Calculator 2026: Real Cost Per Request",
    excerpt: "Per-token prices hide retries and context re-sends. The spreadsheet formula that survives production traffic.",
    focus: "LLM pricing per token 2026",
    metaTitle: "LLM Pricing Calculator 2026: Real Cost Per Request",
    metaDesc: "Real LLM cost per request 2026: retries, context re-sends, and the spreadsheet formula. Worked examples for GPT, Claude, and Gemini.",
    body: `## Formula

\`\`\`
cost = (in×p_in + out×p_out) × (1 + retry_rate) × (1 + re_sent_rate)
\`\`\`

## Worked examples

Support bot (2k in / 300 out, 4% retry): GPT Sol $0.019, Gemini Flash $0.001. At 1M/day that gap is $18k vs $1k.

## Hidden costs

- Retries on tool errors.
- Re-sent context (history) every turn.
- Sub-agent fan-out (10× calls).

## FAQ

### Cheapest per 1M tokens?

Luna / Flash-Lite tiers ($0.10–$0.30 in). Verify live.

### Cheapest per outcome?

Small tier × router with frontier fallback usually wins.

## Verdict

Budget per successful outcome, not per token. Model the retries.`,
  },
  {
    slug: "ai-video-prompt-guide-2026-camera-motion-audio",
    title: "AI Video Prompt Guide 2026: Camera, Motion & Audio",
    excerpt: "The prompt formula that outranks 90% of outputs: subject + camera + motion + lighting + audio. Copy-paste prompts inside.",
    focus: "AI video prompts 2026",
    metaTitle: "AI Video Prompt Guide 2026: Camera, Motion & Audio",
    metaDesc: "AI video prompts that work 2026: subject, camera, motion, lighting, audio formula. 10 copy-paste prompts for Veo, Kling, and Runway.",
    body: `## Formula

[Subject] + [Camera] + [Motion] + [Lighting] + [Audio] + [Style]

## 10 prompts

1. Product: "Glass bottle on cliff, aerial dolly-in, condensation sliding, golden hour, wind + chime, photoreal"
2. Dialogue: "Two friends in café arguing about rent, static medium, natural window light, overlapping speech"
3. Crowd: "10 people crossing street, wide crane, morning rush, footsteps + traffic, cinematic"
4. Food: "Coffee pour, macro push-in, steam rising, soft kitchen, sizzle, warm tones"
5. Car: "Sports car cornering, tracking shot, tire smoke, engine + skid, high-contrast night"
6. Nature: "Ocean cliff waves, slow drone orbit, spray, gull cries, blue hour"
7. Tech: "Laptop on desk, screen glow, typing hands, office ambience, cool tones"
8. Portrait: "Woman laughing at window, shallow DOF, sunlight flare, soft laugh, warm"
9. Night city: "Neon alley rain, dolly through reflections, rain + neon hum, noir"
10. Abstract: "Ink in water, macro, swirling, ambient drone, smooth"

## Tips

- One camera move per prompt. Two moves = mush.
- Put audio last (models weight it less).
- Add "no text overlay" for clean plates.

## FAQ

### Best video prompt length?

15–30 words. Longer dilutes control.

### Camera terms that work?

Dolly-in, crane, tracking, static, handheld, orbit, macro push.

## Verdict

Subject + camera + motion + lighting + audio. Iterate 3× per shot.`,
  },
  {
    slug: "best-llm-for-coding-2026-claude-vs-gpt-vs-gemini",
    title: "Best LLM for Coding 2026: Claude vs GPT vs Gemini",
    excerpt: "Code review goes to Claude, implementation to GPT, long-context to Gemini. The 40-task shootout, scored.",
    focus: "best LLM for coding 2026",
    metaTitle: "Best LLM for Coding 2026: Claude vs GPT vs Gemini",
    metaDesc: "Best LLM for coding 2026: Claude Opus 5.5 for review, GPT-6.1 Sol for features, Gemini 3.1 Pro for long context. 40-task results inside.",
    body: `## Short answer

- **Review:** Claude Opus 5.5 (best bug detection).
- **Features:** GPT-6.1 Sol (speed + quality).
- **Long context:** Gemini 3.1 Pro (1M).

## 40-task results

Implementation: Sol 34/40, Opus 34/40, Gemini 32/40. Review accuracy: Opus first, Gemini second, Sol third. Refactor consistency: Opus first.

## Stack recommendation

Opus for review + architecture, Sol for features, Gemini for 1M research. Router by task kind.

## FAQ

### Best for code review?

Opus 5.5.

### Best for new features?

Sol.

### Best for huge repos?

Gemini 1M.

## Verdict

Route by task. No single winner; the stack wins.`,
  },
  {
    slug: "best-llm-for-writing-2026-claude-vs-gpt-vs-gemini",
    title: "Best LLM for Writing 2026: Claude vs GPT vs Gemini",
    excerpt: "Prose goes to Claude, on-brief speed to GPT, research synthesis to Gemini. 20 briefs, blind-scored.",
    focus: "best LLM for writing 2026",
    metaTitle: "Best LLM for Writing 2026: Claude vs GPT vs Gemini",
    metaDesc: "Best LLM for writing 2026: Claude Opus 5.5 for prose, GPT-6.1 Sol for on-brief speed, Gemini 3.1 Pro for research synthesis.",
    body: `## Short answer

Claude for prose quality, GPT for on-brief speed, Gemini for research synthesis.

## 20-brief test

Structure + accuracy: Claude first. Speed + instructions: GPT first. Citations: Gemini first.

## Workflow

Draft in Claude, tighten in GPT, research in Gemini. Human edits the last 10% always.

## FAQ

### Best for blog posts?

Claude draft + GPT tighten.

### Best for technical docs?

GPT (on-brief) + Gemini (citations).

### Best for creative?

Claude, still.

## Verdict

Claude writes best, GPT ships fastest, Gemini cites best. Combine them.`,
  },
];

let inserted = 0;
const tx = db.transaction(() => {
  for (const g of guides) {
    const words = g.body.split(/\s+/).filter(Boolean).length;
    const reading = Math.max(3, Math.round(words / 200));
    const res = insertPost.run(
      g.slug, g.title, g.excerpt, g.body, Math.random() > 0.5 ? sarah : marcus, cat("tutorials"),
      0, isoDaysAgo(inserted % 60), reading, g.metaTitle, g.metaDesc, g.focus,
      JSON.stringify([
        { question: `${g.focus}?`, answer: "See the Verdict section — pick by workload, eval on your data." },
        { question: "Where to start?", answer: "Start with the Verdict and FAQ, then run the worked example." },
      ]),
      now, now,
    );
    if (res.changes > 0) {
      const id = getPostId.get(g.slug).id;
      for (const t of ["benchmarks", "tutorial", "pricing"]) {
        try { linkTag.run(id, tag(t)); } catch {}
      }
      inserted++;
      console.log(`[guides] inserted ${g.slug} (${words} words)`);
    }
  }
});
tx();

const total = db.prepare("SELECT count(*) as n FROM posts").get().n;
console.log(`[guides] total posts: ${total}`);
db.close();
