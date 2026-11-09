#!/usr/bin/env node
/**
 * Publish scheduled posts whose scheduled_at <= now.
 * Run via cron every 5 minutes:
 *   0-59/5 * * * * cd /path/to/app && node scripts/publish-scheduled.mjs
 *
 * Env: DB_PATH
 */
import Database from "better-sqlite3";

const dbPath = process.env.DB_PATH || "./data/blog.db";
const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const now = new Date().toISOString();
const due = db
  .prepare(
    "SELECT id, slug, scheduled_at FROM posts WHERE status='scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= ?",
  )
  .all(now);

for (const row of due) {
  db.prepare(
    "UPDATE posts SET status='published', published_at=scheduled_at, scheduled_at=NULL, updated_at=? WHERE id=?",
  ).run(now, row.id);
  console.log(`[publish] published ${row.slug} (id=${row.id})`);
}
console.log(`[publish] checked ${due.length} due post(s).`);
db.close();
