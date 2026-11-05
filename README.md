# Web bán hàng

Next.js 15 + SQLite. Có danh mục, tìm kiếm, trang sản phẩm (phân loại), giỏ hàng,
đặt hàng, thanh toán COD và chuyển khoản qua mã VietQR, trang quản lý đơn `/admin`.
VNPay và MoMo đã viết sẵn, chỉ hiện khi điền khóa trong `.env.local`.

## Chạy trên máy

```bash
npm install
cp .env.example .env.local   # sửa số tài khoản, tên ngân hàng, mật khẩu admin
npm run dev                  # mở http://localhost:3000
```

## Đưa sản phẩm từ Shopee vào (đã làm cho 20 sản phẩm hiện tại)

1. Shopee Kênh Người Bán → Sản phẩm → Sản phẩm của tôi → Công cụ xử lý hàng loạt
   → Cập nhật hàng loạt → tải file "Thông tin bán hàng" và "Hình ảnh" (và "Thông tin cơ bản" nếu muốn có mô tả).
2. Để 3 file vào một thư mục rồi chạy: `npm run import:shopee -- duong-dan-thu-muc`
   Giá khuyến mãi, danh mục, số đã bán chỉnh trong `data/overrides.json`. Sản phẩm hết hàng tự bị bỏ qua.
3. Sản phẩm được ghi vào `data/products.json` (có thể sửa tay file này).

## Quy trình đơn hàng

- COD: đơn ở trạng thái "Chờ thanh toán", shop gọi xác nhận rồi đổi trạng thái trong `/admin`.
- Chuyển khoản QR: khách quét mã có sẵn số tiền và nội dung là mã đơn.
  Khi tiền về tài khoản, shop vào `/admin` đổi sang "Đã thanh toán".
- VNPay/MoMo: trạng thái tự chuyển "Đã thanh toán" qua IPN
  (`/api/payment/vnpay/ipn`, `/api/payment/momo/ipn`).

## Khi đưa lên hosting

SQLite cần ổ đĩa lưu lâu dài (VPS, Railway, Render có disk). Nếu dùng Vercel thì phải
chuyển phần lưu đơn trong `lib/db.ts` sang Postgres (vd Neon, miễn phí).
