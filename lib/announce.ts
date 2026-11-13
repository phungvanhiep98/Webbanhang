// Dải thông báo đầu web, sửa trong admin → Mã giảm giá
import { getSetting } from "@/lib/db";
import { FREE_SHIP_FROM, vnd } from "@/lib/format";

const fallback = () => `🚚 Miễn phí vận chuyển cho đơn từ ${vnd(FREE_SHIP_FROM)} · Thanh toán khi nhận hàng toàn quốc`;

export async function getAnnouncementSetting() {
  const [text, on] = await Promise.all([
    getSetting("announce_text").catch(() => undefined),
    getSetting("announce_on").catch(() => undefined),
  ]);
  return { text: text ?? "", on: on !== "0", fallback: fallback() };
}

export async function getAnnouncement() {
  try {
    const a = await getAnnouncementSetting();
    return a.on ? a.text || a.fallback : "";
  } catch {
    return fallback();
  }
}
