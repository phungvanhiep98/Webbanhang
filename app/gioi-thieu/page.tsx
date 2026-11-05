import Link from "next/link";
import type { Metadata } from "next";
import { getAbout } from "@/lib/blog";
import { renderMarkdown } from "@/lib/markdown";
import { shop } from "@/lib/shop";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: `Giới thiệu | ${shop.name}`,
  description: `${shop.name} - ${shop.tagline}. Giao hàng toàn quốc, thanh toán khi nhận hàng.`,
  alternates: { canonical: "/gioi-thieu" },
};

export default async function About() {
  const about = await getAbout();
  return (
    <>
      <nav className="crumbs"><Link href="/">Trang chủ</Link> › <span>Giới thiệu</span></nav>
      <article className="panel article">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt={shop.name} className="about-logo" />
        <div className="prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(about) }} />
        <div className="row"><Link href="/" className="btn">Xem sản phẩm</Link><Link href="/blog" className="btn ghost">Đọc blog</Link></div>
      </article>
    </>
  );
}
