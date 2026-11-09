"use client";

import { useEffect } from "react";

/**
 * Privacy-friendly view counter: fires once per article view
 * (no IP, no fingerprinting, aggregated per-day server-side).
 * Uses navigator.sendBeacon where available (non-blocking).
 */
export default function ViewTracker({ postId }: { postId: number }) {
  useEffect(() => {
    // Fire once on mount / after 1s so LCP isn't disturbed.
    const t = setTimeout(() => {
      try {
        const url = `/api/views/${postId}`;
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url);
        } else {
          fetch(url, { method: "POST", keepalive: true }).catch(() => {});
        }
      } catch {
        /* ignore */
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [postId]);

  return null;
}
