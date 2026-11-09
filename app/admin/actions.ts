"use server";

import { redirect } from "next/navigation";
import { verifySession } from "@/lib/dal";
import { deleteSession } from "@/lib/auth";

/** Admin logout. */
export async function logout() {
  await verifySession();
  await deleteSession();
  redirect("/admin/login");
}
