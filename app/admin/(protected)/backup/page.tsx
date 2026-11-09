import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import { runBackup } from "./actions";

export const metadata: Metadata = {
  title: "Backup",
  robots: { index: false, follow: false },
};

export default function BackupPage() {
  const backupDir = path.join(/*turbopackIgnore: true*/ process.cwd(), "backups");
  let backups: Array<{ name: string; size: number; mtime: string }> = [];
  try {
    if (fs.existsSync(backupDir)) {
      backups = fs
        .readdirSync(backupDir)
        .filter((f) => f.startsWith("blog-") && f.endsWith(".db"))
        .map((f) => {
          const st = fs.statSync(path.join(backupDir, f));
          return { name: f, size: st.size, mtime: st.mtime.toISOString() };
        })
        .sort((a, b) => (b.mtime < a.mtime ? -1 : 1))
        .slice(0, 20);
    }
  } catch { /* ignore */ }

  return (
    <div>
      <h1 className="text-3xl font-bold">Database backup</h1>
      <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
        One-click SQLite backup (<code>VACUUM INTO</code>, WAL-safe). Daily cron
        backups live in <code>./backups</code> (keep {process.env.BACKUP_KEEP || "14"} days).
        Downloads stream the file — never expose the live DB path.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="dl-heading" className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 id="dl-heading" className="font-bold">Download now</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Creates a timestamped copy and streams it. You can import it with the SQLite CLI.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a href="/api/backup" className="inline-flex min-h-[44px] items-center rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white">
              ⬇ Download .db
            </a>
            <form action={runBackup}>
              <button type="submit" className="min-h-[44px] rounded-md border border-[var(--border)] px-4 text-sm font-medium">
                Save copy to ./backups
              </button>
            </form>
          </div>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Restore: <code>sqlite3 data/blog.db &quot;.recover&quot;</code> or replace the file and restart PM2.
          </p>
        </section>

        <section aria-labelledby="list-heading" className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 id="list-heading" className="font-bold">Existing backups</h2>
          {backups.length ? (
            <ul className="mt-3 divide-y divide-[var(--border)] text-sm">
              {backups.map((b) => (
                <li key={b.name} className="flex justify-between py-2">
                  <span className="font-mono text-xs">{b.name}</span>
                  <span className="text-[var(--muted)]">
                    {Math.round(b.size / 1024)} KB · {new Date(b.mtime).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--muted)]">No backups yet. Use “Save copy” above or wait for cron.</p>
          )}
        </section>
      </div>
    </div>
  );
}
