// Báo đơn mới qua Telegram. Cần biến TELEGRAM_BOT_TOKEN (lấy từ @BotFather),
// rồi bấm "Kết nối Telegram" trong trang admin để lưu nơi nhận tin.
import { getSetting, setSetting, type Order } from "@/lib/db";
import { vnd, PAYMENT_LABELS } from "@/lib/format";
import { siteUrl } from "@/lib/payments";

const token = () => process.env.TELEGRAM_BOT_TOKEN?.trim() || "";
export const telegramEnabled = () => !!token();

async function tg(method: string, body?: object) {
  const res = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(5000),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.description || "Telegram lỗi");
  return data.result;
}

export async function chatId() {
  return process.env.TELEGRAM_CHAT_ID?.trim() || (await getSetting("telegram_chat_id").catch(() => undefined)) || "";
}

export async function sendTelegram(text: string) {
  if (!token()) return false;
  const id = await chatId();
  if (!id) return false;
  try {
    await tg("sendMessage", { chat_id: id, text, parse_mode: "HTML", disable_web_page_preview: true });
    return true;
  } catch (e) {
    console.error("Gửi Telegram lỗi", e);
    return false;
  }
}

// Lấy người vừa nhắn cho bot gần nhất và lưu lại làm nơi nhận thông báo
export async function connectTelegram(): Promise<{ ok: true; name: string } | { ok: false; error: string }> {
  if (!token()) return { ok: false, error: "Chưa có biến TELEGRAM_BOT_TOKEN trên Vercel" };
  try {
    const updates = (await tg("getUpdates")) as { message?: { chat: { id: number; first_name?: string; title?: string } } }[];
    const msg = updates.reverse().find((u) => u.message)?.message;
    if (!msg) return { ok: false, error: "Chưa thấy tin nhắn nào. Mở bot trên Telegram, bấm Start (hoặc gửi một tin bất kỳ) rồi thử lại." };
    await setSetting("telegram_chat_id", String(msg.chat.id));
    const name = msg.chat.first_name || msg.chat.title || String(msg.chat.id);
    await sendTelegram("✅ Đã kết nối! Từ giờ có đơn mới shop sẽ báo vào đây.");
    return { ok: true, name };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function notifyNewOrder(o: Pick<Order, "id" | "customer_name" | "phone" | "address" | "note" | "items" | "total" | "payment_method" | "coupon" | "discount">) {
  const lines = [
    `🛒 <b>Đơn mới ${o.id}</b>`,
    `👤 ${esc(o.customer_name)} · ${o.phone}`,
    `📍 ${esc(o.address)}`,
    ...o.items.map((i) => `• ${esc(i.name.slice(0, 60))}${i.variant ? ` (${esc(i.variant)})` : ""} × ${i.qty}`),
    o.coupon ? `🎟️ Mã ${o.coupon}: −${vnd(o.discount)}` : "",
    `💰 <b>${vnd(o.total)}</b> · ${PAYMENT_LABELS[o.payment_method]?.split(" (")[0] ?? o.payment_method}`,
    o.note ? `📝 ${esc(o.note)}` : "",
    `${siteUrl()}/admin`,
  ];
  return sendTelegram(lines.filter(Boolean).join("\n"));
}

export function notifyPaid(o: Pick<Order, "id" | "total">) {
  return sendTelegram(`✅ Đơn <b>${o.id}</b> đã được thanh toán ${vnd(o.total)}`);
}
