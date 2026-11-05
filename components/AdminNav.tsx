import Link from "next/link";

const TABS = [
  ["orders", "/admin", "📋 Đơn hàng"],
  ["products", "/admin/san-pham", "👟 Sản phẩm"],
  ["coupons", "/admin/ma-giam-gia", "🎟️ Mã giảm giá"],
  ["notify", "/admin/thong-bao", "🔔 Thông báo"],
] as const;

export function AdminNav({ on }: { on: (typeof TABS)[number][0] }) {
  return (
    <div className="admin-nav">
      {TABS.map(([k, href, label]) => <Link key={k} href={href} className={on === k ? "on" : ""}>{label}</Link>)}
    </div>
  );
}
