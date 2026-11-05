import Link from "next/link";
import { products, categories } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export default async function Home({ searchParams }: { searchParams: Promise<{ q?: string; c?: string }> }) {
  const { q = "", c = "" } = await searchParams;
  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
  const list = products.filter(
    (p) => (!c || p.category === c) && (!q || norm(p.name).includes(norm(q)))
  );
  return (
    <>
      <div className="chips">
        <Link href="/" className={`chip ${!c ? "on" : ""}`}>Tất cả</Link>
        {categories().map((cat) => (
          <Link key={cat} href={`/?c=${encodeURIComponent(cat)}`} className={`chip ${c === cat ? "on" : ""}`}>{cat}</Link>
        ))}
      </div>
      {q && <p className="muted">Kết quả cho “{q}”: {list.length} sản phẩm</p>}
      <div className="grid">
        {list.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
      {list.length === 0 && <div className="panel">Không tìm thấy sản phẩm phù hợp.</div>}
    </>
  );
}
