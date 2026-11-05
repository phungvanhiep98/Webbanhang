import { listPosts, savePost, getSetting, setSetting, type Post } from "@/lib/db";
import { shop } from "@/lib/shop";
import { FREE_SHIP_FROM, vnd } from "@/lib/format";
import seed from "@/data/blog-seed.json";
import staticPosts from "@/data/blog-posts.json";

// Bài viết có sẵn trong code (data/blog-posts.json). Sửa/ẩn trong admin thì bản trong database được ưu tiên.
export const STATIC_POSTS = staticPosts as Post[];

export const slugify = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d")
  .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

// Lần đầu: thêm các bài viết mẫu ở chế độ nháp (chưa hiện cho khách)
async function ensureSeed() {
  if (await getSetting("blog_seeded")) return;
  const list = seed as Omit<Post, "published" | "created_at" | "updated_at">[];
  for (const [i, p] of list.entries()) {
    const t = new Date(Date.now() - (list.length - i) * 60000).toISOString();
    await savePost({ ...p, published: false, created_at: t, updated_at: t });
  }
  await setSetting("blog_seeded", "1");
}

export async function getPosts(opts: { all?: boolean } = {}) {
  try {
    if (opts.all) await ensureSeed();
    const db = await listPosts();
    const list = [...db, ...STATIC_POSTS.filter((s) => !db.some((d) => d.slug === s.slug))]
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return opts.all ? list : list.filter((p) => p.published);
  } catch (e) {
    console.error("Không đọc được bài viết", e);
    const list = [...STATIC_POSTS].sort((a, b) => b.created_at.localeCompare(a.created_at));
    return opts.all ? list : list.filter((p) => p.published);
  }
}

export async function getPost(slug: string, opts: { all?: boolean } = {}) {
  return (await getPosts(opts)).find((p) => p.slug === slug);
}

export const defaultAbout = () => `## Về ${shop.name}

${shop.name} chuyên **${shop.tagline.toLowerCase()}**: tất cotton, dép có quai, giày tập đi, giày búp bê, giày thể thao cho bé từ sơ sinh đến tuổi đi học.

Shop đang bán trên Shopee và nay mở thêm website để bố mẹ đặt hàng nhanh hơn, xem đủ ảnh, bảng size và theo dõi đơn ngay trên web.

## Mua hàng tại web

- Miễn phí vận chuyển cho đơn từ ${vnd(FREE_SHIP_FROM)}
- Thanh toán khi nhận hàng (COD) hoặc chuyển khoản bằng mã QR
- Giao hàng toàn quốc, tra cứu đơn bằng số điện thoại

## Liên hệ

Bố mẹ cần tư vấn chọn size hay mẫu, cứ nhắn shop qua Zalo hoặc nhóm Facebook ở cuối trang nhé!`;

export async function getAbout() {
  return (await getSetting("about").catch(() => undefined)) || defaultAbout();
}
