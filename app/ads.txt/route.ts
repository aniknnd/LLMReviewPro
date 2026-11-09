import { site } from "@/lib/site";

/**
 * ads.txt — served at /ads.txt.
 * Publisher ID comes from NEXT_PUBLIC_ADSENSE_PUB_ID (e.g. "pub-1234567890").
 * Replace placeholder with your real ID before applying to AdSense.
 */
export async function GET() {
  const pubId = site.adsensePublisherId || "pub-0000000000000000";
  const body = `# ads.txt for ${site.url}
# Replace pub-0000000000000000 with your real AdSense publisher ID.
google.com, ${pubId}, DIRECT, f08c47fec094793fa
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
