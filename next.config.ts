import type { NextConfig } from "next";

/**
 * Production Next.js config for a self-hosted VPS (Node + PM2 + Nginx).
 * Classic ISR (generateStaticParams + revalidate) is used; Cache Components
 * are disabled to keep on-demand revalidation predictable for a blog.
 */
const nextConfig: NextConfig = {
  // Classic static + ISR mode (see lib/queries.ts: published-only reads).
  cacheComponents: false,

  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  trailingSlash: false,

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Allow self-hosted uploads + Unsplash-style remote images.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },

  // Security headers (CSP is AdSense-compatible: script/img/frame allowances).
  // AdSense requires *.googlesyndication.com, *.googleads.g.doubleclick.net,
  // *.google.com, *.gstatic.com. If you add Google Analytics/GTM, extend here.
  async headers() {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.googlesyndication.com https://*.googleads.g.doubleclick.net https://*.google.com https://*.gstatic.com https://*.doubleclick.net https://*.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.gstatic.com",
      "img-src 'self' data: blob: https: *.googlesyndication.com *.google.com *.gstatic.com *.doubleclick.net",
      "font-src 'self' data: https://fonts.gstatic.com",
      "frame-src 'self' https://*.googlesyndication.com https://*.google.com https://*.doubleclick.net",
      "connect-src 'self' https://*.googlesyndication.com https://*.google.com https://*.google-analytics.com https://www.google-analytics.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ");

    const common = [
      { key: "Content-Security-Policy", value: csp },
      {
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=()",
      },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
    ];

    return [
      {
        source: "/:path*",
        headers: common,
      },
      {
        // Long-lived caching for immutable static + uploads (Nginx also sets).
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/uploads/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Admin: never cache, never index.
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
