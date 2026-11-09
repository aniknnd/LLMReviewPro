/**
 * Data Access Layer (DAL): centralized session verification.
 * Per Next.js Authentication guide — use React `cache()` to dedupe
 * per-request, redirect unauthenticated users from protected segments.
 */
import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "./auth";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

export const verifySession = cache(async () => {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/admin/login");
  }
  return { isAuth: true, userId: session.userId, email: session.email, role: session.role };
});

export const getCurrentAdmin = cache(async () => {
  const session = await getSession();
  if (!session?.userId) return null;
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  return rows[0] ?? null;
});

/** Non-redirecting variant for layout checks / API routes. */
export const getSessionSafe = cache(async () => {
  const session = await getSession();
  return session;
});
