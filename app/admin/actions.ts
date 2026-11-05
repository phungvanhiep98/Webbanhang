"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, loginAdmin } from "@/lib/admin";
import { setStatus, saveCoupon, setCouponActive, deleteCoupon } from "@/lib/db";
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

export async function saveCouponAction(form: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const n = (k: string) => Math.max(0, Math.floor(Number(String(form.get(k) ?? "").replace(/\D/g, "")) || 0));
  const code = String(form.get("code") ?? "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  const kind = form.get("kind") === "amount" ? "amount" : "percent";
  const value = n("value");
  if (!code || !value || (kind === "percent" && value > 100)) redirect("/admin/ma-giam-gia?loi=1");
  const exp = String(form.get("expires_at") ?? "");
  await saveCoupon({
    code, kind, value, min_order: n("min_order"), max_discount: kind === "percent" ? n("max_discount") : 0,
    max_uses: n("max_uses"), used: 0, expires_at: /^\d{4}-\d{2}-\d{2}$/.test(exp) ? exp : null, active: true,
  });
  revalidatePath("/admin/ma-giam-gia");
  redirect("/admin/ma-giam-gia");
}

export async function toggleCouponAction(form: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  await setCouponActive(String(form.get("code")), form.get("active") === "1");
  revalidatePath("/admin/ma-giam-gia");
}

export async function deleteCouponAction(form: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  await deleteCoupon(String(form.get("code")));
  revalidatePath("/admin/ma-giam-gia");
}
