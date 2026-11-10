#!/usr/bin/env node
/**
 * Generate original editorial featured images for every article and assign
 * them to the DB. Images are hand-built SVG artwork (no stock, no logos,
 * no fake screenshots) — safe for AdSense and unique per post.
 *
 * Usage: node scripts/generate-post-images.mjs
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const db = new Database("./data/blog.db");
db.pragma("journal_mode = WAL");
const outDir = path.join(process.cwd(), "public", "images", "articles");
fs.mkdirSync(outDir, { recursive: true });

/* ------------------------------------------------------------------ */
/* Deterministic art generator                                         */
/* ------------------------------------------------------------------ */

const PALETTES = {
  ink: { bg: "#0a0f0d", fg: "#f5f5f4", accent: "#34d399", soft: "#a8a29e" },
  paper: { bg: "#faf8f4", fg: "#1c1917", accent: "#065f46", soft: "#57534e" },
  deep: { bg: "#111816", fg: "#e7e5e0", accent: "#6ee7b7", soft: "#94a3b8" },
  slate: { bg: "#0f172a", fg: "#f8fafc", accent: "#60a5fa", soft: "#94a3b8" },
  plum: { bg: "#1e1220", fg: "#f5f5f4", accent: "#c084fc", soft: "#a8a29e" },
};

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}

function svgArt(title, slug) {
  const h = hash(slug || title);
  const pal = Object.values(PALETTES)[h % Object.keys(PALETTES).length];
  const W = 1200, H = 630;
  const seed = (n) => ((h >> (n % 24)) & 0xff) / 255;

  // Abstract editorial composition: grid + orbiting nodes + a wordmark.
  const nodes = [];
  const n = 5 + (h % 5);
  for (let i = 0; i < n; i++) {
    const x = 120 + seed(i * 3 + 1) * 900;
    const y = 140 + seed(i * 5 + 2) * 340;
    const r = 22 + seed(i * 7 + 3) * 90;
    nodes.push(`<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(0)}" fill="${pal.accent}" opacity="${(0.08 + seed(i + 11) * 0.18).toFixed(2)}"/>`);
  }
  // Connecting lines between a few nodes
  const lines = [];
  for (let i = 0; i < Math.min(4, n - 1); i++) {
    const x1 = 120 + seed(i * 3 + 1) * 900;
    const y1 = 140 + seed(i * 5 + 2) * 340;
    const x2 = 120 + seed((i + 1) * 3 + 1) * 900;
    const y2 = 140 + seed((i + 1) * 5 + 2) * 340;
    lines.push(`<line x1="${x1.toFixed(0)}" y1="${y1.toFixed(0)}" x2="${x2.toFixed(0)}" y2="${y2.toFixed(0)}" stroke="${pal.accent}" stroke-opacity="0.25" stroke-width="2"/>`);
  }
  // A big soft disc
  const discX = 880 + seed(21) * 160;
  const discY = 180 + seed(22) * 240;
  const discR = 180 + seed(23) * 120;

  // Title: split into up to 2 lines, wrap at ~28 chars
  const clean = title.replace(/\s+/g, " ").trim();
  const words = clean.split(" ");
  const lines2 = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > 30 && cur) {
      lines2.push(cur);
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines2.push(cur);
  const shown = lines2.slice(0, 2);
  const titleTspans = shown.map((l, i) => `<tspan x="90" dy="${i === 0 ? 0 : 1.05}em">${escapeXml(l)}</tspan>`).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${pal.bg}"/>
  <g opacity="0.5">${Array.from({ length: 8 }).map((_, i) => `<line x1="0" y1="${(i + 1) * 78}" x2="${W}" y2="${(i + 1) * 78}" stroke="${pal.fg}" stroke-opacity="0.03" stroke-width="1"/>`).join("")}</g>
  <circle cx="${discX}" cy="${discY}" r="${discR}" fill="${pal.accent}" opacity="0.10"/>
  <g>${lines.join("")}${nodes.join("")}</g>
  <text x="90" y="140" fill="${pal.accent}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="26" letter-spacing="6">LLM REVIEW PRO</text>
  <text x="90" y="210" fill="${pal.fg}" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="72">${titleTspans}</text>
  <text x="90" y="560" fill="${pal.soft}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="24">${escapeXml(slug)}</text>
  <rect x="90" y="300" width="120" height="4" fill="${pal.accent}"/>
</svg>`;
  return svg;
}

function escapeXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ------------------------------------------------------------------ */
/* Generate + assign                                                   */
/* ------------------------------------------------------------------ */

const posts = db.prepare("SELECT id, slug, title, excerpt FROM posts WHERE status='published'").all();
let made = 0;
for (const p of posts) {
  const file = `${p.slug}.svg`;
  const full = path.join(outDir, file);
  const svg = svgArt(p.title, p.slug);
  fs.writeFileSync(full, svg);
  const url = `/images/articles/${file}`;
  const alt = `${p.title} — editorial cover illustration`;
  db.prepare("UPDATE posts SET featured_image_url=?, featured_image_alt=?, updated_at=? WHERE id=?").run(
    url,
    alt,
    new Date().toISOString(),
    p.id,
  );
  made++;
}
console.log(`[images] wrote ${made} SVG covers to public/images/articles`);
const empty = db.prepare("SELECT count(*) as n FROM posts WHERE status='published' AND (featured_image_url IS NULL OR featured_image_url='')").get().n;
console.log(`[images] posts missing cover: ${empty}`);
db.close();
