import data from "@/data/products.json";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  sold?: number;
  images: string[];
  variants: string[];
  variantPrices?: Record<string, number>; // giá từng phân loại
  variantStock?: Record<string, number>; // tồn kho từng phân loại
  optionNames?: string[]; // vd ["Màu sắc", "Kích cỡ"]; phân loại 2 cấp ghi dạng "Hồng,20-21"
  optionImages?: Record<string, string>; // ảnh theo phân loại cấp 1
  sizeChart?: string;
  description: string;
};

export const products = data as unknown as Product[];

export function getProduct(idOrSlug: string) {
  return products.find((p) => p.id === idOrSlug || p.slug === idOrSlug);
}

export function priceOf(p: Product, variant?: string) {
  return (variant && p.variantPrices?.[variant]) || p.price;
}

export function stockOf(p: Product, variant?: string) {
  return variant && p.variantStock ? p.variantStock[variant] ?? 0 : p.stock;
}

export function categories() {
  return Array.from(new Set(products.map((p) => p.category)));
}
