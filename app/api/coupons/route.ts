import { NextRequest, NextResponse } from "next/server";
import { checkCoupon, describe } from "@/lib/coupons";

// Xem trước mã giảm giá ở trang thanh toán. Số tiền thật được tính lại khi đặt đơn.
export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("code") ?? "").trim().toUpperCase();
  const subtotal = Math.max(0, Number(req.nextUrl.searchParams.get("subtotal")) || 0);
  if (!code) return NextResponse.json({ error: "Nhập mã giảm giá" }, { status: 400 });
  const r = await checkCoupon(code, subtotal);
  if ("error" in r) return NextResponse.json(r, { status: 400 });
  return NextResponse.json({ code: r.coupon.code, discount: r.discount, label: describe(r.coupon) });
}
