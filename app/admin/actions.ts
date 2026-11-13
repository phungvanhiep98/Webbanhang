"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdmin, loginAdmin } from "@/lib/admin";
import { saveCoupon, setCouponActive, deleteCoupon, saveProductEdit, listProductEdits, listPosts, savePost, deletePost, setSetting } from "@/lib/db";
import { slugify, STATIC_POSTS } from "@/lib/blog";
import { changeStatus } from "@/lib/orders";
import { products } from "@/lib/products";
import { connectTelegram, sendTelegram } from "@/lib/notify";
import { STATUS_LABELS } from "@/lib/format";

export async function login(form: FormData) {
  const ok = await loginAdmin(String(form.get("password") ?? ""));
  redirect(ok ? "/admin" : "/admin?sai=1");
}

export async function updateStatus(form: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const status = String(form.get("status"));
  if (!(status in STATUS_LABELS)) throw new Error("Bad status");
  await changeStatus(String(form.get("id")), status);
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

// Lưu giá, tồn kho, ẩn/hiện của một sản phẩm
export async function saveProductAction(form: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const id = String(form.get("id"));
  const p = products.find((x) => x.id === id);
  if (!p) throw new Error("Không có sản phẩm");
  const old = (await listProductEdits()).find((e) => e.id === id);
  const keys = p.variants.length ? p.variants : [""];
  const n = (v: FormDataEntryValue | null) => { const s = String(v ?? "").replace(/\D/g, ""); return s === "" ? null : Number(s); };
  const prices: Record<string, number> = {}, stock: Record<string, number> = {};
  keys.forEach((k, i) => {
    const pr = n(form.get(`price_${i}`)), st = n(form.get(`stock_${i}`));
    if (pr != null && pr > 0) prices[k] = pr;
    if (st != null) stock[k] = st;
  });
  await saveProductEdit({ id, hidden: form.get("hidden") === "1", prices, stock, sold_extra: old?.sold_extra ?? 0 });
  revalidatePath("/admin/san-pham");
  redirect(`/admin/san-pham?ok=${id}`);
}

export async function connectTelegramAction() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const r = await connectTelegram();
  redirect(r.ok ? `/admin/thong-bao?ok=${encodeURIComponent(r.name)}` : `/admin/thong-bao?loi=${encodeURIComponent(r.error)}`);
}

export async function testTelegramAction() {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const ok = await sendTelegram("🔔 Tin nhắn thử từ web shop. Nhận được là thông báo đã hoạt động!");
  redirect(ok ? "/admin/thong-bao?thu=1" : "/admin/thong-bao?loi=" + encodeURIComponent("Không gửi được, hãy bấm Kết nối lại"));
}

export async function savePostAction(form: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const title = get("title");
  const old = get("old_slug") || null;
  const slug = slugify(get("slug") || title);
  if (!title || !slug) redirect(`/admin/bai-viet/${old ?? "moi"}?loi=1`);
  const all = [...(await listPosts()), ...STATIC_POSTS];
  const existing = all.find((p) => p.slug === (old ?? slug));
  if (!old && existing) redirect("/admin/bai-viet/moi?trung=1");
  const now = new Date().toISOString();
  const cover = get("cover");
  await savePost({
    slug, title, excerpt: get("excerpt"), content: String(form.get("content") ?? ""),
    cover: /^https?:\/\//.test(cover) ? cover : "", published: form.get("published") === "1",
    created_at: existing?.created_at ?? now, updated_at: now,
  }, old);
  revalidatePath("/blog");
  redirect(`/admin/bai-viet?ok=${slug}`);
}

export async function deletePostAction(form: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  const slug = String(form.get("slug"));
  const st = STATIC_POSTS.find((p) => p.slug === slug);
  // Bài có sẵn trong code không xóa hẳn được: chuyển thành ẩn
  if (st) await savePost({ ...st, published: false, updated_at: new Date().toISOString() });
  else await deletePost(slug);
  redirect("/admin/bai-viet");
}

export async function saveAboutAction(form: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  await setSetting("about", String(form.get("about") ?? "").trim());
  redirect("/admin/bai-viet?about=1");
}

export async function saveAnnounceAction(form: FormData) {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  await setSetting("announce_text", String(form.get("text") ?? "").trim().slice(0, 160));
  await setSetting("announce_on", form.get("on") === "1" ? "1" : "0");
  revalidatePath("/", "layout");
  redirect("/admin/ma-giam-gia?saved=1");
}
