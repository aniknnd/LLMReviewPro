import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { searchPosts } from "@/lib/queries";
import PostCard from "@/components/PostCard";
import SearchForm from "@/components/SearchForm";
import Pagination from "@/components/Pagination";

export const dynamic = "force-dynamic"; // Results depend on ?q=; noindex.

interface Props {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return buildMetadata({
    title: q ? `Search: “${q}”` : "Search",
    description: q ? `Search results for “${q}” on LLM Review Pro.` : "Search LLM articles.",
    path: q ? `/search?q=${encodeURIComponent(q)}` : "/search",
    noindex: true, // Search pages are noindex (thin/duplicate risk).
  });
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "", page: raw } = await searchParams;
  const query = q.trim();
  const page = Math.max(1, Number(raw) || 1);
  const perPage = 12;

  const { posts, total } = query ? await searchPosts(query, page, perPage) : { posts: [], total: 0 };
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      <h1 className="text-4xl font-bold">Search</h1>
      <div className="mt-6 max-w-2xl">
        <SearchForm defaultValue={query} />
      </div>

      {!query ? (
        <p className="mt-8 text-[var(--muted)]">
          Type a query above — e.g. “GPT-5 pricing” or “fine-tuning”.
          Or browse{" "}
          <Link href="/blog" className="text-[var(--accent)] hover:underline">
            all articles
          </Link>
          .
        </p>
      ) : (
        <>
          <p className="mt-8 text-[var(--muted)]" role="status">
            {total} {total === 1 ? "result" : "results"} for “{query}”
            {page > 1 ? ` · page ${page} of ${totalPages}` : ""}
          </p>
          {posts.length ? (
            <>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <PostCard key={post.slug} post={post} />
                ))}
              </div>
              {/* No ads on search (policy + UX). */}
              <Pagination
                page={page}
                totalPages={totalPages}
                basePath={`/search?q=${encodeURIComponent(query)}`}
              />
            </>
          ) : (
            <div className="mt-6 rounded-xl border border-[var(--border)] p-8">
              <h2 className="text-xl font-bold">No results found</h2>
              <p className="mt-2 text-[var(--muted)]">
                Try different keywords, or browse the{" "}
                <Link href="/archive" className="text-[var(--accent)] hover:underline">
                  archive
                </Link>{" "}
                and{" "}
                <Link href="/blog" className="text-[var(--accent)] hover:underline">
                  latest articles
                </Link>
                .
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
