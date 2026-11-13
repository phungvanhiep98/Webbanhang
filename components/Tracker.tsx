"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Đếm lượt xem trang cho mục Thống kê trong admin
export function Tracker() {
  const path = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (!path || path.startsWith("/admin")) return;
    const body = JSON.stringify({ path, ref: first.current ? document.referrer : location.href });
    first.current = false;
    try {
      const sent = navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }));
      if (!sent) fetch("/api/track", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
    } catch {}
  }, [path]);
  return null;
}
