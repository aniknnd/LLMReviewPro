import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { getDashboardStats } from "@/lib/queries";
import LogoutButton from "@/components/admin/LogoutButton";
import { site } from "@/lib/site";

const NAV: Array<{ href: string; label: string }> = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/posts", label: "Posts" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/tags", label: "Tags" },
  { href: "/admin/authors", label: "Authors" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/pages", label: "Pages" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/backup", label: "Backup" },
];

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Throws → redirect("/admin/login") when unauthenticated.
  const session = await verifySession();
  const stats = await getDashboardStats().catch(() => ({ unreadMessages: 0 }));

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-4 lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center justify-between">
          <p className="font-bold">Admin</p>
          <span className="text-xs text-[var(--muted)]">{session.email}</span>
        </div>
        <nav aria-label="Admin" className="mt-4 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-[var(--border)]/50"
            >
              {item.label}
              {item.href === "/admin/messages" && stats.unreadMessages > 0 && (
                <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                  {stats.unreadMessages}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-4 border-t border-[var(--border)] pt-3">
          <LogoutButton />
          <Link href="/" className="mt-3 block px-3 text-sm text-[var(--muted)] hover:text-[var(--accent)]">
            ← View site ({site.name})
          </Link>
        </div>
      </aside>

      <div className="min-w-0">{children}</div>
    </div>
  );
}
