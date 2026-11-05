"use client";
import Link from "next/link";
import { useCart } from "@/components/Cart";
import { vnd, shippingFor, FREE_SHIP_FROM } from "@/lib/format";

export default function CartPage() {
  const { lines, setQty, remove, subtotal } = useCart();
  if (!lines.length)
    return (
      <div className="panel" style={{ textAlign: "center", padding: 60 }}>
        <p>Giỏ hàng của bạn đang trống.</p>
        <Link href="/" className="btn">Tiếp tục mua sắm</Link>
      </div>
    );
  const ship = shippingFor(subtotal);
  return (
    <div className="co">
      <div className="panel">
        <table>
          <thead><tr><th>Sản phẩm</th><th className="hide-sm">Đơn giá</th><th>Số lượng</th><th>Thành tiền</th><th></th></tr></thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i}>
                <td>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {l.image && <img src={l.image} alt="" className="thumb" referrerPolicy="no-referrer" />}
                    <div>{l.name}{l.variant && <div className="muted">Phân loại: {l.variant}</div>}</div>
                  </div>
                </td>
                <td className="hide-sm">{vnd(l.price)}</td>
                <td>
                  <div className="qty">
                    <button onClick={() => setQty(i, l.qty - 1)}>−</button>
                    <input value={l.qty} onChange={(e) => setQty(i, Number(e.target.value) || 1)} />
                    <button onClick={() => setQty(i, l.qty + 1)}>+</button>
                  </div>
                </td>
                <td className="price">{vnd(l.price * l.qty)}</td>
                <td><button className="btn sm ghost" onClick={() => remove(i)}>Xóa</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel">
        <div className="sum"><span>Tạm tính</span><span>{vnd(subtotal)}</span></div>
        <div className="sum"><span>Phí vận chuyển</span><span>{ship ? vnd(ship) : "Miễn phí"}</span></div>
        {ship > 0 && <div className="muted" style={{ fontSize: 13 }}>Mua thêm {vnd(FREE_SHIP_FROM - subtotal)} để được miễn phí vận chuyển</div>}
        <div className="sum total"><span>Tổng cộng</span><span>{vnd(subtotal + ship)}</span></div>
        <Link href="/thanh-toan" className="btn" style={{ width: "100%", marginTop: 12 }}>Thanh toán</Link>
      </div>
    </div>
  );
}
