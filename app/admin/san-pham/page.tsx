import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getCatalog } from "@/lib/catalog";
import { products as base } from "@/lib/products";
import { vnd } from "@/lib/format";
import { AdminNav } from "@/components/AdminNav";
import { saveProductAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { ok } = await searchParams;
  const list = await getCatalog({ includeHidden: true });

  return (
    <>
      <AdminNav on="products" />
      <div className="panel">
        <p style={{ margin: 0 }}>Bấm vào sản phẩm để sửa <b>giá bán</b> và <b>tồn kho</b> từng phân loại, hoặc <b>ẩn</b> sản phẩm khỏi web. Mỗi đơn mới sẽ tự trừ kho; đổi đơn sang “Đã hủy” thì kho được cộng lại.</p>
        <p className="muted" style={{ margin: "8px 0 0", fontSize: 14 }}>Muốn thêm sản phẩm mới: đăng trên Shopee trước, rồi xuất lại file Excel như lần trước để cập nhật lên web.</p>
      </div>
      {list.map((p) => {
        const keys = p.variants.length ? p.variants : [""];
        const orig = base.find((x) => x.id === p.id)!;
        return (
          <details key={p.id} className="panel ap" open={ok === p.id}>
            <summary>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.images[0]} alt="" referrerPolicy="no-referrer" className="thumb" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ap-name">{p.name}</div>
                <div className="muted" style={{ fontSize: 13 }}>
                  {p.category} · từ <span className="price">{vnd(p.price)}</span> · Tồn kho: <b style={{ color: p.stock ? undefined : "#c00" }}>{p.stock}</b>
                  {p.hidden && <span className="tag cancelled" style={{ marginLeft: 8 }}>Đang ẩn</span>}
                  {ok === p.id && <span className="tag paid" style={{ marginLeft: 8 }}>Đã lưu ✓</span>}
                </div>
              </div>
            </summary>
            <form action={saveProductAction}>
              <input type="hidden" name="id" value={p.id} />
              <table className="ap-table">
                <thead><tr><th>Phân loại</th><th>Giá bán (₫)</th><th>Tồn kho</th></tr></thead>
                <tbody>
                  {keys.map((k, i) => (
                    <tr key={k || "x"}>
                      <td>{k ? k.replace(",", " · ") : "Mặc định"}</td>
                      <td><input name={`price_${i}`} inputMode="numeric" defaultValue={k ? p.variantPrices?.[k] ?? p.price : p.price} /></td>
                      <td><input name={`stock_${i}`} inputMode="numeric" defaultValue={k ? p.variantStock?.[k] ?? 0 : p.stock} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="row" style={{ justifyContent: "space-between" }}>
                <label style={{ width: "auto", color: "inherit" }}>
                  <input type="checkbox" name="hidden" value="1" defaultChecked={p.hidden} /> Ẩn sản phẩm này khỏi web
                </label>
                <button className="btn">Lưu thay đổi</button>
              </div>
              {orig.originalPrice && <p className="muted" style={{ fontSize: 13, margin: 0 }}>Giá gốc (gạch ngang) đang là {vnd(orig.originalPrice)}.</p>}
            </form>
          </details>
        );
      })}
    </>
  );
}
