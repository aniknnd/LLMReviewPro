#!/usr/bin/env node
/**
 * Run SQL migrations (idempotent). Reads `migrations/*.sql` in order
 * and applies each file inside a transaction. Tracks applied files in
 * `_migrations` table.
 *
 * Usage: node scripts/migrate.mjs
 * Env:   DB_PATH (default ./data/blog.db)
 */
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dbPath = process.env.DB_PATH || "./data/blog.db";
const migrationsDir = path.join(process.cwd(), "migrations");

if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS _migrations (
    name TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const applied = new Set(
  db.prepare("SELECT name FROM _migrations").all().map((r) => r.name),
);

const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

for (const file of files) {
  if (applied.has(file)) {
    console.log(`[migrate] skip (applied): ${file}`);
    continue;
  }
  const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
  console.log(`[migrate] applying: ${file}`);
  const apply = db.transaction(() => {
    db.exec(sql);
    db.prepare("INSERT INTO _migrations (name) VALUES (?)").run(file);
  });
  apply();
  console.log(`[migrate] done: ${file}`);
}

db.close();
console.log("[migrate] all migrations applied.");
