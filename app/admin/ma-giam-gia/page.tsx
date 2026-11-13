import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { listCoupons } from "@/lib/db";
import { describe } from "@/lib/coupons";
import { AdminNav } from "@/components/AdminNav";
import { saveCouponAction, toggleCouponAction, deleteCouponAction } from "../actions";
import { CouponKind } from "./CouponKind";
import { getAnnouncementSetting } from "@/lib/announce";
import { saveAnnounceAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function Coupons({ searchParams }: { searchParams: Promise<{ loi?: string; saved?: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { loi, saved } = await searchParams;
  const ann = await getAnnouncementSetting();
  const list = await listCoupons();
  const today = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);

  return (
    <>
      <AdminNav on="coupons" />
      <form action={saveAnnounceAction} className="panel">
        <h3 style={{ marginTop: 0 }}>Dải thông báo đầu web</h3>
        <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>Dòng chữ chạy trên cùng mọi trang, ví dụ để báo mã giảm giá: “🎁 Nhập mã WEB10 giảm 10k cho đơn đầu tiên”. Để trống thì dùng câu mặc định về freeship.</p>
        <div className="field"><input name="text" defaultValue={ann.text} placeholder={ann.fallback} maxLength={160} /></div>
        <div className="row" style={{ justifyContent: "space-between", margin: 0 }}>
          <label style={{ width: "auto", color: "inherit" }}><input type="checkbox" name="on" value="1" defaultChecked={ann.on} /> Hiện dải thông báo</label>
          <button className="btn">Lưu</button>
        </div>
        {saved && <p style={{ color: "var(--ok)", marginBottom: 0 }}>Đã lưu ✓</p>}
      </form>
      <form action={saveCouponAction} className="panel">
        <h3 style={{ marginTop: 0 }}>Tạo mã giảm giá</h3>
        <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>Khách nhập mã ở trang thanh toán. Nhập lại một mã đã có để sửa mã đó.</p>
        <div className="coupon-form">
          <div className="field"><label>Mã *</label><input name="code" required placeholder="VD: NHUYBE10" style={{ textTransform: "uppercase" }} /></div>
          <CouponKind />
          <div className="field"><label>Đơn tối thiểu (₫)</label><input name="min_order" inputMode="numeric" placeholder="0 = không yêu cầu" /></div>
          <div className="field"><label>Tổng lượt dùng</label><input name="max_uses" inputMode="numeric" placeholder="0 = không giới hạn" /></div>
          <div className="field"><label>Dùng đến hết ngày</label><input name="expires_at" type="date" /></div>
        </div>
        {loi && <p className="err">Cần nhập mã và mức giảm (giảm theo % thì từ 1 đến 100).</p>}
        <button className="btn">Lưu mã</button>
      </form>

      <div className="panel" style={{ overflowX: "auto" }}>
        <table>
          <thead><tr><th>Mã</th><th>Ưu đãi</th><th>Đã dùng</th><th>Hạn dùng</th><th>Trạng thái</th><th></th></tr></thead>
          <tbody>
            {list.map((c) => {
              const expired = !!c.expires_at && today > c.expires_at;
              const out = c.max_uses > 0 && c.used >= c.max_uses;
              return (
                <tr key={c.code}>
                  <td><b>{c.code}</b></td>
                  <td>{describe(c)}</td>
                  <td>{c.used}{c.max_uses ? ` / ${c.max_uses}` : ""}</td>
                  <td>{c.expires_at ? c.expires_at.split("-").reverse().join("/") : "Không hạn"}</td>
                  <td>
                    <span className={`tag ${!c.active || expired || out ? "cancelled" : "paid"}`}>
                      {!c.active ? "Đang tắt" : expired ? "Hết hạn" : out ? "Hết lượt" : "Đang chạy"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <form action={toggleCouponAction}>
                      <input type="hidden" name="code" value={c.code} />
                      <input type="hidden" name="active" value={c.active ? "0" : "1"} />
                      <button className="btn sm ghost">{c.active ? "Tắt" : "Bật"}</button>
                    </form>
                    <form action={deleteCouponAction}>
                      <input type="hidden" name="code" value={c.code} />
                      <button className="btn sm ghost">Xóa</button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!list.length && <p className="muted">Chưa có mã giảm giá nào.</p>}
      </div>
    </>
  );
}
