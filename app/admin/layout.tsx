import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * Pass-through layout for /admin*.
 * The protected `(protected)` group has its own auth layout, so /admin/login
 * (public) is NOT wrapped by the auth check. Without this split, the login
 * page would redirect to itself (infinite loop).
 */
export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
