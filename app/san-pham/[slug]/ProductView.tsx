"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/Cart";
import { vnd } from "@/lib/format";
import type { Product } from "@/lib/products";
import { SizeChart } from "@/components/SizeChart";
import { ShareButtons } from "@/components/ShareButtons";
import { FREE_SHIP_FROM } from "@/lib/format";

export function ProductView({ p }: { p: Product }) {
  const { add } = useCart();
  const router = useRouter();
  const tiers = p.optionNames?.length ?? (p.variants.length ? 1 : 0);
  const split = (v: string) => (tiers === 2 ? v.split(",") : [v]);
  const options = useMemo(
    () => Array.from({ length: tiers }, (_, t) => {
      const vals = Array.from(new Set(p.variants.map((v) => split(v)[t])));
      if (t === 0 && tiers === 2) return vals;
      const SZ = ["XXS", "XS", "S", "M", "L", "XL", "XXL"];
      const key = (x: string) => (SZ.includes(x.toUpperCase()) ? SZ.indexOf(x.toUpperCase()) : parseFloat(x.replace(/[^\d.]/g, "")) || 0);
      return vals.sort((x, y) => key(x) - key(y));
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [p.variants, tiers]
  );
  const [sel, setSel] = useState<string[]>(Array(tiers).fill(""));
  const [img, setImg] = useState(p.images[0]);
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState("");

  const variant = tiers && sel.every(Boolean) ? sel.join(",") : "";
  const stockFor = (v: string) => (p.variantStock ? p.variantStock[v] ?? 0 : p.stock);
  const left = variant ? stockFor(variant) : p.stock;
  const price = variant ? p.variantPrices?.[variant] ?? p.price : p.price;
  const ratio = p.originalPrice ? p.originalPrice / p.price : 1;

  // Một lựa chọn còn hàng nếu có ít nhất 1 tổ hợp còn hàng khớp với các lựa chọn khác
  const available = (t: number, val: string) =>
    p.variants.some((v) => {
      const parts = split(v);
      return parts[t] === val && parts.every((x, i) => i === t || !sel[i] || sel[i] === x) && stockFor(v) > 0;
    });

  const choose = (t: number, val: string) => {
    const next = [...sel];
    next[t] = next[t] === val ? "" : val;
    setSel(next); setMsg(""); setQty(1);
    if (t === 0 && p.optionImages?.[val]) setImg(p.optionImages[val]);
  };

  const go = (buyNow: boolean) => {
    if (tiers && !variant) return setMsg("Vui lòng chọn " + (p.optionNames ?? ["phân loại"]).filter((_, i) => !sel[i]).join(" và ").toLowerCase());
    if (left <= 0) return setMsg("Phân loại này đã hết hàng");
    add({ productId: p.id, name: p.name, price, image: (sel[0] && p.optionImages?.[sel[0]]) || p.images[0], variant: variant || undefined, qty });
    if (buyNow) router.push("/gio-hang");
    else setMsg("Đã thêm vào giỏ hàng ✓");
  };

  return (
    <div className="panel pd">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img} alt={p.name} referrerPolicy="no-referrer" className="main-img" />
        <div className="thumbs">
          {p.images.map((u) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={u} src={u} alt="" referrerPolicy="no-referrer" className={u === img ? "on" : ""} onMouseEnter={() => setImg(u)} onClick={() => setImg(u)} />
          ))}
        </div>
      </div>
      <div>
        <h1>{p.name}</h1>
        <div className="muted">{p.sold ? `Đã bán ${p.sold.toLocaleString("vi-VN")}` : "Hàng mới về"}</div>
        <div className="bigprice">
          {vnd(price)}
          {ratio > 1 && <span className="old">{vnd(Math.round((price * ratio) / 1000) * 1000)}</span>}
          {ratio > 1 && <span className="off" style={{ marginLeft: 10, fontSize: 14 }}>-{Math.round((1 - 1 / ratio) * 100)}%</span>}
        </div>
        {options.map((vals, t) => (
          <div className="row" key={t}>
            <label>{p.optionNames?.[t] ?? "Phân loại"}{t === tiers - 1 && p.sizeChart && <><br /><SizeChart src={p.sizeChart} /></>}</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, flex: 1 }}>
              {vals.map((v) => {
                const ok = available(t, v);
                return (
                  <button key={v} disabled={!ok} className={`opt ${sel[t] === v ? "on" : ""}`} onClick={() => choose(t, v)}>
                    {t === 0 && p.optionImages?.[v] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.optionImages[v]} alt="" referrerPolicy="no-referrer" className="opt-img" />
                    )}
                    {v}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="row">
          <label>Số lượng</label>
          <div className="qty">
            <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
            <input value={qty} onChange={(e) => setQty(Math.max(1, Math.min(left || 1, Number(e.target.value) || 1)))} />
            <button onClick={() => setQty(Math.min(left || 1, qty + 1))}>+</button>
          </div>
          <span className="muted">{variant ? (left > 0 ? `Còn ${left} sản phẩm` : "Hết hàng") : `Còn ${p.stock} sản phẩm`}</span>
        </div>
        <div className="row">
          <button className="btn ghost" disabled={p.stock <= 0} onClick={() => go(false)}>Thêm vào giỏ hàng</button>
          <button className="btn" disabled={p.stock <= 0} onClick={() => go(true)}>{p.stock <= 0 ? "Hết hàng" : "Mua ngay"}</button>
        </div>
        {msg && <div style={{ color: msg.includes("✓") ? "var(--ok)" : "#c00" }}>{msg}</div>}
        {tiers === 0 && p.sizeChart && <SizeChart src={p.sizeChart} />}
        <ul className="pd-perks">
          <li>🚚 Miễn phí vận chuyển đơn từ {vnd(FREE_SHIP_FROM)}</li>
          <li>💵 Thanh toán khi nhận hàng hoặc chuyển khoản QR</li>
          <li>📦 Giao hàng toàn quốc, tra cứu đơn ngay trên web</li>
        </ul>
        <ShareButtons title={p.name} />
      </div>
    </div>
  );
}
