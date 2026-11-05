import { getCoupon, type Coupon } from "@/lib/db";

// Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD
const todayVN = () => new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

export function discountFor(c: Coupon, subtotal: number) {
  const raw = c.kind === "percent" ? Math.floor((subtotal * c.value) / 100) : c.value;
  const capped = c.kind === "percent" && c.max_discount > 0 ? Math.min(raw, c.max_discount) : raw;
  return Math.max(0, Math.min(capped, subtotal));
}

export function describe(c: Coupon) {
  const k = (n: number) => (n % 1000 === 0 ? `${n / 1000}k` : n.toLocaleString("vi-VN") + "₫");
  let s = c.kind === "percent" ? `Giảm ${c.value}%` : `Giảm ${k(c.value)}`;
  if (c.kind === "percent" && c.max_discount) s += ` (tối đa ${k(c.max_discount)})`;
  if (c.min_order) s += ` cho đơn từ ${k(c.min_order)}`;
  return s;
}

// Kiểm tra mã; trả về số tiền giảm hoặc lý do không dùng được
export async function checkCoupon(code: string, subtotal: number): Promise<{ coupon: Coupon; discount: number } | { error: string }> {
  const c = await getCoupon(code);
  if (!c || !c.active) return { error: "Mã giảm giá không đúng hoặc đã ngừng áp dụng" };
  if (c.expires_at && todayVN() > c.expires_at) return { error: "Mã giảm giá đã hết hạn" };
  if (c.max_uses && c.used >= c.max_uses) return { error: "Mã giảm giá đã hết lượt dùng" };
  if (subtotal < c.min_order) return { error: `Mã này áp dụng cho đơn từ ${c.min_order.toLocaleString("vi-VN")}₫` };
  return { coupon: c, discount: discountFor(c, subtotal) };
}
