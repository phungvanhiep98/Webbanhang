import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { viewStats, listOrders } from "@/lib/db";
import { getCatalog } from "@/lib/catalog";
import { getPosts } from "@/lib/blog";
import { AdminNav } from "@/components/AdminNav";

export const dynamic = "force-dynamic";

const vnDay = (offset = 0) => new Date(Date.now() + 7 * 3600 * 1000 - offset * 86400000).toISOString().slice(0, 10);
const RANGES: Record<string, { label: string; days: number }> = {
  "7": { label: "7 ngày", days: 7 },
  "30": { label: "30 ngày", days: 30 },
  "90": { label: "90 ngày", days: 90 },
};

export default async function Stats({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { n = "7" } = await searchParams;
  const range = RANGES[n] ?? RANGES["7"];
  const since = vnDay(range.days - 1);
  const [s, orders, products, posts] = await Promise.all([
    viewStats(since).catch(() => ({ daily: [], pages: [], sources: [] })),
    listOrders(), getCatalog({ includeHidden: true }), getPosts({ all: true }),
  ]);

  const byDay = new Map(s.daily.map((d) => [d.day, d]));
  const days = Array.from({ length: range.days }, (_, i) => vnDay(range.days - 1 - i)).map((day) => ({
    day, views: byDay.get(day)?.views ?? 0, visitors: byDay.get(day)?.visitors ?? 0,
  }));
  const today = days[days.length - 1];
  const totalViews = days.reduce((t, d) => t + d.views, 0);
  const totalVisitors = days.reduce((t, d) => t + d.visitors, 0);
  const ordersInRange = orders.filter((o) => vnDayOf(o.created_at) >= since).length;
  const max = Math.max(1, ...days.map((d) => d.views));
  const sources = s.sources.filter((x) => x.source !== "Trong web");
  const srcTotal = Math.max(1, sources.reduce((t, x) => t + x.visitors, 0));

  const nameOf = (path: string) => {
    if (path === "/") return "Trang chủ";
    if (path === "/blog") return "Blog";
    if (path === "/gioi-thieu") return "Giới thiệu";
    if (path === "/gio-hang") return "Giỏ hàng";
    if (path === "/thanh-toan") return "Thanh toán";
    if (path === "/tra-cuu") return "Tra cứu đơn";
    if (path.startsWith("/don-hang/")) return "Trang đơn hàng";
    const m = path.match(/^\/san-pham\/(.+)$/);
    if (m) return "👟 " + (products.find((p) => p.slug === m[1])?.name ?? m[1]);
    const b = path.match(/^\/blog\/(.+)$/);
    if (b) return "📖 " + (posts.find((p) => p.slug === b[1])?.title ?? b[1]);
    return path;
  };

  return (
    <>
      <AdminNav on="stats" />
      <div className="chips">
        {Object.entries(RANGES).map(([k, v]) => (
          <Link key={k} href={`/admin/thong-ke?n=${k}`} className={`chip ${range === v ? "on" : ""}`}>{v.label}</Link>
        ))}
      </div>
      <div className="stat-cards">
        <div className="panel"><div className="muted">Hôm nay</div><b>{today.visitors}</b><span>người xem · {today.views} lượt</span></div>
        <div className="panel"><div className="muted">Người xem ({range.label})</div><b>{totalVisitors.toLocaleString("vi-VN")}</b><span>tính theo từng ngày</span></div>
        <div className="panel"><div className="muted">Lượt xem trang ({range.label})</div><b>{totalViews.toLocaleString("vi-VN")}</b><span>{totalVisitors ? (totalViews / totalVisitors).toFixed(1) : 0} trang mỗi người</span></div>
        <div className="panel"><div className="muted">Đơn hàng ({range.label})</div><b>{ordersInRange}</b><span>{totalVisitors ? ((ordersInRange / totalVisitors) * 100).toFixed(1) : 0}% người xem đặt hàng</span></div>
      </div>

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Người xem mỗi ngày</h3>
        <div className="bars">
          {days.map((d) => (
            <div key={d.day} className="bar" title={`${d.day.split("-").reverse().join("/")}: ${d.visitors} người, ${d.views} lượt xem`}>
              <span className="bar-n">{d.visitors || ""}</span>
              <div className="bar-v" style={{ height: `${(d.views / max) * 100}%` }}>
                <div className="bar-p" style={{ height: d.views ? `${(d.visitors / d.views) * 100}%` : 0 }} />
              </div>
              <span className="bar-d">{range.days <= 31 || d.day.endsWith("01") ? d.day.slice(8) : ""}</span>
            </div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>Cột cam đậm: số người xem. Cột nhạt: tổng lượt xem trang. Rê chuột (hoặc chạm) vào cột để xem số chi tiết.</p>
      </div>

      <div className="stat-two">
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Khách đến từ đâu</h3>
          {sources.map((x) => (
            <div key={x.source} className="src-row">
              <span>{x.source}</span>
              <div className="src-bar"><div style={{ width: `${(x.visitors / srcTotal) * 100}%` }} /></div>
              <b>{x.visitors}</b>
            </div>
          ))}
          {!sources.length && <p className="muted">Chưa có dữ liệu.</p>}
        </div>
        <div className="panel">
          <h3 style={{ marginTop: 0 }}>Trang được xem nhiều nhất</h3>
          <table>
            <tbody>
              {s.pages.map((p) => (
                <tr key={p.path}>
                  <td><a href={p.path} target="_blank" style={{ color: "#0055aa" }}>{nameOf(p.path)}</a></td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}><b>{p.views}</b> <span className="muted">lượt</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!s.pages.length && <p className="muted">Chưa có dữ liệu.</p>}
        </div>
      </div>
      <p className="muted" style={{ fontSize: 13 }}>Không tính lượt xem của chính anh/chị khi đang đăng nhập admin, và không tính máy dò của Google, Facebook. Số liệu bắt đầu đếm từ ngày 13/11/2026.</p>
    </>
  );
}

function vnDayOf(iso: string) {
  return new Date(new Date(iso).getTime() + 7 * 3600 * 1000).toISOString().slice(0, 10);
}
