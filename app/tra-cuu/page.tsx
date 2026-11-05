import type { Metadata } from "next";
import Link from "next/link";
import { ordersByPhone } from "@/lib/db";
import { vnd, STATUS_LABELS } from "@/lib/format";
import { RecentOrders } from "./RecentOrders";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tra cứu đơn hàng" };

export default async function Lookup({ searchParams }: { searchParams: Promise<{ sdt?: string }> }) {
  const phone = ((await searchParams).sdt ?? "").replace(/\D/g, "");
  const valid = /^0\d{9}$/.test(phone);
  const orders = valid ? await ordersByPhone(phone) : [];
  return (
    <>
      <div className="panel" style={{ maxWidth: 720, margin: "0 auto 16px" }}>
        <h2 style={{ marginTop: 0 }}>Tra cứu đơn hàng</h2>
        <form className="row" style={{ margin: 0 }}>
          <input name="sdt" defaultValue={phone} placeholder="Nhập số điện thoại đã dùng khi đặt hàng" inputMode="tel"
            style={{ flex: 1, minWidth: 200, padding: "10px 12px", border: "1px solid #ccc", borderRadius: 2, fontSize: 15 }} />
          <button className="btn">Tra cứu</button>
        </form>
        {phone && !valid && <p className="err">Số điện thoại gồm 10 số, bắt đầu bằng 0.</p>}
      </div>

      {valid && (
        <div className="panel" style={{ maxWidth: 720, margin: "0 auto 16px" }}>
          {orders.length === 0 ? (
            <p>Không tìm thấy đơn hàng nào với số {phone}.</p>
          ) : (
            <table>
              <thead><tr><th>Mã đơn</th><th>Ngày đặt</th><th>Tổng tiền</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><Link href={`/don-hang/${o.id}`} style={{ color: "var(--brand)" }}>{o.id}</Link>
                      <div className="muted" style={{ fontSize: 13 }}>{o.items.reduce((s, i) => s + i.qty, 0)} sản phẩm</div></td>
                    <td className="muted">{new Date(o.created_at).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td>
                    <td className="price">{vnd(o.total)}</td>
                    <td><span className={`tag ${o.status}`}>{STATUS_LABELS[o.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!valid && <RecentOrders />}
    </>
  );
}
