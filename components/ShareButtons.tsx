"use client";

import { useState } from "react";
import { site } from "@/lib/site";

/**
 * Lightweight share buttons (no heavy SDKs).
 * Uses native Web Share API when available, else builds share URLs.
 */
export default function ShareButtons({ slug, title }: { slug: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const url = `${site.url}/blog/${slug}`;
  const text = `${title} — ${site.name}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const links = [
    { label: "X (Twitter)", href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, icon: "𝕏" },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`, icon: "f" },
    { label: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`, icon: "in" },
    { label: "Reddit", href: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedText}`, icon: "◉" },
  ];

  async function handleNative() {
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* dismissed */
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="Share this article">
      <button
        type="button"
        onClick={handleNative}
        className="rounded-md border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--border)]/40"
      >
        {copied ? "Link copied ✓" : "Share ↗"}
      </button>
      <span className="sr-only">Share on:</span>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Share on ${l.label}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-3 py-2 text-sm hover:bg-[var(--border)]/40"
        >
          <span aria-hidden="true" className="font-bold">{l.icon}</span>
          <span className="hidden sm:inline">{l.label.split(" ")[0]}</span>
        </a>
      ))}
    </div>
  );
}
