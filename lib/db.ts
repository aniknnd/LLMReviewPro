/**
 * SQLite database client (better-sqlite3 + Drizzle ORM).
 *
 * - WAL mode enabled for concurrent reads/writes on VPS.
 * - Single shared connection per process (works with PM2 cluster off).
 * - `server-only` import ensures this never ships to the client bundle.
 */
import "server-only";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "node:path";
import fs from "node:fs";

declare global {
  // eslint-disable-next-line no-var
  var __llmreviewpro_db: BetterSQLite3Database<typeof schema> | undefined;
  // eslint-disable-next-line no-var
  var __llmreviewpro_raw: Database.Database | undefined;
}

function getDbPath(): string {
  const raw =
    process.env.DB_PATH ||
    process.env.DATABASE_URL?.replace("file:", "") ||
    "./data/blog.db";
  // absolute?
  if (path.isAbsolute(raw)) return raw;
  return path.join(/*turbopackIgnore: true*/ process.cwd(), raw);
}

function createDb(): BetterSQLite3Database<typeof schema> {
  const dbPath = getDbPath();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const raw = new Database(dbPath);
  // Performance + concurrency tuning for a single VPS.
  raw.pragma("journal_mode = WAL");
  raw.pragma("synchronous = NORMAL");
  raw.pragma("foreign_keys = ON");
  raw.pragma("cache_size = -20000"); // ~20 MB page cache
  raw.pragma("temp_store = MEMORY");

  // Attach to global so dev HMR doesn't leak connections.
  globalThis.__llmreviewpro_raw = raw;

  const db = drizzle(raw, { schema });
  return db;
}

if (!globalThis.__llmreviewpro_db) {
  globalThis.__llmreviewpro_db = createDb();
}

export const db = globalThis.__llmreviewpro_db;
export const rawDb = globalThis.__llmreviewpro_raw!;
