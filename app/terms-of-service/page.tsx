import type { Metadata } from "next";
import TrustPage from "@/components/TrustPage";
import { buildMetadata } from "@/lib/seo";
import { getPageBySlug } from "@/lib/queries";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("terms-of-service").catch(() => null);
  return buildMetadata({
    title: page?.metaTitle || "Terms of Service",
    description: page?.metaDescription || "Terms of use for LLM Review Pro.",
    path: "/terms-of-service",
    keywords: ["terms of service", "LLM Review Pro terms"],
  });
}

export default function TermsPage() {
  return <TrustPage slug="terms-of-service" title="Terms of Service" path="/terms-of-service" />;
}
