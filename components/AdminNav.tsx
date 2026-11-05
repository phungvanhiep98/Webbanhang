import Link from "next/link";

export function AdminNav({ on }: { on: "orders" | "coupons" }) {
  return (
    <div className="admin-nav">
      <Link href="/admin" className={on === "orders" ? "on" : ""}>📋 Đơn hàng</Link>
      <Link href="/admin/ma-giam-gia" className={on === "coupons" ? "on" : ""}>🎟️ Mã giảm giá</Link>
    </div>
  );
}
