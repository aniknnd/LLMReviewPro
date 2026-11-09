"use client";

import { useState, useTransition } from "react";
import { saveCategory, deleteCategory } from "@/app/admin/taxonomy/actions";

export default function CategoryForm({
  categories,
}: {
  categories: Array<{ id: number; name: string; slug: string }>;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [, start] = useTransition();

  // Simple create-only form; editing via direct slug fields below.
  return (
    <form
      className="h-fit rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        start(async () => {
          await saveCategory({ name, description, seoTitle });
          setName("");
          setDescription("");
          setSeoTitle("");
        });
      }}
    >
      <h2 className="font-bold">New category</h2>
      <div className="mt-3 space-y-3">
        <div>
          <label htmlFor="cat-name" className="block text-sm font-semibold">Name</label>
          <input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3" placeholder="Comparisons" />
        </div>
        <div>
          <label htmlFor="cat-desc" className="block text-sm font-semibold">Description</label>
          <textarea id="cat-desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2" />
        </div>
        <div>
          <label htmlFor="cat-seo" className="block text-sm font-semibold">SEO title (optional)</label>
          <input id="cat-seo" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={80} className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3" />
        </div>
        <button type="submit" className="min-h-[44px] w-full rounded-md bg-[var(--accent)] text-sm font-semibold text-white">
          Create category
        </button>
      </div>
      {categories.length > 0 && (
        <p className="mt-3 text-xs text-[var(--muted)]">Tip: delete via the list buttons in the table → Actions.</p>
      )}
    </form>
  );
}

export function CategoryDeleteButton({ id }: { id: number }) {
  return (
    <button
      type="button"
      onClick={() => {
        if (confirm("Delete this category? Posts keep their category cleared.")) {
          deleteCategory(id);
        }
      }}
      className="text-sm text-red-600 hover:underline"
    >
      Delete
    </button>
  );
}
