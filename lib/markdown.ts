// Định dạng bài viết đơn giản:
//   ## Tiêu đề lớn   ### Tiêu đề nhỏ   - gạch đầu dòng   1. đánh số
//   **chữ đậm**   [chữ](https://link)   ![mô tả](https://ảnh)   dòng trống = sang đoạn mới
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(s: string) {
  return esc(s)
    .replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, '<img src="$2" alt="$1" loading="lazy" referrerpolicy="no-referrer" />')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, (_, t, u) => `<a href="${u}"${u.startsWith("/") ? "" : ' target="_blank" rel="noopener"'}>${t}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
}

export function renderMarkdown(src: string) {
  const out: string[] = [];
  const blocks = src.replace(/\r/g, "").split(/\n{2,}/);
  for (const b of blocks) {
    const lines = b.split("\n").filter((l) => l.trim());
    if (!lines.length) continue;
    if (lines.every((l) => /^\s*[-*]\s+/.test(l))) out.push("<ul>" + lines.map((l) => `<li>${inline(l.replace(/^\s*[-*]\s+/, ""))}</li>`).join("") + "</ul>");
    else if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) out.push("<ol>" + lines.map((l) => `<li>${inline(l.replace(/^\s*\d+[.)]\s+/, ""))}</li>`).join("") + "</ol>");
    else if (lines.length === 1 && /^###\s/.test(lines[0])) out.push(`<h3>${inline(lines[0].slice(4))}</h3>`);
    else if (lines.length === 1 && /^##\s/.test(lines[0])) out.push(`<h2>${inline(lines[0].slice(3))}</h2>`);
    else out.push(`<p>${lines.map(inline).join("<br />")}</p>`);
  }
  return out.join("\n");
}

export const plainText = (src: string) =>
  src.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[#*>-]/g, "").replace(/\s+/g, " ").trim();
