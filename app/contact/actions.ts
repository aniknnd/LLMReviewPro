"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/schema";
import { contactSchema } from "@/lib/validators";
import { rateLimit, ipKey } from "@/lib/rate-limit";

export type ContactState =
  | {
      success?: boolean;
      error?: string;
      errors?: { name?: string; email?: string; message?: string };
    }
  | undefined;

/**
 * Contact form Server Action.
 * - Zod validation on the server.
 * - Rate limit: 5 messages / 10 min per IP (privacy-friendly hashed key).
 * - Honeypot (`company`) silently drops bots.
 */
export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // Rate limit (best-effort).
  let ip: string | null = null;
  try {
    const h = await headers();
    ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip");
  } catch {
    /* ignore */
  }
  const rl = rateLimit(`contact:${ipKey(ip)}`, { max: 5, windowMs: 10 * 60 * 1000 });
  if (!rl.allowed) {
    return { error: "Too many messages. Please try again in a few minutes." };
  }

  const parsed = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject") || "",
    message: formData.get("message"),
    company: formData.get("company") || "",
  });

  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const fieldErrors = flat.fieldErrors as Record<string, string[] | undefined>;
    return {
      errors: {
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        message: fieldErrors.message?.[0],
      },
    };
  }

  // Honeypot: bots get a fake success (no DB write, no error signal).
  if (parsed.data.company) {
    return { success: true };
  }

  try {
    await db.insert(contactMessages).values({
      name: parsed.data.name,
      email: parsed.data.email,
      subject: parsed.data.subject,
      message: parsed.data.message,
    });
    return { success: true };
  } catch (err) {
    console.error("[contact] insert failed", err);
    return { error: "Something went wrong. Please try again." };
  }
}
