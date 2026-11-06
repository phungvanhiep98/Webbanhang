export const vnd = (n: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.round(n)) + "₫";

export const SHIPPING_FEE = 15000;
export const FREE_SHIP_FROM = 150000;
export const shippingFor = (subtotal: number) =>
  subtotal >= FREE_SHIP_FROM ? 0 : SHIPPING_FEE;

export const PAYMENT_LABELS: Record<string, string> = {
  cod: "Thanh toán khi nhận hàng (COD)",
  bank: "Chuyển khoản ngân hàng (quét mã QR)",
  vnpay: "VNPay (ATM, Visa, QR ngân hàng)",
  momo: "Ví MoMo",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Chờ thanh toán",
  paid: "Đã thanh toán",
  confirmed: "Đã xác nhận",
  shipping: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};
