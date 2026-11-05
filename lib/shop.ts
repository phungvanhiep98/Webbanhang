// Thông tin liên hệ của shop: sửa trong data/shop.json. Ô nào để trống thì không hiện trên web.
import data from "@/data/shop.json";

export const shop = {
  name: process.env.SHOP_NAME || "Shop Như Ý Bé",
  ...(data as Record<string, string>),
} as {
  name: string; tagline: string; hotline: string; zalo: string; messenger: string;
  facebook: string; address: string; openHours: string; returnPolicy: string; shopee: string;
};

const digits = (s: string) => s.replace(/\D/g, "");
export const zaloUrl = shop.zalo ? `https://zalo.me/${digits(shop.zalo)}` : "";
export const messengerUrl = shop.messenger ? (shop.messenger.startsWith("http") ? shop.messenger : `https://m.me/${shop.messenger}`) : "";
export const telUrl = shop.hotline ? `tel:${digits(shop.hotline)}` : "";
