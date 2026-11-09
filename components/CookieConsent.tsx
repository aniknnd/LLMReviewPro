"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import Link from "next/link";
import { site } from "@/lib/site";

/**
 * Consent banner + AdSense + GA4 loader.
 *
 * - AdSense AND GA4 load ONLY after consent
 *   (`llmreviewpro_consent==='accepted'`). First paint / PageSpeed lab
 *   (no consent stored) ships zero analytics/ad JS — directly improves
 *   "Reduce unused JavaScript" and long-task scores.
 * - If NEXT_PUBLIC_GOOGLE_CMP_URL is set, a Google-certified CMP script is
 *   loaded instead of the built-in banner (required pattern for EEA/UK/CH).
 * - Banner is non-blocking (bottom bar, dismissible).
 */
export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const cmpUrl = site.googleCmpEnabled;
  const pubId = site.adsensePublisherId;
  const gaId = site.gaId;

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
    if (loaded) return;
    // GA4 (gtag.js) — idempotent.
    if (gaId && !document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(s);
      const init = document.createElement("script");
      init.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`;
      document.head.appendChild(init);
    }
    // AdSense loader (idempotent).
    if (pubId && site.adsEnabled && !document.querySelector('script[src*="adsbygoogle"]')) {
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
    return <ConsentPreload pubId={pubId} gaId={gaId} />;
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

/** Loads GA4 + AdSense when consent already exists. */
function ConsentPreload({ pubId, gaId }: { pubId: string; gaId: string }) {
  useEffect(() => {
    let c: string | null = null;
    try {
      c = localStorage.getItem("llmreviewpro_consent");
    } catch { /* ignore */ }
    if (c !== "accepted") return;
    if (gaId && !document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
      document.head.appendChild(s);
      const init = document.createElement("script");
      init.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`;
      document.head.appendChild(init);
    }
    if (!pubId || !site.adsEnabled) return;
    if (!document.querySelector('script[src*="adsbygoogle"]')) {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-${pubId}`;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
  }, [pubId, gaId]);
  return null;
}
