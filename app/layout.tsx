import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieConsent from "@/components/CookieConsent";
import { site, absoluteUrl } from "@/lib/site";
import { websiteJsonLd, organizationJsonLd, escapeJsonLd } from "@/lib/seo";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  keywords: ["LLM", "Large Language Models", "GPT-5", "Claude", "Gemini", "AI reviews", "AI benchmarks"],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  publisher: site.name,
  category: "technology",
  alternates: {
    canonical: site.url,
    types: {
      "application/rss+xml": site.rssUrl,
    },
  },
  openGraph: {
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    locale: site.locale,
    type: "website",
    images: [
      {
        url: `${site.url}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: site.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
    site: site.twitterHandle,
    images: [`${site.url}/opengraph-image`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: site.adsenseVerification
    ? { google: site.adsenseVerification }
    : undefined,
  icons: {
    icon: "/icon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f0d" },
  ],
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("llmreviewpro-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  const website = websiteJsonLd();
  const org = organizationJsonLd();
  const gaId = site.gaId;

  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="alternate" type="application/rss+xml" title={`${site.name} RSS`} href={absoluteUrl("/feed.xml")} />
        {site.adsenseVerification && (
          <meta name="google-site-verification" content={site.adsenseVerification} />
        )}
        {/* Google Analytics 4 (gtag.js) — loads afterInteractive, no render block. */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script
              id="gtag-config"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');`,
              }}
            />
          </>
        )}
      </head>
      <body className="flex min-h-screen flex-col">
        {/* Global JSON-LD: WebSite (+SearchAction) + Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: escapeJsonLd(website) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: escapeJsonLd(org) }}
        />

        <a href="#main-content" className="skip-link">
          Skip to content
        </a>

        <Header />

        <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>

        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}
