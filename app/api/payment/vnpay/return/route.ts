import { NextRequest, NextResponse } from "next/server";
import { vnpayVerify } from "@/lib/payments";
import { getOrder } from "@/lib/db";
import { changeStatus } from "@/lib/orders";

// Khách được VNPay chuyển về đây sau khi thanh toán
export async function GET(req: NextRequest) {
  const r = vnpayVerify(req.nextUrl.searchParams);
  const order = r.orderId ? await getOrder(r.orderId) : undefined;
  if (!order) return NextResponse.redirect(new URL("/", req.url));
  if (r.ok && r.success && r.amount === order.total && order.status === "pending")
    await changeStatus(order.id, "paid", r.transactionNo);
  const q = r.ok && r.success ? "" : "?loi=thanh-toan";
  return NextResponse.redirect(new URL(`/don-hang/${order.id}${q}`, req.url));
}
