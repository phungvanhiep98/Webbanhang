import Link from "next/link";
import type { Product } from "@/lib/products";
import { getCatalog, categoriesOf } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { shop } from "@/lib/shop";
import { FREE_SHIP_FROM, vnd } from "@/lib/format";

const SORTS: Record<string, { label: string; fn: (a: Product, b: Product) => number }> = {
  "": { label: "Phổ biến", fn: (a, b) => (b.sold ?? 0) - (a.sold ?? 0) },
  moi: { label: "Mới nhất", fn: (a, b) => b.id.length - a.id.length || b.id.localeCompare(a.id) },
  "gia-tang": { label: "Giá thấp → cao", fn: (a, b) => a.price - b.price },
  "gia-giam": { label: "Giá cao → thấp", fn: (a, b) => b.price - a.price },
};

function qs(params: Record<string, string>) {
  const u = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
  const s = u.toString();
  return s ? `/?${s}` : "/";
}

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string; c?: string; s?: string }> }) {
  const { q = "", c = "", s = "" } = await searchParams;
  const products = await getCatalog();
  const categories = () => categoriesOf(products);
  const sort = SORTS[s] ? s : "";
  const norm = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
  const list = products
    .filter((p) => (!c || p.category === c) && (!q || norm(p.name).includes(norm(q))))
    .sort(SORTS[sort].fn);
  const home = !q && !c && !sort;
  const best = [...products].filter((p) => (p.sold ?? 0) > 0).sort(SORTS[""].fn).slice(0, 5);
  const fresh = [...products].sort(SORTS.moi.fn).slice(0, 5);
  const totalSold = products.reduce((t, p) => t + (p.sold ?? 0), 0);

  return (
    <>
      {home && (
        <>
          <section className="hero">
            <div>
              <h1>{shop.name}</h1>
              <p>{shop.tagline}</p>
              <div className="hero-cta">
                <a href="#tat-ca" className="btn white">Mua sắm ngay</a>
                <Link href="/tra-cuu" className="btn outline-white">Tra cứu đơn hàng</Link>
              </div>
            </div>
            <div className="hero-stats">
              <div><b>{products.length}</b><span>mẫu đang bán</span></div>
              {totalSold > 0 && <div><b>{totalSold.toLocaleString("vi-VN")}+</b><span>sản phẩm đã bán</span></div>}
              <div><b>{categories().length}</b><span>danh mục</span></div>
            </div>
          </section>
          <section className="perks">
            <div><span>🚚</span><div><b>Miễn phí vận chuyển</b><small>Đơn từ {vnd(FREE_SHIP_FROM)}</small></div></div>
            <div><span>💵</span><div><b>Thanh toán khi nhận</b><small>Nhận hàng rồi trả tiền (COD)</small></div></div>
            <div><span>📱</span><div><b>Chuyển khoản QR</b><small>Quét mã, không cần gõ số TK</small></div></div>
            <div><span>📦</span><div><b>Giao toàn quốc</b><small>Theo dõi đơn ngay trên web</small></div></div>
          </section>
          <div className="cats">
            {categories().map((cat) => {
              const p = products.find((x) => x.category === cat)!;
              return (
                <Link key={cat} href={qs({ c: cat })} className="cat">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.images[0]} alt="" referrerPolicy="no-referrer" loading="lazy" />
                  <span>{cat}</span>
                </Link>
              );
            })}
          </div>
          {best.length > 0 && (
            <section className="sec">
              <div className="sec-head"><h2>🔥 Bán chạy</h2><Link href={qs({ s: "" })} className="more">Xem tất cả ›</Link></div>
              <div className="grid">{best.map((p) => <ProductCard key={p.id} p={p} />)}</div>
            </section>
          )}
          <section className="sec">
            <div className="sec-head"><h2>✨ Hàng mới về</h2><Link href={qs({ s: "moi" })} className="more">Xem tất cả ›</Link></div>
            <div className="grid">{fresh.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          </section>
        </>
      )}

      <section className="sec" id="tat-ca">
        <div className="sec-head">
          <h2>{c || (q ? `Kết quả cho “${q}”` : "Tất cả sản phẩm")} <small className="muted">({list.length})</small></h2>
        </div>
        <div className="toolbar">
          <div className="chips">
            <Link href={qs({ q, s: sort })} className={`chip ${!c ? "on" : ""}`}>Tất cả</Link>
            {categories().map((cat) => (
              <Link key={cat} href={qs({ q, c: cat, s: sort })} className={`chip ${c === cat ? "on" : ""}`}>{cat}</Link>
            ))}
          </div>
          <div className="sorts">
            <span className="muted">Sắp xếp:</span>
            {Object.entries(SORTS).map(([k, v]) => (
              <Link key={k} href={qs({ q, c, s: k }) + "#tat-ca"} className={`sort ${sort === k ? "on" : ""}`}>{v.label}</Link>
            ))}
          </div>
        </div>
        <div className="grid">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        {list.length === 0 && <div className="panel">Không tìm thấy sản phẩm phù hợp.</div>}
      </section>
    </>
  );
}
