"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, loginAdmin } from "@/lib/admin";
import { setStatus } from "@/lib/db";
import { STATUS_LABELS } from "@/lib/format";

export async function login(form: FormData) {
  const ok = await loginAdmin(String(form.get("password") ?? ""));
  redirect(ok ? "/admin" : "/admin?sai=1");
}

export async function updateStatus(form: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const status = String(form.get("status"));
  if (!(status in STATUS_LABELS)) throw new Error("Bad status");
  await setStatus(String(form.get("id")), status);
  revalidatePath("/admin");
}
