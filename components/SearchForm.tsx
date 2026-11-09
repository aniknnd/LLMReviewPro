import Link from "next/link";

interface Props {
  compact?: boolean;
  defaultValue?: string;
}

/**
 * Server-rendered search form → GET /search?q=…
 * No client JS (works with JS disabled, tiny bundle).
 */
export default function SearchForm({ compact = false, defaultValue = "" }: Props) {
  return (
    <form
      action="/search"
      method="get"
      role="search"
      className="flex w-full items-center gap-2"
    >
      <label htmlFor={compact ? "header-search" : "site-search"} className="sr-only">
        Search articles
      </label>
      <input
        id={compact ? "header-search" : "site-search"}
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search LLMs…"
        autoComplete="off"
        className="min-h-[40px] w-full min-w-0 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 text-sm placeholder:text-[var(--muted)]"
      />
      <button
        type="submit"
        className="min-h-[40px] shrink-0 rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"
      >
        Search
      </button>
    </form>
  );
}

export function SearchLinkFallback() {
  return (
    <p className="text-sm text-[var(--muted)]">
      Tip: use search from the header, or browse{" "}
      <Link href="/blog" className="text-[var(--accent)] hover:underline">
        all articles
      </Link>{" "}
      and{" "}
      <Link href="/archive" className="text-[var(--accent)] hover:underline">
        the archive
      </Link>
      .
    </p>
  );
}
