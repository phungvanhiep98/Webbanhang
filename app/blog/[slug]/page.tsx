import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPost, getPosts } from "@/lib/blog";
import { renderMarkdown, plainText } from "@/lib/markdown";
import { getCatalog } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { ShareButtons } from "@/components/ShareButtons";
import { shop } from "@/lib/shop";
import { siteUrl } from "@/lib/payments";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getPost((await params).slug);
  if (!p) return {};
  const description = p.excerpt || plainText(p.content).slice(0, 160);
  return {
    title: `${p.title} | ${shop.name}`, description,
    alternates: { canonical: `/blog/${p.slug}` },
    openGraph: { type: "article", title: p.title, description, images: p.cover ? [p.cover] : ["/logo.png"] },
  };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getPost((await params).slug);
  if (!p) notFound();
  const [others, products] = await Promise.all([getPosts(), getCatalog()]);
  const more = others.filter((x) => x.slug !== p.slug).slice(0, 3);
  const picks = [...products].sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0)).slice(0, 5);
  const ld = {
    "@context": "https://schema.org", "@type": "BlogPosting", headline: p.title, description: p.excerpt,
    datePublished: p.created_at, dateModified: p.updated_at, image: p.cover || `${siteUrl()}/logo.png`,
    author: { "@type": "Organization", name: shop.name }, publisher: { "@type": "Organization", name: shop.name, logo: `${siteUrl()}/logo.png` },
    mainEntityOfPage: `${siteUrl()}/blog/${p.slug}`,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <nav className="crumbs"><Link href="/">Trang chủ</Link> › <Link href="/blog">Blog</Link> › <span>{p.title}</span></nav>
      <article className="panel article">
        <h1>{p.title}</h1>
        <p className="muted">{new Date(p.created_at).toLocaleDateString("vi-VN")} · {shop.name}</p>
        {p.cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.cover} alt="" referrerPolicy="no-referrer" className="article-cover" />
        )}
        <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(p.content) }} />
        <ShareButtons title={p.title} />
      </article>
      {more.length > 0 && (
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Bài viết khác</h3>
          {more.map((x) => <p key={x.slug}><Link href={`/blog/${x.slug}`} style={{ color: "#0055aa" }}>{x.title}</Link></p>)}
        </div>
      )}
      <section className="sec">
        <div className="sec-head"><h2>Sản phẩm bán chạy</h2><Link href="/" className="more">Xem tất cả ›</Link></div>
        <div className="grid">{picks.map((x) => <ProductCard key={x.id} p={x} />)}</div>
      </section>
    </>
  );
}
