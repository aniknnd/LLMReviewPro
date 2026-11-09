import type { Metadata } from "next";
import Image from "next/image";
import { db } from "@/lib/db";
import { media } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { deleteMedia } from "./actions";

export const metadata: Metadata = {
  title: "Media library",
  robots: { index: false, follow: false },
};

export default async function MediaPage() {
  const items = await db.select().from(media).orderBy(desc(media.createdAt)).limit(100);

  return (
    <div>
      <h1 className="text-3xl font-bold">Media library</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Uploads are auto-optimized to WebP. Use the post editor&apos;s Upload to add new images.
        Alt text is editable below and required for SEO.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((m) => (
          <article key={m.id} className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)]">
            <div className="relative aspect-[4/3] bg-[var(--border)]/40">
              <Image src={m.url} alt={m.alt || m.originalName} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" />
            </div>
            <div className="p-3">
              <p className="truncate text-xs font-medium">{m.originalName}</p>
              <p className="truncate text-[11px] text-[var(--muted)]">{m.url}</p>
              <p className="mt-1 text-[11px] text-[var(--muted)]">
                {Math.round((m.size || 0) / 1024)} KB · {m.mime}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <a href={m.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--accent)] hover:underline">
                  Open ↗
                </a>
                <form action={async () => { "use server"; await deleteMedia(m.id); }}>
                  <button type="submit" className="text-xs text-red-600 hover:underline">Delete</button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!items.length && <p className="mt-6 text-sm text-[var(--muted)]">No media yet. Upload from the post editor.</p>}
    </div>
  );
}
