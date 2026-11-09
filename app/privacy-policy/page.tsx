import type { Metadata } from "next";
import TrustPage from "@/components/TrustPage";
import { buildMetadata } from "@/lib/seo";
import { getPageBySlug } from "@/lib/queries";

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug("privacy-policy").catch(() => null);
  return buildMetadata({
    title: page?.metaTitle || "Privacy Policy",
    description: page?.metaDescription || "How LLM Review Pro collects, uses, and protects personal data.",
    path: "/privacy-policy",
  });
}

export default function PrivacyPolicyPage() {
  return <TrustPage slug="privacy-policy" title="Privacy Policy" path="/privacy-policy" />;
}
