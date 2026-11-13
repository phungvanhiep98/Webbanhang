"use client";
import { useEffect, useState } from "react";

// Nút chia sẻ: trên điện thoại mở bảng chia sẻ của máy (Zalo, Messenger...), thêm Facebook và Sao chép link
export function ShareButtons({ title }: { title: string }) {
  const [url, setUrl] = useState("");
  const [canShare, setCanShare] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    setUrl(location.href.split("#")[0]);
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);
  if (!url) return null;
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  };
  return (
    <div className="share">
      <span className="muted">Chia sẻ:</span>
      {canShare && (
        <button type="button" className="share-btn main" onClick={() => navigator.share({ title, url }).catch(() => {})}>
          📤 Gửi qua Zalo, Messenger...
        </button>
      )}
      <a className="share-btn fb" target="_blank" rel="noopener" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}>Facebook</a>
      <button type="button" className="share-btn" onClick={copy}>{copied ? "Đã chép link ✓" : "🔗 Sao chép link"}</button>
    </div>
  );
}
