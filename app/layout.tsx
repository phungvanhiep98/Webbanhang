import "./globals.css";
import Link from "next/link";
import type { Metadata } from "next";
import { CartProvider, CartBadge } from "@/components/Cart";

const shop = process.env.SHOP_NAME || "Shop Như Ý Bé";
export const metadata: Metadata = { title: shop, description: `${shop} - mua sắm online, thanh toán dễ dàng` };

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
              <Link href="/gio-hang" className="cart-link">Giỏ hàng <CartBadge /></Link>
            </div>
          </header>
          <main className="wrap main">{children}</main>
          <footer className="footer">
            <div className="wrap">© {new Date().getFullYear()} {shop} · Giao hàng toàn quốc · Miễn phí vận chuyển đơn từ 300.000₫</div>
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
