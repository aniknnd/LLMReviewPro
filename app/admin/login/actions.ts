"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { loginSchema } from "@/lib/validators";
import { createSession, verifyPassword } from "@/lib/auth";
import { rateLimit, ipKey } from "@/lib/rate-limit";

export type LoginState =
  | {
      error?: string;
      errors?: { email?: string; password?: string };
    }
  | undefined;

/**
 * Login Server Action.
 * - Zod validation.
 * - Rate limit 10 / 15 min per IP (Argon2/bcrypt compare is expensive).
 * - Constant-time-ish: always compare even if user missing (dummy hash).
 */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  let ip: string | null = null;
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip");
  } catch {
    /* ignore */
  }
  const key = `login:${ipKey(ip)}`;
  const rl = rateLimit(key, { max: 10, windowMs: 15 * 60 * 1000 });
  if (!rl.allowed) {
    return {
      error: `Too many login attempts. Try again in ${Math.ceil(rl.resetMs / 60000)} minute(s).`,
    };
  }

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const fe = flat.fieldErrors as Record<string, string[] | undefined>;
    return {
      errors: { email: fe.email?.[0], password: fe.password?.[0] },
    };
  }

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  const user = rows[0];

  // Dummy hash to avoid user-enumeration timing leaks.
  const DUMMY_HASH =
    "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
  const hash = user?.passwordHash || DUMMY_HASH;
  const ok = await verifyPassword(parsed.data.password, hash).catch(() => false);

  if (!user || !ok) {
    return { error: "Invalid email or password." };
  }

  await createSession({ id: user.id, email: user.email, role: user.role });

  const next = (formData.get("next") as string) || "/admin";
  const safeNext = next.startsWith("/admin") ? next : "/admin";
  redirect(safeNext);
}
