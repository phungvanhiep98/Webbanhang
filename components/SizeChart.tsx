"use client";
import { useState } from "react";

export function SizeChart({ src }: { src: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="link-btn" onClick={() => setOpen(true)}>📏 Bảng size</button>
      {open && (
        <div className="modal" onClick={() => setOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <b>Bảng quy đổi kích cỡ</b>
              <button type="button" className="x" onClick={() => setOpen(false)} aria-label="Đóng">×</button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="Bảng size" referrerPolicy="no-referrer" />
            <p className="muted" style={{ fontSize: 13 }}>Phân vân giữa 2 size? Nhắn shop để được tư vấn chọn size cho bé.</p>
          </div>
        </div>
      )}
    </>
  );
}
