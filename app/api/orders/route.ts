import { NextRequest, NextResponse } from "next/server";
import { getProduct, priceOf, stockOf } from "@/lib/products";
import { insertOrder, newOrderId, OrderItem, useCoupon } from "@/lib/db";
import { checkCoupon } from "@/lib/coupons";
import { shippingFor } from "@/lib/format";
import { vnpayEnabled, vnpayPaymentUrl, momoEnabled, momoPaymentUrl, bankInfo } from "@/lib/payments";

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => null);
  if (!b) return NextResponse.json({ error: "Dữ liệu không hợp lệ" }, { status: 400 });

  const name = String(b.name ?? "").trim();
  const phone = String(b.phone ?? "").trim();
  const address = String(b.address ?? "").trim();
  if (!name || !/^0\d{9}$/.test(phone) || !address)
    return NextResponse.json({ error: "Vui lòng nhập đủ họ tên, số điện thoại và địa chỉ" }, { status: 400 });

  const method = String(b.paymentMethod);
  const allowed = ["cod", ...(bankInfo().accountNo ? ["bank"] : []), ...(vnpayEnabled() ? ["vnpay"] : []), ...(momoEnabled() ? ["momo"] : [])];
  if (!allowed.includes(method))
    return NextResponse.json({ error: "Phương thức thanh toán không khả dụng" }, { status: 400 });

  // Tính lại giá ở server, không tin giá gửi từ trình duyệt
  const items: OrderItem[] = [];
  for (const it of Array.isArray(b.items) ? b.items : []) {
    const p = getProduct(String(it.productId));
    const qty = Math.floor(Number(it.qty));
    if (!p || qty < 1) return NextResponse.json({ error: "Sản phẩm không hợp lệ" }, { status: 400 });
    if (p.variants.length && !p.variants.includes(it.variant))
      return NextResponse.json({ error: `Chưa chọn phân loại cho "${p.name}"` }, { status: 400 });
    const left = stockOf(p, it.variant);
    if (qty > left) return NextResponse.json({ error: `"${p.name}"${it.variant ? ` (${it.variant})` : ""} chỉ còn ${left} sản phẩm` }, { status: 400 });
    items.push({ productId: p.id, name: p.name, variant: it.variant || undefined, price: priceOf(p, it.variant), qty, image: p.images[0] });
  }
  if (!items.length) return NextResponse.json({ error: "Giỏ hàng trống" }, { status: 400 });

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const shipping = shippingFor(subtotal);

  let discount = 0, coupon: string | null = null;
  const code = String(b.coupon ?? "").trim().toUpperCase();
  if (code) {
    const r = await checkCoupon(code, subtotal);
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: 400 });
    if (!(await useCoupon(r.coupon.code))) return NextResponse.json({ error: "Mã giảm giá đã hết lượt dùng" }, { status: 400 });
    discount = r.discount; coupon = r.coupon.code;
  }

  const order = {
    id: newOrderId(), customer_name: name, phone, email: String(b.email ?? "") || null,
    address, note: String(b.note ?? "") || null, items, subtotal, discount, coupon, shipping,
    total: subtotal - discount + shipping, payment_method: method,
  };
  await insertOrder(order);

  let redirect = `/don-hang/${order.id}`;
  try {
    if (method === "vnpay") {
      const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "127.0.0.1";
      redirect = vnpayPaymentUrl(order, ip);
    } else if (method === "momo") {
      redirect = await momoPaymentUrl(order);
    }
  } catch (e) {
    console.error(e);
    redirect = `/don-hang/${order.id}?loi=thanh-toan`;
  }
  return NextResponse.json({ orderId: order.id, redirect });
}
