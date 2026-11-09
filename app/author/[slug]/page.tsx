import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { buildMetadata, personJsonLd, breadcrumbJsonLd, escapeJsonLd } from "@/lib/seo";
import { getPostsByAuthor, getAllAuthors } from "@/lib/queries";
import { renderMarkdown } from "@/lib/markdown";
import Breadcrumbs from "@/components/Breadcrumbs";
import PostCard from "@/components/PostCard";
import Pagination from "@/components/Pagination";
import { site } from "@/lib/site";

export const revalidate = 3600;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateStaticParams() {
  const authors = await getAllAuthors().catch(() => []);
  return authors.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { author } = await getPostsByAuthor(slug, 1, 1).catch(() => ({ author: null }));
  if (!author) {
    return buildMetadata({ title: "Author not found", description: "Author not found.", path: `/author/${slug}`, noindex: true });
  }
  return buildMetadata({
    title: `${author.name} — Articles & Bio`,
    description: author.bio || `Articles by ${author.name} on ${site.name}.`,
    path: `/author/${slug}`,
    keywords: [`${author.name} LLM`, `${author.name} articles`, `${author.name} bio`, `${author.title} LLM`],
  });
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: raw } = await searchParams;
  const page = Math.max(1, Number(raw) || 1);

  const { posts, total, author } = await getPostsByAuthor(slug, page);
  if (!author) notFound();

  const totalPages = Math.max(1, Math.ceil(total / site.postsPerPage));
  const bioHtml = author.bioMd ? await renderMarkdown(author.bioMd) : "";

  const person = personJsonLd({
    name: author.name,
    slug: author.slug,
    title: author.title,
    bio: author.bio,
    avatar: author.avatarUrl,
    twitter: author.twitter,
    github: author.github,
    linkedin: author.linkedin,
    website: author.website,
    expertise: author.expertise,
  });
  const crumbs = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: author.name, path: `/author/${slug}` },
  ]);

  const socials = [
    author.twitter && { label: "X / Twitter", href: author.twitter.startsWith("http") ? author.twitter : `https://x.com/${author.twitter.replace("@", "")}` },
    author.github && { label: "GitHub", href: author.github.startsWith("http") ? author.github : `https://github.com/${author.github.replace("github.com/", "")}` },
    author.linkedin && { label: "LinkedIn", href: author.linkedin.startsWith("http") ? author.linkedin : `https://linkedin.com/in/${author.linkedin}` },
    author.website && { label: "Website", href: author.website },
  ].filter(Boolean) as Array<{ label: string; href: string }>;

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(person) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: escapeJsonLd(crumbs) }} />
      <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: author.name, href: `/author/${slug}` }]} />

      <header className="flex flex-col gap-6 sm:flex-row sm:items-center">
        {author.avatarUrl ? (
          <Image src={author.avatarUrl} alt={`${author.name} portrait`} width={120} height={120} className="rounded-full" />
        ) : (
          <span className="grid h-[120px] w-[120px] place-items-center rounded-full bg-[var(--accent)] text-4xl font-bold text-white" aria-hidden="true">
            {author.name.slice(0, 1)}
          </span>
        )}
        <div>
          <h1 className="text-4xl font-bold">{author.name}</h1>
          <p className="mt-1 font-medium text-[var(--muted)]">{author.title}</p>
          {author.credentials && <p className="mt-1 text-sm text-[var(--muted)]">{author.credentials}</p>}
          {author.expertise && (
            <p className="mt-2 text-sm">
              <span className="font-semibold">Expertise:</span> {author.expertise}
            </p>
          )}
          {socials.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2 text-sm">
              {socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-[var(--border)] px-3 py-1 hover:border-[var(--accent)]">
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {author.bio && <p className="mt-6 max-w-3xl text-lg">{author.bio}</p>}
      {bioHtml && (
        <div className="prose-llm mt-4 max-w-3xl" dangerouslySetInnerHTML={{ __html: bioHtml }} />
      )}

      <section aria-labelledby="author-posts-heading" className="mt-12">
        <h2 id="author-posts-heading" className="text-2xl font-bold">
          Articles by {author.name}
          <span className="ml-2 text-base font-normal text-[var(--muted)]">({total})</span>
        </h2>
        {posts.length ? (
          <>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.slug} post={post} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} basePath={`/author/${slug}`} />
          </>
        ) : (
          <p className="mt-4 text-[var(--muted)]">No published articles yet.</p>
        )}
      </section>
    </div>
  );
}
