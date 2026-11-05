import { vnpayEnabled, momoEnabled, bankInfo } from "@/lib/payments";
import { CheckoutForm } from "./CheckoutForm";

export const dynamic = "force-dynamic";

export default function CheckoutPage() {
  const methods = ["cod"];
  if (bankInfo().accountNo) methods.push("bank");
  if (vnpayEnabled()) methods.push("vnpay");
  if (momoEnabled()) methods.push("momo");
  return <CheckoutForm methods={methods} />;
}
