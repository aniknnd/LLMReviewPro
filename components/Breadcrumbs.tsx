import Link from "next/link";

export interface Crumb {
  name: string;
  href: string;
}

/**
 * Semantic breadcrumb nav with aria-label + ordered list.
 * Mirrors BreadcrumbList JSON-LD (see lib/seo.ts).
 */
export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-[var(--muted)]">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.href}-${i}`} className="flex items-center gap-1">
              {i > 0 && (
                <span aria-hidden="true" className="mx-1">
                  /
                </span>
              )}
              {isLast ? (
                <span aria-current="page" className="font-medium text-[var(--foreground)]">
                  {item.name}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-[var(--accent)] hover:underline">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
