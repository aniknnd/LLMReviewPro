import Link from "next/link";
import { site } from "@/lib/site";
import ThemeToggle from "./ThemeToggle";
import SearchForm from "./SearchForm";
import { getPostsByCategory } from "@/lib/queries";

export default async function Header() {
  // Latest tutorials for the dropdown (fast indexed query).
  const { posts: tutorials } = await getPostsByCategory("tutorials", 1, 8).catch(() => ({ posts: [] as never[] }));

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/90 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/70">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 font-bold tracking-tight"
          aria-label={`${site.name} home`}
        >
          <span
            className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--accent)] text-white"
            aria-hidden="true"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2.5a5.5 5.5 0 0 1 3.4 9.9" />
              <path d="M12 2.5A5.5 5.5 0 0 0 8.6 12.4" />
              <path d="M12 21.5a5.5 5.5 0 0 1-3.4-9.9" />
              <path d="M12 21.5a5.5 5.5 0 0 0 3.4-9.9" />
              <circle cx="12" cy="12" r="2.2" />
            </svg>
          </span>
          <span className="hidden sm:block">
            <span className="block text-[15px] leading-none">{site.name}</span>
            <span className="block text-[11px] font-medium text-[var(--muted)]">
              LLM news &amp; reviews
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav aria-label="Primary" className="ml-2 hidden items-center gap-1 md:flex">
          <Link href="/blog" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-[var(--border)]/40">
            Articles
          </Link>
          <Link href="/category/comparisons" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-[var(--border)]/40">
            Comparisons
          </Link>

          {/* Tutorials dropdown (hover/focus) */}
          <div className="group relative">
            <Link
              href="/category/tutorials"
              aria-haspopup="true"
              aria-expanded="false"
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium hover:bg-[var(--border)]/40 group-focus-within:bg-[var(--border)]/40"
            >
              Tutorials
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="transition-transform group-hover:rotate-180">
                <path d="M4 6l4 4 4-4" />
              </svg>
            </Link>
            <div className="invisible absolute left-0 top-full z-50 w-80 translate-y-1 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-2 opacity-0 shadow-xl transition-all duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                Latest tutorials
              </p>
              <ul className="max-h-96 overflow-auto" aria-label="Tutorials">
                {tutorials.map((t) => (
                  <li key={t.slug}>
                    <Link
                      href={`/blog/${t.slug}`}
                      className="block rounded-lg px-3 py-2.5 text-sm leading-snug hover:bg-[var(--border)]/50"
                    >
                      <span className="font-medium">{t.title}</span>
                      <span className="block text-xs text-[var(--muted)]">{t.readingTime} min read</span>
                    </Link>
                  </li>
                ))}
                {!tutorials.length && (
                  <li className="px-3 py-2 text-sm text-[var(--muted)]">No tutorials yet.</li>
                )}
              </ul>
              <div className="border-t border-[var(--border)] p-2">
                <Link href="/category/tutorials" className="block rounded-lg px-3 py-2 text-center text-sm font-semibold text-[var(--accent)] hover:bg-[var(--border)]/50">
                  View all tutorials →
                </Link>
              </div>
            </div>
          </div>

          <Link href="/archive" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-[var(--border)]/40">
            Archive
          </Link>
        </nav>

        {/* Search + theme */}
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <SearchForm compact />
          </div>
          <ThemeToggle />
          <Link
            href="/search"
            className="rounded-md border border-[var(--border)] p-2 sm:hidden"
            aria-label="Search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Mobile nav: horizontal scroll incl. tutorials */}
      <nav aria-label="Primary (mobile)" className="border-t border-[var(--border)] md:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 sm:px-6">
          <Link href="/blog" className="shrink-0 rounded-md px-3 py-2 text-sm font-medium">Articles</Link>
          <Link href="/category/comparisons" className="shrink-0 rounded-md px-3 py-2 text-sm font-medium">Comparisons</Link>
          <details className="group shrink-0">
            <summary className="cursor-pointer list-none rounded-md px-3 py-2 text-sm font-medium">Tutorials ▾</summary>
            <div className="fixed inset-x-4 top-auto z-50 mt-1 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-2 shadow-xl" style={{ top: "108px" }}>
              <ul className="max-h-80 overflow-auto">
                {tutorials.map((t) => (
                  <li key={t.slug}>
                    <Link href={`/blog/${t.slug}`} className="block rounded-lg px-3 py-2.5 text-sm font-medium">
                      {t.title}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link href="/category/tutorials" className="mt-1 block rounded-lg bg-[var(--border)]/50 px-3 py-2 text-center text-sm font-semibold text-[var(--accent)]">
                View all tutorials →
              </Link>
            </div>
          </details>
          <Link href="/archive" className="shrink-0 rounded-md px-3 py-2 text-sm font-medium">Archive</Link>
        </div>
      </nav>
    </header>
  );
}
