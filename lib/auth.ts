/**
 * Session management: stateless JWT via `jose` + httpOnly cookies.
 * Follows Next.js Authentication guide (Stateless Sessions pattern).
 *
 * - Passwords hashed with bcryptjs (cost 10).
 * - SESSION_SECRET (min 32 chars) signs HS256 tokens.
 * - Cookie: httpOnly, Secure (prod), SameSite=lax, 7-day expiry.
 */
import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export interface SessionPayload {
  userId: number;
  email: string;
  role: "admin" | "editor";
  expiresAt: Date;
}

const COOKIE_NAME = "llmreviewpro_session";
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set (min 32 chars). Generate with: openssl rand -base64 32",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  const key = getSecretKey();
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(
  session: string | undefined | null,
): Promise<{ userId: number; email: string; role: "admin" | "editor" } | null> {
  if (!session) return null;
  try {
    const key = getSecretKey();
    const { payload } = await jwtVerify(session, key, {
      algorithms: ["HS256"],
    });
    if (typeof payload.userId !== "number" || !payload.email) return null;
    return {
      userId: payload.userId as number,
      email: payload.email as string,
      role: (payload.role as "admin" | "editor") || "editor",
    };
  } catch {
    return null;
  }
}

export async function createSession(user: {
  id: number;
  email: string;
  role: "admin" | "editor";
}): Promise<void> {
  const expiresAt = new Date(Date.now() + MAX_AGE_SECONDS * 1000);
  const session = await encrypt({
    userId: user.id,
    email: user.email,
    role: user.role,
    expiresAt,
  });
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<{
  userId: number;
  email: string;
  role: "admin" | "editor";
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  return decrypt(token);
}

/**
 * CSRF protection: rely on SameSite=lax + Origin/Referer check for Server
 * Actions (Next.js Server Actions already require same-origin). This helper
 * validates mutations on route handlers/forms that set their own token.
 */
export function verifyCsrf(requestOrigin: string | null): boolean {
  const expected = process.env.NEXT_PUBLIC_SITE_URL;
  if (!expected) return true; // dev without env
  if (!requestOrigin) return true;
  try {
    return new URL(requestOrigin).origin === new URL(expected).origin;
  } catch {
    return false;
  }
}
