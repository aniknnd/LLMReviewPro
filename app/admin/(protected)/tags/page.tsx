import type { Metadata } from "next";
import { getAllTags } from "@/lib/queries";
import { saveTag, deleteTag } from "@/app/admin/taxonomy/actions";

export const metadata: Metadata = {
  title: "Tags",
  robots: { index: false, follow: false },
};

export default async function AdminTagsPage() {
  const tags = await getAllTags();

  return (
    <div>
      <h1 className="text-3xl font-bold">Tags</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Tags with &lt;3 posts are noindexed automatically.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <form
          action={async (formData: FormData) => {
            "use server";
            await saveTag({ name: String(formData.get("name") || ""), description: String(formData.get("description") || "") });
          }}
          className="h-fit rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5"
        >
          <h2 className="font-bold">New tag</h2>
          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="tag-name" className="block text-sm font-semibold">Name</label>
              <input id="tag-name" name="name" required minLength={1} maxLength={80} className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3" placeholder="GPT-5" />
            </div>
            <div>
              <label htmlFor="tag-desc" className="block text-sm font-semibold">Description</label>
              <textarea id="tag-desc" name="description" rows={2} className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2" />
            </div>
            <button type="submit" className="min-h-[44px] w-full rounded-md bg-[var(--accent)] text-sm font-semibold text-white">
              Create tag
            </button>
          </div>
        </form>

        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--border)]/40 text-left">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {tags.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-medium">#{t.name}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">/tag/{t.slug}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{t.description || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <form action={async () => { "use server"; await deleteTag(t.id); }}>
                      <button type="submit" className="text-sm text-red-600 hover:underline">Delete</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
