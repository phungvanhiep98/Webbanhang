import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin";
import { telegramEnabled, chatId } from "@/lib/notify";
import { AdminNav } from "@/components/AdminNav";
import { connectTelegramAction, testTelegramAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function Notify({ searchParams }: { searchParams: Promise<{ ok?: string; loi?: string; thu?: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { ok, loi, thu } = await searchParams;
  const enabled = telegramEnabled();
  const connected = enabled && !!(await chatId());

  return (
    <>
      <AdminNav on="notify" />
      <div className="panel">
        <h3 style={{ marginTop: 0 }}>Báo đơn mới qua Telegram</h3>
        <p>Trạng thái: {connected ? <span className="tag paid">Đã kết nối</span> : enabled ? <span className="tag pending">Chưa kết nối</span> : <span className="tag">Chưa cài</span>}</p>
        {ok && <p style={{ color: "var(--ok)" }}>Đã kết nối với {ok}. Kiểm tra Telegram, sẽ có tin nhắn xác nhận.</p>}
        {thu && <p style={{ color: "var(--ok)" }}>Đã gửi tin nhắn thử.</p>}
        {loi && <p className="err">{loi}</p>}
        {!enabled && (
          <ol style={{ lineHeight: 1.8 }}>
            <li>Mở Telegram, tìm <b>@BotFather</b>, gửi <code>/newbot</code>, đặt tên bot. BotFather sẽ gửi lại một <b>token</b>.</li>
            <li>Vào Vercel → dự án → Settings → Environment Variables, thêm <code>TELEGRAM_BOT_TOKEN</code> = token vừa nhận, rồi Redeploy.</li>
            <li>Mở bot vừa tạo trên Telegram, bấm <b>Start</b>.</li>
            <li>Quay lại trang này, bấm <b>Kết nối Telegram</b>.</li>
          </ol>
        )}
        {enabled && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <form action={connectTelegramAction}><button className="btn">{connected ? "Kết nối lại" : "Kết nối Telegram"}</button></form>
            {connected && <form action={testTelegramAction}><button className="btn ghost">Gửi tin thử</button></form>}
          </div>
        )}
        {enabled && !connected && <p className="muted" style={{ fontSize: 14 }}>Trước khi bấm, mở bot của bạn trên Telegram và bấm Start (hoặc gửi một tin bất kỳ).</p>}
      </div>
    </>
  );
}
