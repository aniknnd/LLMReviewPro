"use client";

import { useRef, useState, useTransition } from "react";
import { savePost, deletePost, duplicatePost } from "@/app/admin/(protected)/posts/actions";
import { wordCount, countImagesWithoutAlt, countInternalLinks } from "@/lib/utils";

export interface EditorCategory {
  id: number;
  name: string;
  slug: string;
}
export interface EditorTag {
  id: number;
  name: string;
  slug: string;
}
export interface EditorAuthor {
  id: number;
  name: string;
}

interface Props {
  initial: {
    id?: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    status: "draft" | "scheduled" | "published" | "archived";
    authorId: number;
    categoryId: number | null;
    tagIds: number[];
    featuredImageUrl: string;
    featuredImageAlt: string;
    featured: boolean;
    scheduledAt: string;
    metaTitle: string;
    metaDescription: string;
    canonicalUrl: string;
    ogImage: string;
    focusKeyword: string;
    faqJson: string;
    allowAds: boolean;
    noindex: boolean;
  };
  categories: EditorCategory[];
  tags: EditorTag[];
  authors: EditorAuthor[];
  revalidateSlug: string;
}

type FormState = { error?: string; success?: string; errors?: Record<string, string> } | undefined;

/**
 * Post editor: Markdown textarea + live preview (debounced, server-rendered),
 * SEO fields with live checklist, image upload (WebP via /api/upload),
 * and revision-aware save (server snapshots).
 */
export default function PostEditor({ initial, categories, tags, authors }: Props) {
  const [form, setForm] = useState(initial);
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [state, setState] = useState<FormState>(undefined);
  const [toast, setToast] = useState("");
  const [, startTransition] = useTransition();

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleTag(id: number) {
    setForm((f) => ({
      ...f,
      tagIds: f.tagIds.includes(id) ? f.tagIds.filter((t) => t !== id) : [...f.tagIds, id],
    }));
  }

  async function refreshPreview(md: string) {
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: md }),
      });
      const data = (await res.json()) as { html: string };
      setPreviewHtml(data.html);
    } catch {
      setPreviewHtml("<p><em>Preview unavailable.</em></p>");
    } finally {
      setPreviewLoading(false);
    }
  }

  // Debounced preview on content change.
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  function handleContent(md: string) {
    set("content", md);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void refreshPreview(md), 600);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("alt", form.featuredImageAlt || form.title);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");
      set("featuredImageUrl", data.url);
      setToast("Image uploaded (WebP optimized).");
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      setTimeout(() => setToast(""), 3000);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await savePost({
        id: form.id,
        title: form.title,
        slug: form.slug,
        excerpt: form.excerpt,
        content: form.content,
        status: form.status,
        authorId: form.authorId,
        categoryId: form.categoryId || null,
        tagIds: form.tagIds,
        featuredImageUrl: form.featuredImageUrl,
        featuredImageAlt: form.featuredImageAlt,
        featured: form.featured,
        scheduledAt: form.scheduledAt || null,
        metaTitle: form.metaTitle,
        metaDescription: form.metaDescription,
        canonicalUrl: form.canonicalUrl,
        ogImage: form.ogImage,
        focusKeyword: form.focusKeyword,
        faqJson: form.faqJson || "[]",
        allowAds: form.allowAds,
        noindex: form.noindex,
      });
      setState(res);
      if (res?.success) {
        setToast(res.success);
        setTimeout(() => setToast(""), 3000);
      }
    });
  }

  // SEO checklist (live).
  const words = wordCount(form.content);
  const noAlt = countImagesWithoutAlt(form.content);
  const internalLinks = countInternalLinks(form.content);
  const hasH2 = /^\s*##\s+/m.test(form.content);
  const titleLen = (form.metaTitle || form.title).length;
  const descLen = (form.metaDescription || form.excerpt).length;
  const checklist: Array<{ label: string; ok: boolean; hint: string }> = [
    { label: "Title 30–60 chars", ok: titleLen >= 30 && titleLen <= 60, hint: `${titleLen} chars` },
    { label: "Meta description 120–160 chars", ok: descLen >= 120 && descLen <= 160, hint: `${descLen} chars` },
    { label: "Focus keyword present", ok: form.focusKeyword ? form.content.toLowerCase().includes(form.focusKeyword.toLowerCase()) || form.title.toLowerCase().includes(form.focusKeyword.toLowerCase()) : false, hint: form.focusKeyword || "—" },
    { label: "At least one H2 heading", ok: hasH2, hint: "Use ## for sections" },
    { label: "Images have alt text", ok: noAlt === 0, hint: noAlt ? `${noAlt} missing` : "All good" },
    { label: "≥2 internal links", ok: internalLinks >= 2, hint: `${internalLinks} links` },
    { label: "Word count ≥800", ok: words >= 800, hint: `${words} words` },
    { label: "Featured image set", ok: Boolean(form.featuredImageUrl), hint: form.featuredImageUrl ? "Set" : "Upload one" },
  ];
  const passed = checklist.filter((c) => c.ok).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{form.id ? "Edit post" : "New post"}</h1>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="min-h-[44px] rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white">
            {form.id ? "Save changes" : "Create post"}
          </button>
          {form.id && (
            <>
              <button type="button" onClick={() => startTransition(async () => { await duplicatePost(form.id!); })} className="min-h-[44px] rounded-md border border-[var(--border)] px-4 text-sm font-medium">
                Duplicate
              </button>
              <button type="button" onClick={() => { if (confirm("Delete this post permanently?")) startTransition(async () => { await deletePost(form.id!); }); }} className="min-h-[44px] rounded-md border border-red-300 px-4 text-sm font-medium text-red-700 dark:text-red-300">
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {state.error}
        </p>
      )}
      {toast && (
        <p role="status" className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200">
          {toast}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        {/* Main column */}
        <div className="space-y-5">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold">Title (H1)</label>
            <input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} required minLength={3} maxLength={200} className="mt-1.5 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3" placeholder="GPT-5 vs Claude 4: …" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="slug" className="block text-sm font-semibold">Slug (URL)</label>
              <input id="slug" value={form.slug} onChange={(e) => set("slug", e.target.value)} required className="mt-1.5 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3" placeholder="gpt-5-vs-claude-4" />
              <p className="mt-1 text-xs text-[var(--muted)]">Lowercase, hyphens only. Changing slug adds a 301 redirect automatically.</p>
            </div>
            <div>
              <label htmlFor="focusKeyword" className="block text-sm font-semibold">Focus keyword</label>
              <input id="focusKeyword" value={form.focusKeyword} onChange={(e) => set("focusKeyword", e.target.value)} className="mt-1.5 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3" placeholder="GPT-5 vs Claude 4 benchmark" />
            </div>
          </div>

          <div>
            <label htmlFor="excerpt" className="block text-sm font-semibold">Excerpt (shows on cards + meta fallback)</label>
            <textarea id="excerpt" value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} rows={3} maxLength={500} className="mt-1.5 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2" placeholder="120–160 chars, benefit-first…" />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-semibold">
              Content (Markdown) — {words} words
            </label>
            <textarea
              id="content"
              value={form.content}
              onChange={(e) => handleContent(e.target.value)}
              rows={18}
              spellCheck={false}
              className="mt-1.5 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-sm"
              placeholder={"## Introduction\n\nWrite in Markdown. Use ## for H2s...\n\n| Model | Context |\n|-------|---------|\n\n```ts\ncode\n```\n\n### FAQ\n\n### Question?\nAnswer…"}
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Tables, code fences, and images supported. Add a trailing <code>## FAQ</code> with <code>### Question?</code> for FAQ schema.
            </p>
          </div>

          <div>
            <label htmlFor="faqJson" className="block text-sm font-semibold">FAQ JSON (optional, overrides markdown FAQ)</label>
            <textarea id="faqJson" value={form.faqJson} onChange={(e) => set("faqJson", e.target.value)} rows={4} spellCheck={false} className="mt-1.5 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 font-mono text-xs" placeholder='[{"question":"…","answer":"…"}]' />
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4">
            <p className="font-semibold">Live preview <span className="font-normal text-[var(--muted)]">{previewLoading ? "(updating…)" : ""}</span></p>
            <div className="prose-llm mt-3 max-h-[600px] overflow-auto" dangerouslySetInnerHTML={{ __html: previewHtml || "<p><em>Start typing to preview…</em></p>" }} />
          </div>
        </div>

        {/* Sidebar: SEO + publish */}
        <div className="space-y-5">
          <section aria-label="Publish" className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
            <h2 className="font-bold">Publish</h2>
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="status" className="block text-sm font-semibold">Status</label>
                <select id="status" value={form.status} onChange={(e) => set("status", e.target.value as never)} className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3">
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              {form.status === "scheduled" && (
                <div>
                  <label htmlFor="scheduledAt" className="block text-sm font-semibold">Scheduled for</label>
                  <input id="scheduledAt" type="datetime-local" value={form.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3" />
                  <p className="mt-1 text-xs text-[var(--muted)]">Cron publishes every 5 min (see DEPLOYMENT.md).</p>
                </div>
              )}
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
                Featured (homepage hero)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.allowAds} onChange={(e) => set("allowAds", e.target.checked)} />
                Allow ads on this post
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.noindex} onChange={(e) => set("noindex", e.target.checked)} />
                Noindex (exclude from search)
              </label>
            </div>
          </section>

          <section aria-label="SEO" className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
            <h2 className="font-bold">SEO ({passed}/{checklist.length})</h2>
            <ul className="mt-3 space-y-1.5 text-sm">
              {checklist.map((c) => (
                <li key={c.label} className="flex items-start gap-2">
                  <span aria-hidden="true">{c.ok ? "✅" : "⬜"}</span>
                  <span>
                    {c.label} <span className="text-[var(--muted)]">({c.hint})</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 space-y-3">
              <div>
                <label htmlFor="metaTitle" className="block text-sm font-semibold">Meta title</label>
                <input id="metaTitle" value={form.metaTitle} onChange={(e) => set("metaTitle", e.target.value)} maxLength={80} className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3" placeholder="Defaults to post title" />
                <p className="mt-1 text-right text-xs text-[var(--muted)]">{form.metaTitle.length}/80</p>
              </div>
              <div>
                <label htmlFor="metaDescription" className="block text-sm font-semibold">Meta description</label>
                <textarea id="metaDescription" value={form.metaDescription} onChange={(e) => set("metaDescription", e.target.value)} rows={3} maxLength={180} className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2" placeholder="120–160 chars" />
                <p className="mt-1 text-right text-xs text-[var(--muted)]">{form.metaDescription.length}/180</p>
              </div>
              <div>
                <label htmlFor="canonicalUrl" className="block text-sm font-semibold">Canonical URL (optional)</label>
                <input id="canonicalUrl" value={form.canonicalUrl} onChange={(e) => set("canonicalUrl", e.target.value)} className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3" placeholder="https://… (leave blank = self)" />
              </div>
              <div>
                <label htmlFor="ogImage" className="block text-sm font-semibold">OG image URL (optional)</label>
                <input id="ogImage" value={form.ogImage} onChange={(e) => set("ogImage", e.target.value)} className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3" placeholder="Auto-generated if blank" />
              </div>
            </div>
          </section>

          <section aria-label="Featured image" className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
            <h2 className="font-bold">Featured image</h2>
            {form.featuredImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={form.featuredImageUrl} alt={form.featuredImageAlt || form.title} className="mt-3 rounded-lg" />
            )}
            <div className="mt-3">
              <label htmlFor="featuredImageUrl" className="block text-sm font-semibold">URL</label>
              <input id="featuredImageUrl" value={form.featuredImageUrl} onChange={(e) => set("featuredImageUrl", e.target.value)} className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3" placeholder="/uploads/…" />
            </div>
            <div className="mt-3">
              <label htmlFor="featuredImageAlt" className="block text-sm font-semibold">Alt text</label>
              <input id="featuredImageAlt" value={form.featuredImageAlt} onChange={(e) => set("featuredImageAlt", e.target.value)} maxLength={300} className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3" placeholder="Descriptive alt…" />
            </div>
            <div className="mt-3">
              <label htmlFor="imageFile" className="block text-sm font-semibold">Upload (→ WebP)</label>
              <input id="imageFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} className="mt-1 text-sm" />
              {uploading && <p className="mt-1 text-xs text-[var(--muted)]">Optimizing…</p>}
            </div>
          </section>

          <section aria-label="Taxonomy" className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5">
            <h2 className="font-bold">Author &amp; taxonomy</h2>
            <div className="mt-3 space-y-3">
              <div>
                <label htmlFor="authorId" className="block text-sm font-semibold">Author</label>
                <select id="authorId" value={form.authorId} onChange={(e) => set("authorId", Number(e.target.value))} required className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3">
                  {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="categoryId" className="block text-sm font-semibold">Category</label>
                <select id="categoryId" value={form.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)} className="mt-1 min-h-[44px] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3">
                  <option value="">— None —</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <fieldset>
                <legend className="text-sm font-semibold">Tags</legend>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {tags.map((t) => (
                    <label key={t.id} className="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" checked={form.tagIds.includes(t.id)} onChange={() => toggleTag(t.id)} />
                      #{t.name}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </section>
        </div>
      </div>
    </form>
  );
}
