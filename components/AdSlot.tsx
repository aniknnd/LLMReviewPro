"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";

/**
 * Reusable AdSense <AdSlot />.
 *
 * - Reserved height prevents CLS (layout shift) — Lighthouse-friendly.
 * - Lazy-loads via IntersectionObserver (below-fold ads don't block LCP).
 * - Renders NOTHING when: ads disabled (env), no publisher ID, consent not
 *   granted (`llmreviewpro_consent==='accepted'`), or on admin/404/search/thin
 *   pages (parent controls mounting; see app routes).
 * - Max 2–3 per page is enforced by the parent placing ≤3 instances.
 */
interface Props {
  /** AdSense ad unit ID (data-ad-slot), e.g. "1234567890" */
  slot?: string;
  /** e.g. in-article, leaderboard, rectangle */
  format?: "auto" | "horizontal" | "rectangle" | "vertical";
  /** Responsive style hint */
  className?: string;
  label?: string;
  /** Reserved min-height in px (CLS guard). */
  minHeight?: number;
}

export default function AdSlot({
  slot,
  format = "auto",
  className = "",
  label = "Advertisement",
  minHeight = 90,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  const pubId = site.adsensePublisherId;
  const enabled = site.adsEnabled && Boolean(pubId) && Boolean(slot);

  // Respect consent: AdSense script only loads after acceptance.
  useEffect(() => {
    if (!enabled) return;
    try {
      const c = localStorage.getItem("llmreviewpro_consent");
      if (c === "accepted") setReady(true);
    } catch {
      /* private mode */
    }
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === "accepted") setReady(true);
    };
    window.addEventListener("llmreviewpro:consent", onChange);
    return () => window.removeEventListener("llmreviewpro:consent", onChange);
  }, [enabled]);

  // Lazy: only render <ins> when near viewport.
  useEffect(() => {
    if (!ready || !ref.current) return;
    const el = ref.current;
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setVisible(true);
            io.disconnect();
          }
        },
        { rootMargin: "400px 0px" },
      );
      io.observe(el);
      return () => io.disconnect();
    }
    setVisible(true);
  }, [ready]);

  useEffect(() => {
    if (!visible || !ref.current) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch {
      /* adblocker */
    }
  }, [visible]);

  if (!enabled || !ready) return null;

  return (
    <div
      ref={ref}
      className={`ad-reserve w-full overflow-hidden ${className}`}
      style={{ minHeight }}
      aria-label={label}
      role="complementary"
      data-ad-slot={slot}
    >
      <p className="pb-1 text-center text-[10px] uppercase tracking-widest text-[var(--muted)]">
        {label}
      </p>
      <div style={{ minHeight: minHeight - 18 }} className="flex items-center justify-center">
        {visible ? (
          <ins
            className="adsbygoogle"
            style={{ display: "block", width: "100%" }}
            data-ad-client={`ca-${pubId}`}
            data-ad-slot={slot}
            data-ad-format={format}
            data-full-width-responsive="true"
          />
        ) : (
          <div
            style={{ minHeight: minHeight - 18 }}
            className="grid w-full place-items-center rounded-md border border-dashed border-[var(--border)] text-xs text-[var(--muted)]"
          >
            Ad placeholder — loads when scrolled into view.
          </div>
        )}
      </div>
    </div>
  );
}
