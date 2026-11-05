import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/catalog";
import { siteUrl } from "@/lib/payments";
import { shop } from "@/lib/shop";
import { ProductView } from "./ProductView";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const slug = (await params).slug;
  const p = (await getCatalog()).find((x) => x.slug === slug || x.id === slug);
  return p ? {
    title: `${p.name} | ${shop.name}`, description: p.description.replace(/\s+/g, " ").slice(0, 160),
    alternates: { canonical: `/san-pham/${p.slug}` }, openGraph: { title: p.name, images: [p.images[0]] },
  } : {};
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const products = await getCatalog();
  const p = products.find((x) => x.slug === slug || x.id === slug);
  if (!p) notFound();
  const related = products.filter((x) => x.category === p.category && x.id !== p.id)
    .concat(products.filter((x) => x.category !== p.category))
    .slice(0, 5);
  const prices = p.variants.length ? p.variants.map((v) => p.variantPrices?.[v] ?? p.price) : [p.price];
  const ld = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, image: p.images.slice(0, 5), sku: p.id,
    description: p.description.slice(0, 500), category: p.category, brand: { "@type": "Brand", name: shop.name },
    offers: {
      "@type": "AggregateOffer", priceCurrency: "VND", lowPrice: Math.min(...prices), highPrice: Math.max(...prices),
      offerCount: Math.max(1, p.variants.length), url: `${siteUrl()}/san-pham/${p.slug}`,
      availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
  const crumbs = {
    "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Trang chủ", item: siteUrl() },
      { "@type": "ListItem", position: 2, name: p.category, item: `${siteUrl()}/?c=${encodeURIComponent(p.category)}` },
      { "@type": "ListItem", position: 3, name: p.name },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([ld, crumbs]).replace(/</g, "\\u003c") }} />
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
