import type { Metadata } from "next";
import TrustPage from "@/components/TrustPage";
import { buildMetadata } from "@/lib/seo";
import { getPageBySlug } from "@/lib/queries";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("disclaimer").catch(() => null);
  return buildMetadata({
    title: page?.metaTitle || "Disclaimer",
    description: page?.metaDescription || "Affiliate, trademark, and accuracy disclaimer for LLM Review Pro.",
    path: "/disclaimer",
  });
}

export default function DisclaimerPage() {
  return <TrustPage slug="disclaimer" title="Disclaimer" path="/disclaimer" />;
}
