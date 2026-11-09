import type { Metadata } from "next";
import TrustPage from "@/components/TrustPage";
import { buildMetadata } from "@/lib/seo";
import { getPageBySlug } from "@/lib/queries";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("cookie-policy").catch(() => null);
  return buildMetadata({
    title: page?.metaTitle || "Cookie Policy",
    description: page?.metaDescription || "Cookies and consent on LLM Review Pro, including AdSense.",
    path: "/cookie-policy",
  });
}

export default function CookiePolicyPage() {
  return <TrustPage slug="cookie-policy" title="Cookie Policy" path="/cookie-policy" />;
}
