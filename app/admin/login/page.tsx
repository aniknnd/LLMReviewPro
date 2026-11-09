import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import LoginForm from "@/components/admin/LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata({
    title: "Admin login",
    description: "Sign in to the LLM Review Pro admin dashboard.",
    path: "/admin/login",
    noindex: true,
  });
}

export default function AdminLoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-8">
        <h1 className="text-2xl font-bold">Admin sign in</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Access is restricted. Sessions are httpOnly and expire in 7 days.
          <br />
          <Link href="/" className="text-[var(--accent)] hover:underline">
            ← Back to site
          </Link>
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
