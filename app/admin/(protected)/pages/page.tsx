import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { pages } from "@/lib/schema";
import { pageSchema } from "@/lib/validators";
import { verifySession } from "@/lib/dal";
import { renderMarkdown } from "@/lib/markdown";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pages",
  robots: { index: false, follow: false },
};

async function savePage(formData: FormData) {
  "use server";
  await verifySession();
  const parsed = pageSchema.safeParse({
    slug: formData.get("slug"),
    title: formData.get("title"),
    content: formData.get("content"),
    metaTitle: formData.get("metaTitle") || "",
    metaDescription: formData.get("metaDescription") || "",
  });
  if (!parsed.success) return;
  const now = new Date().toISOString();
  const html = await renderMarkdown(parsed.data.content);
  await db
    .insert(pages)
    .values({
      slug: parsed.data.slug,
      title: parsed.data.title,
      content: parsed.data.content,
      contentHtml: html,
      metaTitle: parsed.data.metaTitle,
      metaDescription: parsed.data.metaDescription,
      updatedAt: now,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: pages.slug,
      set: {
        title: parsed.data.title,
        content: parsed.data.content,
        contentHtml: html,
        metaTitle: parsed.data.metaTitle,
        metaDescription: parsed.data.metaDescription,
        updatedAt: now,
      },
    });
  revalidatePath(`/${parsed.data.slug}`);
  revalidatePath("/about");
}

export default async function AdminPagesPage() {
  const rows = await db.select().from(pages).orderBy(pages.slug);

  return (
    <div>
      <h1 className="text-3xl font-bold">Static pages</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Trust pages (About, Privacy, Terms…) are editable Markdown.
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--border)]/40 text-left">
              <tr>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3 font-mono text-xs">/{p.slug}</td>
                  <td className="px-4 py-3">{p.title}</td>
                  <td className="px-4 py-3">{formatDate(p.updatedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/${p.slug}`} className="text-[var(--accent)] hover:underline">View ↗</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <form action={savePage} className="h-fit space-y-3 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
          <h2 className="font-bold">Edit / create page</h2>
          <div>
            <label htmlFor="pg-slug" className="block text-sm font-semibold">Slug</label>
            <input id="pg-slug" name="slug" required pattern="[a-z0-9-]+" className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3" placeholder="about" />
            <p className="mt-1 text-xs text-[var(--muted)]">Existing slugs: about, privacy-policy, terms-of-service…</p>
          </div>
          <div>
            <label htmlFor="pg-title" className="block text-sm font-semibold">Title</label>
            <input id="pg-title" name="title" required minLength={2} className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3" />
          </div>
          <div>
            <label htmlFor="pg-content" className="block text-sm font-semibold">Content (Markdown)</label>
            <textarea id="pg-content" name="content" required rows={10} className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-sm" />
          </div>
          <div>
            <label htmlFor="pg-mt" className="block text-sm font-semibold">Meta title</label>
            <input id="pg-mt" name="metaTitle" maxLength={80} className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3" />
          </div>
          <div>
            <label htmlFor="pg-md" className="block text-sm font-semibold">Meta description</label>
            <textarea id="pg-md" name="metaDescription" rows={2} maxLength={180} className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2" />
          </div>
          <button type="submit" className="min-h-[44px] w-full rounded-md bg-[var(--accent)] text-sm font-semibold text-white">
            Save page
          </button>
        </form>
      </div>
    </div>
  );
}
