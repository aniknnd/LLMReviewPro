#!/usr/bin/env node
/**
 * Daily SQLite backup: VACUUM INTO a timestamped copy + prune old files.
 * Usage: DB_PATH=./data/blog.db node scripts/backup.mjs
 * Env:   BACKUP_DIR (default ./backups), BACKUP_KEEP (default 14 days)
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.DB_PATH || "./data/blog.db";
const backupDir = process.env.BACKUP_DIR || "./backups";
const keepDays = parseInt(process.env.BACKUP_KEEP || "14", 10);

if (!fs.existsSync(dbPath)) {
  console.error(`[backup] DB not found: ${dbPath}`);
  process.exit(1);
}
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const out = path.join(backupDir, `blog-${stamp}.db`);

const db = new Database(dbPath, { readonly: true });
// VACUUM INTO is atomic and WAL-safe.
db.prepare(`VACUUM INTO '${out.replace(/'/g, "''")}'`).run();
db.close();
console.log(`[backup] wrote ${out}`);

// Prune backups older than keepDays.
const cutoff = Date.now() - keepDays * 24 * 60 * 60 * 1000;
for (const f of fs.readdirSync(backupDir)) {
  if (!f.startsWith("blog-") || !f.endsWith(".db")) continue;
  const full = path.join(backupDir, f);
  try {
    const st = fs.statSync(full);
    if (st.mtimeMs < cutoff) {
      fs.unlinkSync(full);
      console.log(`[backup] pruned ${f}`);
    }
  } catch { /* ignore */ }
}
