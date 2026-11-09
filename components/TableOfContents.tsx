"use client";

import { useState } from "react";
import type { TocItem } from "@/lib/markdown";
import { cx } from "@/lib/utils";

/**
 * Auto-generated TOC from H2/H3 headings.
 * Collapses on mobile (details-like button) to keep content above the fold.
 */
export default function TableOfContents({ items }: { items: TocItem[] }) {
  const [open, setOpen] = useState(false);
  if (!items.length) return null;

  return (
    <nav
      aria-label="Table of contents"
      className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-5"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="toc-list"
        className="flex w-full items-center justify-between text-sm font-semibold md:cursor-default"
      >
        <span>On this page</span>
        <span className="md:hidden" aria-hidden="true">
          {open ? "▾" : "▸"}
        </span>
      </button>
      <ul
        id="toc-list"
        className={cx(
          "mt-3 space-y-2 text-sm",
          open ? "block" : "hidden md:block",
        )}
      >
        {items.map((item) => (
          <li key={item.id} className={cx(item.depth === 3 && "pl-4 text-[13px]")}>
            <a
              href={`#${item.id}`}
              className="text-[var(--muted)] hover:text-[var(--accent)] hover:underline"
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
