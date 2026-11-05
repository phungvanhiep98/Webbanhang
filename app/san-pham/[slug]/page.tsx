import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct, products } from "@/lib/products";
import { ProductView } from "./ProductView";

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = getProduct((await params).slug);
  return p ? { title: p.name, description: p.description.slice(0, 160), openGraph: { images: [p.images[0]] } } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = getProduct((await params).slug);
  if (!p) notFound();
  return (
    <>
      <ProductView p={p} />
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Mô tả sản phẩm</h3>
        <p style={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>{p.description}</p>
      </div>
    </>
  );
}
