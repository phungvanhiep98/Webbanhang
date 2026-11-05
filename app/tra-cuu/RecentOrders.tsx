"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

// Các đơn đã đặt trên máy này (lưu trong trình duyệt), để khách mở lại nhanh.
export function RecentOrders() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    try { setIds(JSON.parse(localStorage.getItem("my_orders") || "[]")); } catch {}
  }, []);
  if (!ids.length) return null;
  return (
    <div className="panel" style={{ maxWidth: 720, margin: "0 auto" }}>
      <h3 style={{ marginTop: 0 }}>Đơn đã đặt trên máy này</h3>
      {ids.map((id) => (
        <div key={id} style={{ padding: "6px 0" }}>
          <Link href={`/don-hang/${id}`} style={{ color: "var(--brand)" }}>{id}</Link>
        </div>
      ))}
    </div>
  );
}
