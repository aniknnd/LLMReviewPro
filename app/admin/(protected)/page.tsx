import type { Metadata } from "next";
import Link from "next/link";
import { getDashboardStats } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  const cards: Array<{ label: string; value: number; href: string; hint: string }> = [
    { label: "Total posts", value: stats.totalPosts, href: "/admin/posts", hint: "All statuses" },
    { label: "Drafts", value: stats.drafts, href: "/admin/posts?status=draft", hint: "Unpublished" },
    { label: "Scheduled", value: stats.scheduled, href: "/admin/posts?status=scheduled", hint: "Cron publishes daily" },
    { label: "Unread messages", value: stats.unreadMessages, href: "/admin/messages", hint: "Contact inbox" },
    { label: "Media files", value: stats.mediaCount, href: "/admin/media", hint: "WebP optimized" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Overview — posts, drafts, views, and inbox.
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex min-h-[44px] items-center rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white"
        >
          + New post
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5 hover:border-[var(--accent)]"
          >
            <p className="text-sm text-[var(--muted)]">{c.label}</p>
            <p className="mt-1 text-3xl font-bold">{c.value}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{c.hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="recent-heading" className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 id="recent-heading" className="font-bold">
            Recent posts
          </h2>
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {stats.recent.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <Link href={`/admin/posts/${p.id}`} className="truncate font-medium hover:text-[var(--accent)]">
                    {p.title}
                  </Link>
                  <p className="text-xs text-[var(--muted)]">
                    {p.status} · Updated {formatDate(p.updatedAt)}
                  </p>
                </div>
                <Link href={`/blog/${p.slug}`} className="shrink-0 text-xs text-[var(--accent)] hover:underline">
                  View ↗
                </Link>
              </li>
            ))}
            {!stats.recent.length && <li className="py-3 text-sm text-[var(--muted)]">No posts yet.</li>}
          </ul>
        </section>

        <section aria-labelledby="top-heading" className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 id="top-heading" className="font-bold">
            Top posts by views
          </h2>
          <ul className="mt-3 divide-y divide-[var(--border)]">
            {stats.top.map((p, i) => (
              <li key={p.slug} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <span className="mr-2 text-sm font-bold text-[var(--muted)]">{i + 1}.</span>
                  <Link href={`/blog/${p.slug}`} className="font-medium hover:text-[var(--accent)]">
                    {p.title}
                  </Link>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--border)]/60 px-2.5 py-0.5 text-xs font-semibold">
                  {p.viewCount} views
                </span>
              </li>
            ))}
            {!stats.top.length && <li className="py-3 text-sm text-[var(--muted)]">No views yet.</li>}
          </ul>
          <p className="mt-3 text-xs text-[var(--muted)]">
            Privacy-friendly: counted per day, no IP stored.
          </p>
        </section>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
        <h2 className="font-bold">Quick maintenance</h2>
        <ul className="mt-3 flex flex-wrap gap-2 text-sm">
          <li>
            <Link href="/admin/backup" className="rounded-md border border-[var(--border)] px-3 py-2 hover:border-[var(--accent)]">
              Backup database →
            </Link>
          </li>
          <li>
            <Link href="/admin/media" className="rounded-md border border-[var(--border)] px-3 py-2 hover:border-[var(--accent)]">
              Media library →
            </Link>
          </li>
          <li>
            <Link href="/admin/settings" className="rounded-md border border-[var(--border)] px-3 py-2 hover:border-[var(--accent)]">
              Site settings →
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
