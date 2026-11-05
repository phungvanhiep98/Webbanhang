import { NextRequest, NextResponse } from "next/server";
import { vnpayVerify } from "@/lib/payments";
import { getOrder, setStatus } from "@/lib/db";

// VNPay gọi server-to-server để báo kết quả (khai báo URL này trong trang quản trị VNPay)
export async function GET(req: NextRequest) {
  const r = vnpayVerify(req.nextUrl.searchParams);
  if (!r.ok) return NextResponse.json({ RspCode: "97", Message: "Invalid signature" });
  const order = getOrder(r.orderId);
  if (!order) return NextResponse.json({ RspCode: "01", Message: "Order not found" });
  if (r.amount !== order.total) return NextResponse.json({ RspCode: "04", Message: "Invalid amount" });
  if (order.status !== "pending") return NextResponse.json({ RspCode: "02", Message: "Order already confirmed" });
  setStatus(order.id, r.success ? "paid" : "cancelled", r.transactionNo);
  return NextResponse.json({ RspCode: "00", Message: "Confirm Success" });
}
