import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { CartProvider, CartBadge } from "@/components/Cart";
import { ChatButtons } from "@/components/ChatButtons";
import { shop as info, telUrl, zaloUrl, messengerUrl } from "@/lib/shop";
import { FREE_SHIP_FROM, vnd } from "@/lib/format";

const shop = info.name;
export const metadata: Metadata = { title: shop, description: `${shop} - ${info.tagline}. Giao hàng toàn quốc, thanh toán khi nhận hàng hoặc chuyển khoản QR.` };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <CartProvider>
          <header className="header">
            <div className="wrap header-in">
              <Link href="/" className="logo">{shop}</Link>
              <form action="/" className="search">
                <input name="q" placeholder="Tìm sản phẩm..." />
              </form>
              <Link href="/tra-cuu" className="cart-link">Đơn hàng</Link>
              <Link href="/gio-hang" className="cart-link">Giỏ hàng <CartBadge /></Link>
            </div>
          </header>
          <main className="wrap main">{children}</main>
          <footer className="footer">
            <div className="wrap foot-grid">
              <div>
                <div className="foot-logo">{shop}</div>
                <p>{info.tagline}.</p>
                {info.address && <p>📍 {info.address}</p>}
                {info.openHours && <p>🕘 {info.openHours}</p>}
              </div>
              <div>
                <h4>Liên hệ</h4>
                {info.hotline && <p>☎ Hotline: <a href={telUrl}>{info.hotline}</a></p>}
                {zaloUrl && <p>💬 <a href={zaloUrl} target="_blank" rel="noopener">Chat Zalo</a></p>}
                {messengerUrl && <p>💬 <a href={messengerUrl} target="_blank" rel="noopener">Messenger</a></p>}
                {info.facebook && <p>👍 <a href={info.facebook} target="_blank" rel="noopener">Facebook</a></p>}
                {info.shopee && <p>🛍️ <a href={info.shopee} target="_blank" rel="noopener">Gian hàng Shopee</a></p>}
              </div>
              <div>
                <h4>Mua hàng</h4>
                <p>🚚 Miễn phí vận chuyển đơn từ {vnd(FREE_SHIP_FROM)}</p>
                <p>💵 Thanh toán khi nhận hàng (COD)</p>
                <p>📱 Chuyển khoản bằng mã QR</p>
                {info.returnPolicy && <p>🔄 {info.returnPolicy}</p>}
              </div>
              <div>
                <h4>Hỗ trợ</h4>
                <p><Link href="/tra-cuu">Tra cứu đơn hàng</Link></p>
                <p><Link href="/gio-hang">Giỏ hàng</Link></p>
              </div>
            </div>
            <div className="wrap copy">© {new Date().getFullYear()} {shop}</div>
          </footer>
          <ChatButtons />
        </CartProvider>
      </body>
    </html>
  );
}
