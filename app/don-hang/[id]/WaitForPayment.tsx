"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Tự kiểm tra mỗi 4 giây; khi shop nhận được tiền, trang tự chuyển sang "Đã thanh toán".
export function WaitForPayment({ id }: { id: string }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(async () => {
      try {
        const r = await fetch(`/api/orders/${id}/status`, { cache: "no-store" });
        const { status } = await r.json();
        if (status && status !== "pending") { clearInterval(t); router.refresh(); }
      } catch {}
    }, 4000);
    return () => clearInterval(t);
  }, [id, router]);
  return (
    <div className="pay-wait">
      <span className="spinner" aria-hidden />
      <div><b>Đang chờ xác nhận thanh toán...</b><div>Trang sẽ tự cập nhật ngay khi shop nhận được tiền, bạn không cần tải lại.</div></div>
    </div>
  );
}
