"use client";

import { logout } from "@/app/admin/actions";

export default function LogoutButton() {
  return (
    <form action={logout}>
      <button
        type="submit"
        className="min-h-[44px] w-full rounded-md border border-[var(--border)] px-3 text-sm font-medium hover:bg-[var(--border)]/40"
      >
        Sign out
      </button>
    </form>
  );
}
