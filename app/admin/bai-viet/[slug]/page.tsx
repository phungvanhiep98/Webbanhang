import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { getPost } from "@/lib/blog";
import { AdminNav } from "@/components/AdminNav";
import { savePostAction, deletePostAction } from "../../actions";
import { FormatHelp } from "../FormatHelp";

export const dynamic = "force-dynamic";

export default async function EditPost({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<{ loi?: string; trung?: string }>;
}) {
  if (!(await isAdmin())) redirect("/admin");
  const { slug } = await params;
  const { loi, trung } = await searchParams;
  const p = slug === "moi" ? undefined : await getPost(slug, { all: true });
  if (slug !== "moi" && !p) redirect("/admin/bai-viet");
  return (
    <>
      <AdminNav on="posts" />
      <form action={savePostAction} className="panel">
        <p style={{ marginTop: 0 }}><Link href="/admin/bai-viet" style={{ color: "#0055aa" }}>‹ Danh sách bài viết</Link></p>
        <input type="hidden" name="old_slug" value={p?.slug ?? ""} />
        <div className="field"><label>Tiêu đề *</label><input name="title" required defaultValue={p?.title} /></div>
        <div className="field">
          <label>Đường dẫn</label>
          <input name="slug" defaultValue={p?.slug} placeholder="Để trống sẽ tự tạo từ tiêu đề" />
          <small className="muted">Bài sẽ ở địa chỉ /blog/đường-dẫn. Đã đăng rồi thì không nên đổi.</small>
        </div>
        <div className="field"><label>Mô tả ngắn (hiện trên Google và danh sách bài)</label><textarea name="excerpt" rows={2} maxLength={300} defaultValue={p?.excerpt} /></div>
        <div className="field"><label>Ảnh bìa (link ảnh, không bắt buộc)</label><input name="cover" defaultValue={p?.cover} placeholder="https://..." /></div>
        <div className="field"><label>Nội dung</label><textarea name="content" rows={22} defaultValue={p?.content} /></div>
        <FormatHelp />
        {loi && <p className="err">Cần nhập tiêu đề.</p>}
        {trung && <p className="err">Đã có bài với đường dẫn này, hãy đổi tiêu đề hoặc đường dẫn.</p>}
        <div className="row" style={{ justifyContent: "space-between" }}>
          <label style={{ width: "auto", color: "inherit" }}><input type="checkbox" name="published" value="1" defaultChecked={p?.published} /> Đăng bài (khách xem được)</label>
          <button className="btn">Lưu bài viết</button>
        </div>
      </form>
      {p && (
        <form action={deletePostAction} className="panel" style={{ textAlign: "right" }}>
          <input type="hidden" name="slug" value={p.slug} />
          <button className="btn sm ghost">Xóa bài này</button>
        </form>
      )}
    </>
  );
}
