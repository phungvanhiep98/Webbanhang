export function FormatHelp() {
  return (
    <details className="muted" style={{ fontSize: 13, margin: "-6px 0 12px" }}>
      <summary style={{ cursor: "pointer" }}>Cách định dạng chữ</summary>
      <div style={{ lineHeight: 1.8, marginTop: 6 }}>
        <code>## Tiêu đề</code> tiêu đề lớn · <code>### Tiêu đề</code> tiêu đề nhỏ<br />
        <code>- nội dung</code> gạch đầu dòng · <code>1. nội dung</code> đánh số<br />
        <code>**chữ đậm**</code> · <code>[chữ](https://link)</code> gắn link · <code>![mô tả](https://link-ảnh)</code> chèn ảnh<br />
        Để một dòng trống giữa các đoạn.
      </div>
    </details>
  );
}
