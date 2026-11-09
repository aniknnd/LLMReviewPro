"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import Link from "next/link";
import { site } from "@/lib/site";

/**
 * Consent banner + AdSense loader.
 *
 * - Ads script loads ONLY after consent (`llmreviewpro_consent==='accepted'`).
 * - If NEXT_PUBLIC_GOOGLE_CMP_URL is set, a Google-certified CMP script is
 *   loaded instead of the built-in banner (required pattern for EEA/UK/CH).
 * - Banner is non-blocking (bottom bar, dismissible), never covers article text.
 * - Stores first-party consent flag (localStorage + cookie) with description.
 */
export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const cmpUrl = site.googleCmpEnabled;
  const pubId = site.adsensePublisherId;

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("llmreviewpro_consent");
    } catch {
      stored = null;
    }
    if (stored === "accepted" || stored === "rejected") {
      setShow(false);
      if (stored === "accepted") loadAds();
    } else if (!cmpUrl) {
      setShow(true);
    } else {
      // CMP present: let the CMP script decide; we just wait for its signal.
      const t = setTimeout(() => setShow(false), 50);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cmpUrl]);

  function loadAds() {
    if (loaded || !pubId || !site.adsEnabled) return;
    // AdSense loader (idempotent).
    if (!document.querySelector('script[src*="adsbygoogle"]')) {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${pubId}`;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
    setLoaded(true);
  }

  function accept() {
    try {
      localStorage.setItem("llmreviewpro_consent", "accepted");
    } catch { /* ignore */ }
    document.cookie = "llmreviewpro_consent=accepted; path=/; max-age=31536000; SameSite=Lax";
    setShow(false);
    loadAds();
    window.dispatchEvent(new CustomEvent("llmreviewpro:consent", { detail: "accepted" }));
  }

  function reject() {
    try {
      localStorage.setItem("llmreviewpro_consent", "rejected");
    } catch { /* ignore */ }
    document.cookie = "llmreviewpro_consent=rejected; path=/; max-age=31536000; SameSite=Lax";
    setShow(false);
    window.dispatchEvent(new CustomEvent("llmreviewpro:consent", { detail: "rejected" }));
  }

  // When a CMP script URL is configured, render it and no banner.
  if (cmpUrl) {
    return (
      <Script src={cmpUrl} strategy="afterInteractive" onLoad={loadAds} />
    );
  }

  if (!show) {
    // Still ensure ads load when consent already accepted from a prior session.
    return <ConsentPreload pubId={pubId} />;
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] bg-[var(--card-bg)] p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-[var(--muted)]">
          We use cookies to improve the site and to serve ads after your consent.
          Essential cookies are always on. Read our{" "}
          <Link href="/cookie-policy" className="font-medium text-[var(--accent)] hover:underline">
            Cookie Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={reject}
            className="min-h-[44px] rounded-md border border-[var(--border)] px-4 text-sm font-medium"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={accept}
            className="min-h-[44px] rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-white"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}

/** Loads AdSense when consent already exists (SPA navigation after accept). */
function ConsentPreload({ pubId }: { pubId: string }) {
  useEffect(() => {
    if (!pubId || !site.adsEnabled) return;
    let c: string | null = null;
    try {
      c = localStorage.getItem("llmreviewpro_consent");
    } catch { /* ignore */ }
    if (c !== "accepted") return;
    if (!document.querySelector('script[src*="adsbygoogle"]')) {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${pubId}`;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
  }, [pubId]);
  return null;
}
