import { NextRequest, NextResponse } from "next/server";
import { momoVerify } from "@/lib/payments";
import { getOrder, setStatus } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const r = momoVerify(body);
  if (!r.ok) return new NextResponse(null, { status: 400 });
  const order = await getOrder(r.orderId);
  if (order && order.status === "pending" && r.success && r.amount === order.total)
    await setStatus(order.id, "paid", r.transId);
  return new NextResponse(null, { status: 204 });
}
