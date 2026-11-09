import Link from "next/link";
import { cx } from "@/lib/utils";

interface Props {
  page: number;
  totalPages: number;
  basePath: string; // e.g. "/category/news" — page 1 is basePath, else `${basePath}?page=2`
}

/**
 * Accessible pagination with rel="prev|next", aria-current, and SR labels.
 * Page 1 canonical has no ?page= to keep canonicals clean for SEO.
 */
export default function Pagination({ page, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;

  const href = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);

  const pages: number[] = [];
  const window = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || Math.abs(i - page) <= window) pages.push(i);
  }
  // Dedupe + sort + insert ellipses via string sentinel.
  const deduped = [...new Set(pages)].sort((a, b) => a - b);
  const withEllipsis: Array<number | "…"> = [];
  for (let i = 0; i < deduped.length; i++) {
    const n = deduped[i];
    if (i > 0 && n - deduped[i - 1] > 1) withEllipsis.push("…");
    withEllipsis.push(n);
  }

  const btn =
    "inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md border px-3 text-sm font-medium";
  const active = "border-[var(--accent)] bg-[var(--accent)] text-white";
  const idle = "border-[var(--border)] hover:bg-[var(--border)]/40";

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link rel="prev" href={href(page - 1)} className={cx(btn, idle)}>
          ← Prev
        </Link>
      )}
      {withEllipsis.map((p, i) =>
        p === "…" ? (
          <span key={`e-${i}`} className="px-2 text-[var(--muted)]" aria-hidden="true">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            className={cx(btn, p === page ? active : idle)}
          >
            <span className="sr-only">{p === page ? "Current page " : "Page "}</span>
            {p}
          </Link>
        ),
      )}
      {page < totalPages && (
        <Link rel="next" href={href(page + 1)} className={cx(btn, idle)}>
          Next →
        </Link>
      )}
    </nav>
  );
}
