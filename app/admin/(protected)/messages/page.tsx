import type { Metadata } from "next";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { formatDate } from "@/lib/utils";
import { markRead, deleteMessage } from "./actions";

export const metadata: Metadata = {
  title: "Messages inbox",
  robots: { index: false, follow: false },
};

export default async function MessagesPage() {
  const rows = await db
    .select()
    .from(contactMessages)
    .orderBy(desc(contactMessages.createdAt))
    .limit(100);

  const unread = rows.filter((r) => !r.isRead).length;

  return (
    <div>
      <h1 className="text-3xl font-bold">Contact inbox</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {rows.length} messages · {unread} unread
      </p>

      <div className="mt-6 space-y-4">
        {rows.map((m) => (
          <article
            key={m.id}
            className={`rounded-xl border p-5 ${m.isRead ? "border-[var(--border)] bg-[var(--card-bg)]" : "border-[var(--accent)] bg-[var(--card-bg)]"}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">
                  {m.name} <span className="font-normal text-[var(--muted)]">&lt;{m.email}&gt;</span>
                </p>
                <p className="text-sm text-[var(--muted)]">
                  {m.subject || "(no subject)"} · <time dateTime={m.createdAt}>{formatDate(m.createdAt)}</time>
                  {!m.isRead && <span className="ml-2 rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs font-bold text-white">New</span>}
                </p>
              </div>
              <div className="flex gap-2">
                {!m.isRead && (
                  <form action={async () => { "use server"; await markRead(m.id); }}>
                    <button type="submit" className="min-h-[36px] rounded-md border border-[var(--border)] px-3 text-xs font-medium">
                      Mark read
                    </button>
                  </form>
                )}
                <form action={async () => { "use server"; await deleteMessage(m.id); }}>
                  <button type="submit" className="min-h-[36px] rounded-md border border-red-300 px-3 text-xs font-medium text-red-700 dark:text-red-300">
                    Delete
                  </button>
                </form>
                <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "your message"}`)}`} className="inline-flex min-h-[36px] items-center rounded-md bg-[var(--accent)] px-3 text-xs font-semibold text-white">
                  Reply
                </a>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm">{m.message}</p>
          </article>
        ))}
        {!rows.length && <p className="text-sm text-[var(--muted)]">No messages yet.</p>}
      </div>
    </div>
  );
}
