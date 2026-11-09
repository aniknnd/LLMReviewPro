import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";
import { buildMetadata } from "@/lib/seo";
import { getLatestPosts } from "@/lib/queries";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import Breadcrumbs from "@/components/Breadcrumbs";
import AdSlot from "@/components/AdSlot";

export const revalidate = 3600;

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { page } = await searchParams;
  const p = page ? Number(page) : 1;
  const suffix = p && p > 1 ? ` — Page ${p}` : "";
  return buildMetadata({
    title: `All articles${suffix}`,
    description: `Every LLM article on ${site.name}: news, comparisons, reviews, and tutorials.`,
    path: p && p > 1 ? `/blog?page=${p}` : "/blog",
  });
}

export default async function BlogIndexPage({ searchParams }: Props) {
  const { page: raw } = await searchParams;
  const page = Math.max(1, Number(raw) || 1);
  const perPage = site.postsPerPage;
  // Fetch a pool and paginate in-memory for simplicity (VPS-friendly).
  const all = await getLatestPosts(200);
  const totalPages = Math.max(1, Math.ceil(all.length / perPage));
  const safePage = Math.min(page, totalPages);
  const posts = all.slice((safePage - 1) * perPage, safePage * perPage);

  return (
    <div>
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Articles", href: "/blog" },
        ]}
      />
      <h1 className="text-4xl font-bold">All articles</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        Every guide, benchmark, and review — newest first.
        {safePage > 1 ? ` Page ${safePage} of ${totalPages}.` : ""}
      </p>

      {posts.length ? (
        <>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <div key={post.slug}>
                <PostCard post={post} priority={i < 3 && safePage === 1} />
                {i === 5 && (
                  <div className="mt-6">
                    <AdSlot slot={process.env.NEXT_PUBLIC_ADS_SLOT_BLOG || "3333333333"} format="horizontal" label="Advertisement" minHeight={90} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <Pagination page={safePage} totalPages={totalPages} basePath="/blog" />
        </>
      ) : (
        <p className="mt-8 text-[var(--muted)]">
          No articles yet.{" "}
          <Link href="/" className="text-[var(--accent)] hover:underline">
            Back to home
          </Link>
          .
        </p>
      )}
    </div>
  );
}
