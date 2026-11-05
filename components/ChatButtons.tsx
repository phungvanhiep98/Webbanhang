import { zaloUrl, messengerUrl, telUrl, shop } from "@/lib/shop";

export function ChatButtons() {
  if (!zaloUrl && !messengerUrl && !telUrl && !shop.facebook) return null;
  return (
    <div className="float-chat">
      {zaloUrl && <a href={zaloUrl} target="_blank" rel="noopener" className="fc zalo" title="Chat Zalo">Zalo</a>}
      {messengerUrl && <a href={messengerUrl} target="_blank" rel="noopener" className="fc mess" title="Chat Messenger">Chat</a>}
      {shop.facebook && <a href={shop.facebook} target="_blank" rel="noopener" className="fc fb" title="Nhóm Facebook">f</a>}
      {telUrl && <a href={telUrl} className="fc tel" title="Gọi điện">☎</a>}
    </div>
  );
}
