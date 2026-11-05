import crypto from "crypto";
import type { Order } from "./db";

const env = (k: string) => process.env[k] ?? "";
export const siteUrl = () => env("SITE_URL") || "http://localhost:3000";

/* ---------- Chuyển khoản qua VietQR ---------- */
export function bankInfo() {
  return {
    bankId: env("BANK_ID"),
    accountNo: env("BANK_ACCOUNT_NO"),
    accountName: env("BANK_ACCOUNT_NAME"),
  };
}

export function vietQrUrl(order: Pick<Order, "id" | "total">) {
  const b = bankInfo();
  const q = new URLSearchParams({
    amount: String(order.total),
    addInfo: order.id,
    accountName: b.accountName,
  });
  return `https://img.vietqr.io/image/${b.bankId}-${b.accountNo}-compact2.png?${q}`;
}

/* ---------- VNPay (API v2.1.0) ---------- */
export const vnpayEnabled = () => !!(env("VNPAY_TMN_CODE") && env("VNPAY_HASH_SECRET"));

function vnpEncode(params: Record<string, string>) {
  return Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k]).replace(/%20/g, "+")}`)
    .join("&");
}

function vnpDate(d: Date) {
  const t = new Date(d.getTime() + 7 * 3600 * 1000); // giờ Việt Nam
  const p = (n: number) => String(n).padStart(2, "0");
  return `${t.getUTCFullYear()}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}${p(t.getUTCHours())}${p(t.getUTCMinutes())}${p(t.getUTCSeconds())}`;
}

export function vnpayPaymentUrl(order: Pick<Order, "id" | "total">, ip: string) {
  const params: Record<string, string> = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: env("VNPAY_TMN_CODE"),
    vnp_Amount: String(order.total * 100),
    vnp_CurrCode: "VND",
    vnp_TxnRef: order.id,
    vnp_OrderInfo: `Thanh toan don hang ${order.id}`,
    vnp_OrderType: "other",
    vnp_Locale: "vn",
    vnp_ReturnUrl: `${siteUrl()}/api/payment/vnpay/return`,
    vnp_IpAddr: ip || "127.0.0.1",
    vnp_CreateDate: vnpDate(new Date()),
  };
  const signData = vnpEncode(params);
  const hash = crypto.createHmac("sha512", env("VNPAY_HASH_SECRET")).update(signData).digest("hex");
  return `${env("VNPAY_URL")}?${signData}&vnp_SecureHash=${hash}`;
}

/** Kiểm tra chữ ký VNPay gửi về. */
export function vnpayVerify(query: URLSearchParams) {
  const params: Record<string, string> = {};
  query.forEach((v, k) => {
    if (k.startsWith("vnp_") && k !== "vnp_SecureHash" && k !== "vnp_SecureHashType") params[k] = v;
  });
  const hash = crypto.createHmac("sha512", env("VNPAY_HASH_SECRET")).update(vnpEncode(params)).digest("hex");
  const given = query.get("vnp_SecureHash") ?? "";
  const ok = given.length === hash.length && crypto.timingSafeEqual(Buffer.from(given.toLowerCase()), Buffer.from(hash));
  return {
    ok,
    orderId: params.vnp_TxnRef,
    amount: Number(params.vnp_Amount) / 100,
    success: params.vnp_ResponseCode === "00" && params.vnp_TransactionStatus === "00",
    transactionNo: params.vnp_TransactionNo,
  };
}

/* ---------- MoMo (API v2) ---------- */
export const momoEnabled = () =>
  !!(env("MOMO_PARTNER_CODE") && env("MOMO_ACCESS_KEY") && env("MOMO_SECRET_KEY"));

const momoSign = (raw: string) =>
  crypto.createHmac("sha256", env("MOMO_SECRET_KEY")).update(raw).digest("hex");

export async function momoPaymentUrl(order: Pick<Order, "id" | "total">) {
  const partnerCode = env("MOMO_PARTNER_CODE");
  const accessKey = env("MOMO_ACCESS_KEY");
  const requestId = `${order.id}_${Date.now()}`;
  const orderId = requestId; // MoMo yêu cầu orderId không trùng giữa các lần thử
  const amount = String(order.total);
  const orderInfo = `Thanh toan don hang ${order.id}`;
  const redirectUrl = `${siteUrl()}/api/payment/momo/return`;
  const ipnUrl = `${siteUrl()}/api/payment/momo/ipn`;
  const requestType = "captureWallet";
  const extraData = "";
  const raw = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  const res = await fetch(env("MOMO_ENDPOINT"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      partnerCode, requestId, amount, orderId, orderInfo, redirectUrl, ipnUrl,
      requestType, extraData, lang: "vi", signature: momoSign(raw),
    }),
  });
  const data = await res.json();
  if (data.resultCode !== 0 || !data.payUrl) throw new Error(data.message || "MoMo lỗi");
  return data.payUrl as string;
}

/** Kiểm tra chữ ký MoMo gửi về (IPN hoặc redirect). */
export function momoVerify(p: Record<string, string>) {
  const raw = `accessKey=${env("MOMO_ACCESS_KEY")}&amount=${p.amount}&extraData=${p.extraData ?? ""}&message=${p.message}&orderId=${p.orderId}&orderInfo=${p.orderInfo}&orderType=${p.orderType}&partnerCode=${p.partnerCode}&payType=${p.payType}&requestId=${p.requestId}&responseTime=${p.responseTime}&resultCode=${p.resultCode}&transId=${p.transId}`;
  return {
    ok: momoSign(raw) === p.signature,
    orderId: String(p.orderId ?? "").split("_")[0],
    amount: Number(p.amount),
    success: String(p.resultCode) === "0",
    transId: String(p.transId ?? ""),
  };
}
