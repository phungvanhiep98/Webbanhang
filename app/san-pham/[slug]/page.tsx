import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct, products } from "@/lib/products";
import { ProductView } from "./ProductView";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";

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
  const related = products.filter((x) => x.category === p.category && x.id !== p.id)
    .concat(products.filter((x) => x.category !== p.category))
    .slice(0, 5);
  return (
    <>
      <nav className="crumbs">
        <Link href="/">Trang chủ</Link> › <Link href={`/?c=${encodeURIComponent(p.category)}`}>{p.category}</Link> › <span>{p.name}</span>
      </nav>
      <ProductView p={p} />
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Mô tả sản phẩm</h3>
        <p style={{ whiteSpace: "pre-line", lineHeight: 1.7 }}>{p.description}</p>
      </div>
      <section className="sec">
        <div className="sec-head"><h2>Có thể bé cũng thích</h2></div>
        <div className="grid">{related.map((x) => <ProductCard key={x.id} p={x} />)}</div>
      </section>
    </>
  );
}
