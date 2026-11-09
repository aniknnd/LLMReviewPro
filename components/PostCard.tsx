import Link from "next/link";
import Image from "next/image";
import type { PostWithRelations } from "@/lib/queries";
import { formatDate, readingTimeLabel, cx } from "@/lib/utils";

interface Props {
  post: PostWithRelations;
  priority?: boolean;
  large?: boolean;
}

/**
 * Accessible article card: semantic <article>, descriptive alt text,
 * lazy images (priority only for hero), date + reading time.
 */
export default function PostCard({ post, priority = false, large = false }: Props) {
  return (
    <article
      className={cx(
        "group flex h-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card-bg)] transition-shadow hover:shadow-md",
        large && "sm:flex-row sm:items-stretch",
      )}
    >
      <Link
        href={`/blog/${post.slug}`}
        className={cx(
          "relative block overflow-hidden bg-[var(--border)]/40",
          large ? "aspect-[16/10] sm:aspect-auto sm:w-2/5" : "aspect-[16/9]",
        )}
        aria-label={post.title}
        tabIndex={-1}
      >
        {post.featuredImageUrl ? (
          <Image
            src={post.featuredImageUrl}
            alt={post.featuredImageAlt || post.title}
            fill
            sizes={large ? "(max-width: 640px) 100vw, 40vw" : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"}
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            priority={priority}
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center p-8 text-center text-sm font-medium text-[var(--muted)]">
            {post.title}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
          {post.category && (
            <Link
              href={`/category/${post.category.slug}`}
              className="rounded-full border border-[var(--border)] px-2.5 py-0.5 font-medium text-[var(--accent)]"
            >
              {post.category.name}
            </Link>
          )}
          <time dateTime={post.publishedAt || post.updatedAt}>
            {formatDate(post.publishedAt || post.updatedAt)}
          </time>
          <span aria-hidden="true">·</span>
          <span>{readingTimeLabel(post.readingTime)}</span>
        </div>

        <h2 className={cx("font-bold leading-snug", large ? "text-2xl" : "text-lg")}>
          <Link href={`/blog/${post.slug}`} className="hover:text-[var(--accent)]">
            {post.title}
          </Link>
        </h2>

        <p className="line-clamp-3 text-sm text-[var(--muted)]">{post.excerpt}</p>

        <div className="mt-auto flex items-center gap-2 pt-2 text-sm">
          <Link
            href={`/author/${post.author.slug}`}
            className="font-medium hover:text-[var(--accent)]"
          >
            {post.author.name}
          </Link>
          <span className="text-[var(--muted)]">—</span>
          <Link
            href={`/blog/${post.slug}`}
            className="text-[var(--accent)] hover:underline"
          >
            Read article →
          </Link>
        </div>
      </div>
    </article>
  );
}
