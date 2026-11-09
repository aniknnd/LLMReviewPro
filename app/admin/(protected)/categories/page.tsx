import type { Metadata } from "next";
import { getAllCategories } from "@/lib/queries";
import CategoryForm from "@/components/admin/CategoryForm";

export const metadata: Metadata = {
  title: "Categories",
  robots: { index: false, follow: false },
};

export default async function AdminCategoriesPage() {
  const categories = await getAllCategories();

  return (
    <div>
      <h1 className="text-3xl font-bold">Categories</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Create or edit categories. Slugs are URL-safe.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[360px_1fr]">
        <CategoryForm categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))} />
        <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--border)]/40 text-left">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {categories.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">/category/{c.slug}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{c.description || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
