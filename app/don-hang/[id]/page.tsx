import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrder } from "@/lib/db";
import { vnd, PAYMENT_LABELS, STATUS_LABELS } from "@/lib/format";
import { bankInfo, vietQrUrl } from "@/lib/payments";
import { WaitForPayment } from "./WaitForPayment";

export const dynamic = "force-dynamic";

// Ai có link/số điện thoại cũng xem được trang này, nên che bớt thông tin cá nhân
const maskPhone = (p: string) => p.slice(0, 3) + "****" + p.slice(-3);
const maskAddress = (a: string) => {
  const parts = a.split(",").map((x) => x.trim()).filter(Boolean);
  return parts.length > 1 ? "***, " + parts.slice(-2).join(", ") : "***";
};

export default async function OrderPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ loi?: string }>;
}) {
  const order = await getOrder((await params).id);
  if (!order) notFound();
  const { loi } = await searchParams;
  const b = bankInfo();
  const showQr = order.payment_method === "bank" && order.status === "pending";

  return (
    <>
      <div className="panel">
        <h2 style={{ marginTop: 0 }}>
          {loi ? "Thanh toán chưa thành công" : order.status === "paid" ? "Thanh toán thành công ✅" : "Đặt hàng thành công 🎉"}
        </h2>
        <p>Mã đơn hàng: <b>{order.id}</b> · Trạng thái: <span className={`tag ${order.status}`}>{STATUS_LABELS[order.status]}</span></p>
        <p className="muted">Phương thức: {PAYMENT_LABELS[order.payment_method]}</p>
        <p className="muted" style={{ fontSize: 14 }}>Bạn có thể xem lại đơn này bất cứ lúc nào ở mục <Link href="/tra-cuu" style={{ color: "var(--brand)" }}>Đơn hàng</Link> bằng số điện thoại đặt hàng.</p>
        {loi && <p className="err">Giao dịch bị hủy hoặc lỗi. Bạn có thể liên hệ shop hoặc đặt lại đơn.</p>}
        {order.status === "paid" && <p style={{ color: "var(--ok)" }}>Shop đã nhận được {vnd(order.total)}. Cảm ơn bạn, đơn hàng sẽ sớm được giao!</p>}
        {order.payment_method === "cod" && <p>Shop sẽ gọi xác nhận và giao hàng. Bạn thanh toán {vnd(order.total)} khi nhận hàng.</p>}
      </div>

      {showQr && (
        <div className="panel qr">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={vietQrUrl(order)} alt="Mã QR chuyển khoản" />
          <div>
            <h3 style={{ marginTop: 0 }}>Quét mã để chuyển khoản</h3>
            <p>Ngân hàng: <b>{b.bankId}</b></p>
            <p>Số tài khoản: <b>{b.accountNo}</b></p>
            <p>Chủ tài khoản: <b>{b.accountName}</b></p>
            <p>Số tiền: <b className="price">{vnd(order.total)}</b></p>
            <p>Nội dung: <b>{order.id}</b></p>
            <p className="muted">Vui lòng giữ nguyên nội dung chuyển khoản. Đơn sẽ được xác nhận khi shop nhận được tiền.</p>
            <WaitForPayment id={order.id} />
          </div>
        </div>
      )}

      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Chi tiết đơn hàng</h3>
        <p>{order.customer_name} · {maskPhone(order.phone)}<br /><span className="muted">{maskAddress(order.address)}</span></p>
        <table>
          <tbody>
            {order.items.map((i, k) => (
              <tr key={k}>
                <td>{i.name}{i.variant && <span className="muted"> ({i.variant})</span>}</td>
                <td>× {i.qty}</td>
                <td style={{ textAlign: "right" }}>{vnd(i.price * i.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="sum" style={{ marginTop: 12 }}><span>Tạm tính</span><span>{vnd(order.subtotal)}</span></div>
        {order.discount > 0 && <div className="sum" style={{ color: "var(--ok)" }}><span>Mã giảm giá {order.coupon}</span><span>−{vnd(order.discount)}</span></div>}
        <div className="sum"><span>Phí vận chuyển</span><span>{order.shipping ? vnd(order.shipping) : "Miễn phí"}</span></div>
        <div className="sum total"><span>Tổng cộng</span><span>{vnd(order.total)}</span></div>
        <Link href="/" className="btn ghost" style={{ marginTop: 12 }}>Tiếp tục mua sắm</Link>
      </div>
    </>
  );
}
