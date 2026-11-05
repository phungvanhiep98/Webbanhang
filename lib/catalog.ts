// Danh sách sản phẩm = data/products.json + chỉnh sửa trong admin (giá, tồn kho, ẩn/hiện) lưu ở database.
import { products as base, type Product } from "@/lib/products";
import { listProductEdits, saveProductEdit, type ProductEdit, type OrderItem } from "@/lib/db";

export type CatalogProduct = Product & { hidden: boolean };

function apply(p: Product, e?: ProductEdit): CatalogProduct {
  if (!e) return { ...p, hidden: false };
  const q: CatalogProduct = { ...p, hidden: e.hidden, sold: (p.sold ?? 0) + e.sold_extra };
  if (p.variants.length) {
    if (e.prices) q.variantPrices = { ...p.variantPrices, ...e.prices };
    if (e.stock) q.variantStock = { ...p.variantStock, ...e.stock };
    const st = q.variantStock ?? {};
    q.stock = p.variants.reduce((t, v) => t + (st[v] ?? 0), 0);
    const inStock = p.variants.filter((v) => (st[v] ?? 0) > 0).map((v) => q.variantPrices?.[v] ?? p.price);
    const all = p.variants.map((v) => q.variantPrices?.[v] ?? p.price);
    q.price = Math.min(...(inStock.length ? inStock : all));
  } else {
    if (e.prices?.[""] != null) q.price = e.prices[""];
    if (e.stock?.[""] != null) q.stock = e.stock[""];
  }
  if (q.originalPrice && q.originalPrice <= q.price) q.originalPrice = undefined;
  return q;
}

async function edits() {
  try {
    return new Map((await listProductEdits()).map((e) => [e.id, e]));
  } catch (err) {
    console.error("Không đọc được chỉnh sửa sản phẩm, dùng dữ liệu gốc", err);
    return new Map<string, ProductEdit>();
  }
}

export async function getCatalog(opts: { includeHidden?: boolean } = {}) {
  const m = await edits();
  const all = base.map((p) => apply(p, m.get(p.id)));
  return opts.includeHidden ? all : all.filter((p) => !p.hidden);
}

export async function findProduct(idOrSlug: string, opts: { includeHidden?: boolean } = {}) {
  return (await getCatalog(opts)).find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}

export const categoriesOf = (list: Product[]) => Array.from(new Set(list.map((p) => p.category)));

// Trừ (sign = -1) hoặc cộng lại (sign = +1) tồn kho theo các món trong đơn
export async function adjustStock(items: OrderItem[], sign: 1 | -1) {
  const m = await edits();
  const touched = new Map<string, ProductEdit>();
  for (const it of items) {
    const p = base.find((x) => x.id === it.productId);
    if (!p) continue;
    const e = touched.get(p.id) ?? m.get(p.id) ?? { id: p.id, hidden: false, prices: null, stock: null, sold_extra: 0 };
    const key = p.variants.length ? it.variant ?? "" : "";
    const cur = e.stock?.[key] ?? (p.variants.length ? p.variantStock?.[key] ?? 0 : p.stock);
    e.stock = { ...(e.stock ?? {}), [key]: Math.max(0, cur + sign * it.qty) };
    e.sold_extra = Math.max(0, e.sold_extra - sign * it.qty);
    touched.set(p.id, e);
  }
  for (const e of touched.values()) await saveProductEdit(e);
}
