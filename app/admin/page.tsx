import { isAdmin } from "@/lib/admin";
import { listOrders } from "@/lib/db";
import { vnd, PAYMENT_LABELS, STATUS_LABELS } from "@/lib/format";
import { login, updateStatus } from "./actions";

export const dynamic = "force-dynamic";

export default async function Admin({ searchParams }: { searchParams: Promise<{ sai?: string; s?: string }> }) {
  const { sai, s } = await searchParams;
  if (!(await isAdmin()))
    return (
      <form action={login} className="panel" style={{ maxWidth: 380, margin: "40px auto" }}>
        <h2 style={{ marginTop: 0 }}>Quản lý shop</h2>
        <div className="field"><label>Mật khẩu</label><input name="password" type="password" required /></div>
        {sai && <p className="err">Sai mật khẩu</p>}
        <button className="btn" style={{ width: "100%" }}>Đăng nhập</button>
      </form>
    );

  const all = await listOrders();
  const orders = s ? all.filter((o) => o.status === s) : all;
  const revenue = all.filter((o) => ["paid", "confirmed", "shipping", "completed"].includes(o.status)).reduce((t, o) => t + o.total, 0);

  return (
    <>
      <div className="panel" style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
        <div><div className="muted">Tổng đơn</div><b style={{ fontSize: 24 }}>{all.length}</b></div>
        <div><div className="muted">Chờ xử lý</div><b style={{ fontSize: 24 }}>{all.filter((o) => o.status === "pending").length}</b></div>
        <div><div className="muted">Doanh thu (đã thanh toán / đang xử lý)</div><b style={{ fontSize: 24 }} className="price">{vnd(revenue)}</b></div>
      </div>
      <div className="chips">
        <a href="/admin" className={`chip ${!s ? "on" : ""}`}>Tất cả</a>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <a key={k} href={`/admin?s=${k}`} className={`chip ${s === k ? "on" : ""}`}>{v}</a>
        ))}
      </div>
      <div className="panel" style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>Mã đơn</th><th>Thời gian</th><th>Khách hàng</th><th>Sản phẩm</th><th>Tổng</th><th>Thanh toán</th><th>Trạng thái</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><a href={`/don-hang/${o.id}`} style={{ color: "var(--brand)" }}>{o.id}</a></td>
                <td className="muted">{new Date(o.created_at).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</td>
                <td>{o.customer_name}<br /><span className="muted">{o.phone}<br />{o.address}</span>{o.note && <div className="muted">Ghi chú: {o.note}</div>}</td>
                <td>{o.items.map((i, k) => <div key={k}>{i.name}{i.variant ? ` (${i.variant})` : ""} × {i.qty}</div>)}</td>
                <td className="price">{vnd(o.total)}</td>
                <td>{PAYMENT_LABELS[o.payment_method]?.split(" (")[0]}{o.payment_ref && <div className="muted">GD: {o.payment_ref}</div>}</td>
                <td>
                  <form key={o.status} action={updateStatus} style={{ display: "flex", gap: 6 }}>
                    <input type="hidden" name="id" value={o.id} />
                    <select name="status" defaultValue={o.status}>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                    <button className="btn sm">Lưu</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length && <p className="muted">Chưa có đơn hàng.</p>}
      </div>
    </>
  );
}
