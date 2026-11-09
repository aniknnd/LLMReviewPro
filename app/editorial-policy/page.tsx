import type { Metadata } from "next";
import TrustPage from "@/components/TrustPage";
import { buildMetadata } from "@/lib/seo";
import { getPageBySlug } from "@/lib/queries";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("editorial-policy").catch(() => null);
  return buildMetadata({
    title: page?.metaTitle || "Editorial & Content Policy",
    description: page?.metaDescription || "How LLM Review Pro writes, reviews, and corrects content.",
    path: "/editorial-policy",
    keywords: ["editorial policy", "AI content policy", "LLM Review Pro"],
  });
}

export default function EditorialPage() {
  return <TrustPage slug="editorial-policy" title="Editorial & Content Policy" path="/editorial-policy" />;
}
