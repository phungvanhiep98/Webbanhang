import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getOrder } from "@/lib/db";
import { changeStatus } from "@/lib/orders";

// SePay gọi vào đây mỗi khi tài khoản ngân hàng có giao dịch.
// Cấu hình trên my.sepay.vn: Webhook URL = <SITE_URL>/api/payment/sepay,
// xác thực "API Key", key trùng với biến môi trường SEPAY_API_KEY.
const ok = () => NextResponse.json({ success: true });

function authorized(req: NextRequest) {
  const key = process.env.SEPAY_API_KEY;
  if (!key) return false;
  const got = req.headers.get("authorization") ?? "";
  const want = `Apikey ${key}`;
  return got.length === want.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(want));
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ success: false }, { status: 401 });
  const t = await req.json().catch(() => null);
  if (!t || t.transferType !== "in") return ok();

  // Mã đơn có dạng DH + 6 số ngày + 5 ký tự, nằm trong nội dung chuyển khoản
  const text = `${t.code ?? ""} ${t.content ?? ""} ${t.description ?? ""}`.toUpperCase();
  const id = text.match(/DH\d{6}[A-Z0-9]{5}/)?.[0];
  if (!id) return ok();

  const order = await getOrder(id);
  if (!order || order.status !== "pending") return ok(); // không có đơn hoặc đã xử lý (SePay gửi lại)
  if (Number(t.transferAmount) < order.total) {
    console.warn(`SePay: đơn ${id} chuyển thiếu ${t.transferAmount}/${order.total}`);
    return ok();
  }
  await changeStatus(id, "paid", `SePay ${t.referenceCode || t.id}`);
  return ok();
}
