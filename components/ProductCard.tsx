import Link from "next/link";
import { vnd } from "@/lib/format";
import type { Product } from "@/lib/products";

export function ProductCard({ p }: { p: Product }) {
  const off = p.originalPrice && p.originalPrice > p.price ? Math.round((1 - p.price / p.originalPrice) * 100) : 0;
  return (
    <Link href={`/san-pham/${p.slug}`} className="card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={p.images[0]} alt={p.name} loading="lazy" referrerPolicy="no-referrer" />
      <div className="card-body">
        <div className="card-name">{p.name}</div>
        <div>
          <span className="price">{vnd(p.price)}</span>
          {off > 0 && <span className="off" style={{ marginLeft: 6 }}>-{off}%</span>}
        </div>
        <div className="meta">
          <span>{p.stock > 0 ? "Còn hàng" : "Hết hàng"}</span>
          {p.sold ? <span>Đã bán {p.sold.toLocaleString("vi-VN")}</span> : null}
        </div>
      </div>
    </Link>
  );
}
