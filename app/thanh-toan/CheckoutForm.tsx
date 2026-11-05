"use client";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/Cart";
import { vnd, shippingFor, PAYMENT_LABELS } from "@/lib/format";

const HINTS: Record<string, string> = {
  cod: "Trả tiền mặt cho shipper khi nhận hàng",
  bank: "Quét mã QR bằng app ngân hàng, đơn được xác nhận sau khi shop nhận tiền",
  vnpay: "Thanh toán qua cổng VNPay bằng thẻ ATM, Visa/Master hoặc QR",
  momo: "Chuyển sang ví MoMo để thanh toán",
};

export function CheckoutForm({ methods }: { methods: string[] }) {
  const { lines, subtotal, clear } = useCart();
  const [method, setMethod] = useState(methods[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!lines.length)
    return <div className="panel">Giỏ hàng trống. <Link href="/" style={{ color: "var(--brand)" }}>Mua sắm ngay</Link></div>;

  const ship = shippingFor(subtotal);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(""); setBusy(true);
    const f = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...f, paymentMethod: method,
          items: lines.map((l) => ({ productId: l.productId, variant: l.variant, qty: l.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không tạo được đơn hàng");
      clear();
      window.location.href = data.redirect;
    } catch (e) {
      setErr((e as Error).message); setBusy(false);
    }
  }

  return (
    <form className="co" onSubmit={submit}>
      <div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Thông tin nhận hàng</h3>
          <div className="field"><label>Họ và tên *</label><input name="name" required /></div>
          <div className="field"><label>Số điện thoại *</label><input name="phone" required pattern="0[0-9]{9}" title="Số điện thoại 10 số, bắt đầu bằng 0" /></div>
          <div className="field"><label>Email</label><input name="email" type="email" /></div>
          <div className="field"><label>Địa chỉ nhận hàng *</label><textarea name="address" rows={2} required placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" /></div>
          <div className="field"><label>Ghi chú</label><input name="note" /></div>
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Phương thức thanh toán</h3>
          {methods.map((m) => (
            <label key={m} className={`pay ${method === m ? "on" : ""}`}>
              <input type="radio" name="pm" checked={method === m} onChange={() => setMethod(m)} />
              <span>{PAYMENT_LABELS[m]}<small>{HINTS[m]}</small></span>
            </label>
          ))}
        </div>
      </div>
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Đơn hàng ({lines.length} sản phẩm)</h3>
        {lines.map((l, i) => (
          <div key={i} className="sum" style={{ fontSize: 14 }}>
            <span>{l.name}{l.variant ? ` (${l.variant})` : ""} × {l.qty}</span>
            <span>{vnd(l.price * l.qty)}</span>
          </div>
        ))}
        <hr style={{ border: 0, borderTop: "1px solid var(--line)" }} />
        <div className="sum"><span>Tạm tính</span><span>{vnd(subtotal)}</span></div>
        <div className="sum"><span>Phí vận chuyển</span><span>{ship ? vnd(ship) : "Miễn phí"}</span></div>
        <div className="sum total"><span>Tổng cộng</span><span>{vnd(subtotal + ship)}</span></div>
        {err && <p className="err">{err}</p>}
        <button className="btn" style={{ width: "100%", marginTop: 12 }} disabled={busy}>
          {busy ? "Đang xử lý..." : "Đặt hàng"}
        </button>
      </div>
    </form>
  );
}
