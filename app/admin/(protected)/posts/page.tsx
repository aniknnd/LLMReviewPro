import type { Metadata } from "next";
import Link from "next/link";
import { getAllPostsAdmin } from "@/lib/queries";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Posts",
  robots: { index: false, follow: false },
};

interface Props {
  searchParams: Promise<{ status?: string; page?: string; q?: string }>;
}

export default async function AdminPostsPage({ searchParams }: Props) {
  const { status = "all", page: raw } = await searchParams;
  const page = Math.max(1, Number(raw) || 1);
  const perPage = 20;
  const { rows, total } = await getAllPostsAdmin(status, page, perPage);
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const statuses = ["all", "draft", "scheduled", "published", "archived"] as const;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Posts</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{total} {total === 1 ? "post" : "posts"}</p>
        </div>
        <Link href="/admin/posts/new" className="inline-flex min-h-[44px] items-center rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white">
          + New post
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/posts?status=${s}`}
            aria-selected={status === s}
            className={`min-h-[36px] rounded-md px-3 py-1.5 text-sm font-medium ${status === s ? "bg-[var(--accent)] text-white" : "border border-[var(--border)]"}`}
          >
            {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
          </Link>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-[var(--border)]/40 text-left">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {rows.map((p) => (
              <tr key={p.id} className="hover:bg-[var(--border)]/30">
                <td className="px-4 py-3">
                  <Link href={`/admin/posts/${p.id}`} className="font-medium hover:text-[var(--accent)]">
                    {p.title}
                  </Link>
                  <p className="text-xs text-[var(--muted)]">/blog/{p.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs">{p.status}</span>
                </td>
                <td className="px-4 py-3">{p.publishedAt ? formatDate(p.publishedAt) : "—"}</td>
                <td className="px-4 py-3">{p.viewCount}</td>
                <td className="px-4 py-3">{formatDate(p.updatedAt)}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/blog/${p.slug}`} className="mr-3 text-[var(--accent)] hover:underline">View</Link>
                  <Link href={`/admin/posts/${p.id}`} className="text-[var(--accent)] hover:underline">Edit</Link>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--muted)]">No posts in this view.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-4 flex gap-2">
          {page > 1 && <Link href={`/admin/posts?status=${status}&page=${page - 1}`} className="min-h-[44px] rounded-md border border-[var(--border)] px-3 py-2 text-sm">← Prev</Link>}
          <span className="px-3 py-2 text-sm text-[var(--muted)]">Page {page} of {totalPages}</span>
          {page < totalPages && <Link href={`/admin/posts?status=${status}&page=${page + 1}`} className="min-h-[44px] rounded-md border border-[var(--border)] px-3 py-2 text-sm">Next →</Link>}
        </nav>
      )}
    </div>
  );
}
