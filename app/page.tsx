import Link from "next/link";
import type { Product } from "@/lib/products";
import { getCatalog, categoriesOf } from "@/lib/catalog";
import { getPosts } from "@/lib/blog";
import { ProductCard } from "@/components/ProductCard";
import { shop } from "@/lib/shop";
import { FREE_SHIP_FROM, vnd } from "@/lib/format";
import { siteUrl } from "@/lib/payments";
import type { Metadata } from "next";

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

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ c?: string; q?: string; s?: string }> }): Promise<Metadata> {
  const { c, q, s } = await searchParams;
  if (c && !q && !s) return {
    title: `${c} cho bé | ${shop.name}`,
    description: `Mua ${c.toLowerCase()} cho bé tại ${shop.name}: giá tốt, freeship đơn từ ${vnd(FREE_SHIP_FROM)}, thanh toán khi nhận hàng.`,
    alternates: { canonical: `/?c=${encodeURIComponent(c)}` },
  };
  return {
    title: `${shop.name} - ${shop.tagline}`,
    description: `${shop.name}: ${shop.tagline.toLowerCase()}. Tất cotton, dép có quai, giày tập đi, giày búp bê, giày thể thao cho bé. Freeship đơn từ ${vnd(FREE_SHIP_FROM)}, COD toàn quốc.`,
    alternates: { canonical: "/" },
    robots: q || s ? { index: false, follow: true } : undefined,
  };
}

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string; c?: string; s?: string }> }) {
  const { q = "", c = "", s = "" } = await searchParams;
  const [products, posts] = await Promise.all([getCatalog(), getPosts()]);
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
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org", "@type": "Store", name: shop.name, description: shop.tagline,
            url: siteUrl(), logo: `${siteUrl()}/logo.png`, image: `${siteUrl()}/logo.png`,
            ...(shop.zalo ? { telephone: shop.zalo } : {}),
            sameAs: [shop.shopee, shop.facebook].filter(Boolean),
          }).replace(/</g, "\\u003c") }} />
          <section className="hero">
            <div className="hero-main">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" className="hero-logo" />
              <div>
              <h1>{shop.name}</h1>
              <p>{shop.tagline}</p>
              <div className="hero-cta">
                <a href="#tat-ca" className="btn white">Mua sắm ngay</a>
                <Link href="/tra-cuu" className="btn outline-white">Tra cứu đơn hàng</Link>
              </div>
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

      {home && posts.length > 0 && (
        <section className="sec">
          <div className="sec-head"><h2>📖 Góc bố mẹ</h2><Link href="/blog" className="more">Xem tất cả ›</Link></div>
          <div className="posts">
            {posts.slice(0, 3).map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="post-card">
                <div><h3 style={{ margin: 0, fontSize: 17 }}>{p.title}</h3><p>{p.excerpt}</p><span className="muted">Đọc tiếp ›</span></div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
