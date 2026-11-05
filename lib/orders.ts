// Đổi trạng thái đơn: hủy đơn thì cộng lại tồn kho, mở lại đơn đã hủy thì trừ kho lại.
import { getOrder, setStatus } from "@/lib/db";
import { adjustStock } from "@/lib/catalog";
import { notifyPaid } from "@/lib/notify";

export async function changeStatus(id: string, status: string, paymentRef?: string) {
  const o = await getOrder(id);
  if (!o) return;
  await setStatus(id, status, paymentRef);
  if (o.status !== "cancelled" && status === "cancelled") await adjustStock(o.items, 1).catch(console.error);
  if (o.status === "cancelled" && status !== "cancelled") await adjustStock(o.items, -1).catch(console.error);
  if (o.status === "pending" && status === "paid" && paymentRef) await notifyPaid(o);
}
