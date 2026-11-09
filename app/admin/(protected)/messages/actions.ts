"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/schema";
import { verifySession } from "@/lib/dal";

export async function markRead(id: number) {
  await verifySession();
  await db.update(contactMessages).set({ isRead: true }).where(eq(contactMessages.id, id));
  revalidatePath("/admin/messages");
  revalidatePath("/admin/layout");
}

export async function deleteMessage(id: number) {
  await verifySession();
  await db.delete(contactMessages).where(eq(contactMessages.id, id));
  revalidatePath("/admin/messages");
}
