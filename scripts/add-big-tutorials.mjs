#!/usr/bin/env node
/**
 * Insert 8 BIG tutorials from content/tutorials/*.md
 * (Python complete + LLM fine-tune + 6 AI tutorials).
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
const tag = (s) => {
  const r = db.prepare("SELECT id FROM tags WHERE slug=?").get(s);
  if (!r) throw new Error(`missing tag ${s}`);
  return r.id;
};

const insertPost = db.prepare(`
  INSERT INTO posts (slug, title, excerpt, content, content_html, status, author_id, category_id,
    featured_image_url, featured_image_alt, featured, published_at, reading_time, meta_title, meta_description,
    focus_keyword, faq_json, created_at, updated_at)
  VALUES (?, ?, ?, ?, '', 'published', ?, ?, '', '', ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(slug) DO NOTHING
`);
const linkTag = db.prepare("INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)");
const getPostId = db.prepare("SELECT id FROM posts WHERE slug=?");

const TUTS = [
  {
    slug: "python-complete-tutorial-2026",
    title: "Python Programming Tutorial 2026: The Complete Guide (One Page)",
    excerpt: "Complete Python in one page: install, variables, loops, functions, OOP, venvs, files, testing, NumPy/pandas/FastAPI, cheat sheet, and 6 projects.",
    focus: "Python tutorial 2026",
    metaTitle: "Python Programming Tutorial 2026: Complete Guide",
    metaDesc: "Complete Python tutorial 2026: install, variables, loops, functions, OOP, venv, files, testing, NumPy/pandas/FastAPI, cheat sheet and 6 projects.",
    tags: ["tutorial", "benchmarks"],
    faq: [
      { question: "Python 3.11 vs 3.12?", answer: "3.12 is faster with better errors. Use 3.12 for new projects." },
      { question: "Do I need OOP for scripts?", answer: "No. Use functions until classes clarify design." },
      { question: "How do I run Python code?", answer: "Save as .py, run python3 file.py inside a venv. Test with pytest." },
    ],
  },
  {
    slug: "llm-fine-tuning-complete-guide-2026",
    title: "LLM Fine-Tuning Complete Guide 2026: LoRA, Data & Deployment",
    excerpt: "Complete LLM fine-tuning: when to fine-tune, dataset prep, LoRA vs full, LLaMA-Factory + HF code, hyperparameters, evals, and deployment.",
    focus: "LLM fine-tuning tutorial",
    metaTitle: "LLM Fine-Tuning Complete Guide 2026: LoRA to Deploy",
    metaDesc: "Complete LLM fine-tuning guide 2026: dataset, LoRA vs full, LLaMA-Factory + Hugging Face code, hyperparameters, evals, vLLM deployment.",
    tags: ["tutorial", "benchmarks", "pricing"],
    faq: [
      { question: "How many examples do I need?", answer: "500 high-quality pairs minimum." },
      { question: "LoRA or full fine-tune?", answer: "LoRA first. Full only when LoRA plateaus." },
      { question: "Best base model 2026?", answer: "Maverick/Qwen3 open general; R1 reasoning; Qwen-Coder for code." },
    ],
  },
  {
    slug: "prompt-engineering-complete-guide-2026",
    title: "Prompt Engineering Complete Guide 2026: Few-Shot to JSON",
    excerpt: "Complete prompt engineering: system prompts, few-shot, chain-of-thought, structured outputs, temp controls, production Python, and debugging.",
    focus: "prompt engineering guide",
    metaTitle: "Prompt Engineering Complete Guide 2026",
    metaDesc: "Prompt engineering complete guide: system prompts, few-shot, CoT, structured outputs, temp controls, production Python patterns.",
    tags: ["tutorial", "benchmarks"],
    faq: [
      { question: "Best prompt technique?", answer: "Few-shot + structured outputs. System prompts for behaviour." },
      { question: "Do reasoning models need CoT prompts?", answer: "No. They reason internally." },
    ],
  },
  {
    slug: "rag-from-scratch-2026-tutorial",
    title: "RAG From Scratch 2026: Build Retrieval-Augmented Generation in Python",
    excerpt: "Build RAG from scratch: chunking, embeddings, Chroma, hybrid search, reranking, citations, and evals. Complete runnable pipeline.",
    focus: "RAG tutorial Python",
    metaTitle: "RAG From Scratch 2026: Python Tutorial (Runnable)",
    metaDesc: "Build RAG from scratch in Python: chunking, embeddings, Chroma, hybrid search, reranking, citations. Runnable end-to-end tutorial.",
    tags: ["tutorial", "benchmarks"],
    faq: [
      { question: "Chunk size?", answer: "Start 500 tokens, 50 overlap, sentence-aware." },
      { question: "Best vector DB?", answer: "Chroma to start, pgvector to scale." },
    ],
  },
  {
    slug: "ai-agents-with-langgraph-2026",
    title: "AI Agents With LangGraph 2026: Build Tools, Memory & Gates",
    excerpt: "Build AI agents: perceive-plan-act-observe loop, LangGraph state machines, validated tools, memory, human-in-the-loop, and evals.",
    focus: "AI agents tutorial",
    metaTitle: "AI Agents With LangGraph 2026: Complete Tutorial",
    metaDesc: "Build AI agents 2026: loop, LangGraph graphs, validated tools, memory, human-in-the-loop. Runnable agent and failure modes.",
    tags: ["tutorial", "benchmarks"],
    faq: [
      { question: "LangGraph vs plain loop?", answer: "Plain under 10 steps; LangGraph for branches/resume/gates." },
      { question: "Best first agent?", answer: "Research agent (search, summarize, cite)." },
    ],
  },
  {
    slug: "transformers-explained-2026",
    title: "Transformers Explained 2026: Tokens, Attention & How LLMs Work",
    excerpt: "Transformers from zero: tokens, attention, encoder vs decoder, pretraining/SFT/RLHF, MoE, and modern models in one table.",
    focus: "transformers explained",
    metaTitle: "Transformers Explained 2026: Tokens, Attention, LLMs",
    metaDesc: "Transformers explained: tokens, attention, encoder vs decoder, pretraining/SFT/RLHF, MoE, context windows, modern LLMs table.",
    tags: ["tutorial", "benchmarks"],
    faq: [
      { question: "Why do LLMs hallucinate?", answer: "Next-token prediction optimizes plausibility, not truth. Ground with RAG." },
      { question: "What is a parameter?", answer: "A learned number. 70B = 70 billion numbers." },
    ],
  },
  {
    slug: "vector-databases-2026-guide",
    title: "Vector Databases 2026: Chroma, pgvector, Pinecone & Hybrid Search",
    excerpt: "Vector databases 2026: embeddings, HNSW, Chroma vs pgvector vs Pinecone, hybrid search, and the production checklist.",
    focus: "vector databases guide",
    metaTitle: "Vector Databases 2026: Chroma, pgvector, Pinecone Guide",
    metaDesc: "Vector databases 2026: embeddings, HNSW, Chroma vs pgvector vs Pinecone vs Qdrant, hybrid search, production checklist.",
    tags: ["tutorial", "benchmarks"],
    faq: [
      { question: "Need vector DB or Postgres?", answer: "Start pgvector if you have Postgres." },
      { question: "Best embedding model?", answer: "text-embedding-3-small for API; BGE/Qwen for self-host." },
    ],
  },
  {
    slug: "python-for-ai-2026-numpy-pandas-ml",
    title: "Python for AI 2026: NumPy, Pandas & ML in Practice",
    excerpt: "Python for AI: NumPy arrays, pandas tables, sklearn in 20 lines, plus RAG preprocessing and fine-tune prep projects.",
    focus: "Python for AI tutorial",
    metaTitle: "Python for AI 2026: NumPy, Pandas & ML Guide",
    metaDesc: "Python for AI 2026: NumPy, pandas, scikit-learn in 20 lines. Runnable RAG preprocessing and fine-tune prep projects.",
    tags: ["tutorial", "benchmarks"],
    faq: [
      { question: "NumPy vs pandas?", answer: "NumPy for arrays, pandas for tables." },
      { question: "Need PyTorch?", answer: "No — sklearn + APIs carry you far." },
    ],
  },
];

let inserted = 0;
const tx = db.transaction(() => {
  for (const t of TUTS) {
    const file = path.join(process.cwd(), "content", "tutorials", `${t.slug}.md`);
    if (!fs.existsSync(file)) { console.log(`[tuts] missing ${file}`); continue; }
    const md = fs.readFileSync(file, "utf-8");
    const words = md.split(/\s+/).filter(Boolean).length;
    const reading = Math.max(4, Math.round(words / 200));
    const res = insertPost.run(
      t.slug, t.title, t.excerpt, md, inserted % 2 === 0 ? sarah : marcus, cat("tutorials"),
      0, isoDaysAgo(inserted), reading, t.metaTitle, t.metaDesc, t.focus,
      JSON.stringify(t.faq), now, now,
    );
    if (res.changes > 0) {
      const id = getPostId.get(t.slug).id;
      for (const tg of t.tags) {
        try { linkTag.run(id, tag(tg)); } catch {}
      }
      inserted++;
      console.log(`[tuts] ${t.slug} (${words} words, ${reading}min)`);
    }
  }
});
tx();
console.log(`[tuts] inserted ${inserted}`);
const total = db.prepare("SELECT count(*) as n FROM posts").get().n;
console.log(`[tuts] total posts: ${total}`);
db.close();
