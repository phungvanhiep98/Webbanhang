import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { trackView } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

// Ghi một lượt xem trang. Không lưu IP: chỉ lưu mã ẩn danh đổi theo từng ngày để đếm số người.
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|headless|lighthouse|vercel/i;
const DIRECT = "Vào thẳng / khác";

function sourceOf(ref: string) {
  if (!ref) return DIRECT;
  let host = "";
  try { host = new URL(ref).hostname.replace(/^www\./, ""); } catch { return DIRECT; }
  if (/facebook|fb\.|messenger/.test(host)) return "Facebook";
  if (/zalo/.test(host)) return "Zalo";
  if (/google/.test(host)) return "Google";
  if (/tiktok/.test(host)) return "TikTok";
  if (/shopee/.test(host)) return "Shopee";
  if (/bing|coccoc|yahoo|duckduckgo/.test(host)) return "Công cụ tìm kiếm khác";
  return host;
}

export async function POST(req: NextRequest) {
  try {
    const ua = req.headers.get("user-agent") ?? "";
    if (!ua || BOT.test(ua) || (await isAdmin())) return new NextResponse(null, { status: 204 });
    const b = await req.json().catch(() => ({}));
    const path = String(b.path ?? "/").slice(0, 200);
    if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return new NextResponse(null, { status: 204 });
    const day = new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10);
    const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim();
    const visitor = crypto.createHash("sha256").update([day, ip, ua, process.env.ADMIN_PASSWORD ?? ""].join("|")).digest("hex").slice(0, 16);
    const ref = String(b.ref ?? "");
    let self = false;
    try { self = new URL(ref).host === req.nextUrl.host; } catch {}
    await trackView({ day, path, visitor, source: self ? "Trong web" : sourceOf(ref) });
  } catch (e) {
    console.error("track", e);
  }
  return new NextResponse(null, { status: 204 });
}
