import Link from "next/link";
import type { Metadata } from "next";
import { getPosts } from "@/lib/blog";
import { shop } from "@/lib/shop";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: `Blog - Kinh nghiệm chọn giày dép, tất cho bé | ${shop.name}`,
  description: `Mẹo chọn size, chọn giày tập đi, chăm sóc tất cotton cho bé từ ${shop.name}.`,
  alternates: { canonical: "/blog" },
};

export default async function Blog() {
  const posts = await getPosts();
  return (
    <>
      <nav className="crumbs"><Link href="/">Trang chủ</Link> › <span>Blog</span></nav>
      <h1 className="page-title">Blog cho bố mẹ</h1>
      <div className="posts">
        {posts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="post-card">
            {p.cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.cover} alt="" referrerPolicy="no-referrer" loading="lazy" />
            )}
            <div>
              <h2>{p.title}</h2>
              <p>{p.excerpt}</p>
              <span className="muted">{new Date(p.created_at).toLocaleDateString("vi-VN")} · Đọc tiếp ›</span>
            </div>
          </Link>
        ))}
      </div>
      {!posts.length && <div className="panel">Chưa có bài viết nào.</div>}
    </>
  );
}
