import Link from "next/link";
import { site } from "@/lib/site";

const trustLinks = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-of-service", label: "Terms of Service" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/editorial-policy", label: "Editorial Policy" },
];

const exploreLinks = [
  { href: "/blog", label: "All articles" },
  { href: "/models", label: "All models" },
  { href: "/category/news", label: "News" },
  { href: "/category/comparisons", label: "Comparisons" },
  { href: "/category/tutorials", label: "Tutorials" },
  { href: "/archive", label: "Archive" },
  { href: "/feed.xml", label: "RSS feed" },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-[var(--border)] bg-[var(--card-bg)]">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-bold">{site.name}</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{site.description}</p>
          <p className="mt-3 text-xs text-[var(--muted)]">
            {/* Affiliate disclosure for AdSense trust signals */}
            We may earn a commission when you buy via links on this site — at no extra cost to you.
          </p>
        </div>

        <nav aria-label="Explore">
          <p className="text-sm font-semibold">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            {exploreLinks.map((l) => (
              <li key={l.href}>
                <Link className="text-[var(--muted)] hover:text-[var(--foreground)]" href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Trust">
          <p className="text-sm font-semibold">Trust &amp; Legal</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {trustLinks.map((l) => (
              <li key={l.href}>
                <Link className="text-[var(--muted)] hover:text-[var(--foreground)]" href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-sm">
            <Link href="/contact" className="font-medium text-[var(--accent)] hover:underline">
              Send feedback →
            </Link>
          </p>
        </nav>
      </div>

      <div className="border-t border-[var(--border)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-[var(--muted)] sm:flex-row sm:px-6">
          <p>© {year} {site.name}. All rights reserved.</p>
          <p>
            Model names are trademarks of their owners. Benchmarks are estimates — verify before purchasing.
          </p>
        </div>
      </div>
    </footer>
  );
}
