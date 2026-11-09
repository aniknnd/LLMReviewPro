#!/usr/bin/env node
/**
 * Create/update the admin user from env vars (idempotent).
 * Required: ADMIN_EMAIL, ADMIN_PASSWORD (>= 8 chars), SESSION_SECRET.
 * Usage: ADMIN_EMAIL=a@b.c ADMIN_PASSWORD='...' SESSION_SECRET='...' node scripts/setup-admin.mjs
 */
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || "";
if (!email) throw new Error("ADMIN_EMAIL required");
if (password.length < 8) throw new Error("ADMIN_PASSWORD must be >= 8 chars");
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must be >= 32 chars (openssl rand -base64 32)");
}

const dbPath = process.env.DB_PATH || "./data/blog.db";
const db = new Database(dbPath);
db.pragma("foreign_keys = ON");
const hash = bcrypt.hashSync(password, 10);
const now = new Date().toISOString();
db.prepare(`
  INSERT INTO users (email, password_hash, name, role, updated_at)
  VALUES (?, ?, ?, 'admin', ?)
  ON CONFLICT(email) DO UPDATE SET password_hash=excluded.password_hash, updated_at=excluded.updated_at
`).run(email, hash, "Admin", now);
console.log(`[setup-admin] admin ready: ${email}`);
db.close();
