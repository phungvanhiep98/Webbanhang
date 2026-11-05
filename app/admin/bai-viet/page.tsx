import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getPosts, getAbout } from "@/lib/blog";
import { AdminNav } from "@/components/AdminNav";
import { saveAboutAction } from "../actions";
import { FormatHelp } from "./FormatHelp";

export const dynamic = "force-dynamic";

export default async function AdminPosts({ searchParams }: { searchParams: Promise<{ ok?: string; about?: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { ok, about: aboutSaved } = await searchParams;
  const [posts, about] = await Promise.all([getPosts({ all: true }), getAbout()]);
  return (
    <>
      <AdminNav on="posts" />
      <div className="panel">
        <div className="sec-head" style={{ marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>Bài viết Blog</h3>
          <Link href="/admin/bai-viet/moi" className="btn sm">+ Viết bài mới</Link>
        </div>
        <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>Bài “Bản nháp” khách chưa thấy. Mở bài, sửa nếu cần, tích “Đăng bài” rồi Lưu.</p>
        <table>
          <thead><tr><th>Tiêu đề</th><th>Trạng thái</th><th>Ngày</th><th></th></tr></thead>
          <tbody>
            {posts.map((p) => (
              <tr key={p.slug}>
                <td><b>{p.title}</b>{ok === p.slug && <span className="tag paid" style={{ marginLeft: 8 }}>Đã lưu ✓</span>}</td>
                <td><span className={`tag ${p.published ? "paid" : "pending"}`}>{p.published ? "Đã đăng" : "Bản nháp"}</span></td>
                <td className="muted">{new Date(p.created_at).toLocaleDateString("vi-VN")}</td>
                <td style={{ whiteSpace: "nowrap" }}>
                  <Link href={`/admin/bai-viet/${p.slug}`} className="btn sm ghost">Sửa</Link>{" "}
                  {p.published && <Link href={`/blog/${p.slug}`} className="btn sm ghost" target="_blank">Xem</Link>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!posts.length && <p className="muted">Chưa có bài viết.</p>}
      </div>

      <form action={saveAboutAction} className="panel" id="gioi-thieu">
        <h3 style={{ marginTop: 0 }}>Trang Giới thiệu</h3>
        <p className="muted" style={{ marginTop: 0, fontSize: 14 }}>Kể về shop: bắt đầu từ khi nào, hàng lấy ở đâu, điều shop tự hào. Hiện ở <Link href="/gioi-thieu" target="_blank" style={{ color: "#0055aa" }}>/gioi-thieu</Link>.</p>
        <div className="field"><textarea name="about" rows={16} defaultValue={about} /></div>
        <FormatHelp />
        {aboutSaved && <p style={{ color: "var(--ok)" }}>Đã lưu trang Giới thiệu ✓</p>}
        <button className="btn">Lưu trang Giới thiệu</button>
      </form>
    </>
  );
}
