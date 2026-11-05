"use client";
import { useEffect, useState } from "react";
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
  const [code, setCode] = useState("");
  const [cp, setCp] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [cpErr, setCpErr] = useState("");

  // Tạm tính đổi (sửa giỏ ở tab khác) thì kiểm tra lại mã
  useEffect(() => {
    if (cp) applyCode(cp.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  async function applyCode(c = code) {
    setCpErr("");
    if (!c.trim()) return setCp(null);
    const res = await fetch(`/api/coupons?code=${encodeURIComponent(c.trim())}&subtotal=${subtotal}`);
    const data = await res.json();
    if (!res.ok) { setCp(null); setCpErr(data.error); } else setCp(data);
  }

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
          ...f, paymentMethod: method, coupon: cp?.code ?? "",
          items: lines.map((l) => ({ productId: l.productId, variant: l.variant, qty: l.qty })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Không tạo được đơn hàng");
      clear();
      try {
        const mine = JSON.parse(localStorage.getItem("my_orders") || "[]");
        localStorage.setItem("my_orders", JSON.stringify([data.orderId, ...mine].slice(0, 20)));
      } catch {}
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
        <div className="coupon">
          <input placeholder="Mã giảm giá" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCode(); } }} />
          <button type="button" className="btn sm ghost" onClick={() => applyCode()}>Áp dụng</button>
        </div>
        {cpErr && <p className="err" style={{ margin: "4px 0" }}>{cpErr}</p>}
        {cp && (
          <div className="sum" style={{ color: "var(--ok)" }}>
            <span>Mã {cp.code} <small className="muted">({cp.label})</small> <button type="button" className="link-btn" onClick={() => { setCp(null); setCode(""); }}>Bỏ</button></span>
            <span>−{vnd(cp.discount)}</span>
          </div>
        )}
        <div className="sum"><span>Phí vận chuyển</span><span>{ship ? vnd(ship) : "Miễn phí"}</span></div>
        <div className="sum total"><span>Tổng cộng</span><span>{vnd(subtotal - (cp?.discount ?? 0) + ship)}</span></div>
        {err && <p className="err">{err}</p>}
        <button className="btn" style={{ width: "100%", marginTop: 12 }} disabled={busy}>
          {busy ? "Đang xử lý..." : "Đặt hàng"}
        </button>
      </div>
    </form>
  );
}
