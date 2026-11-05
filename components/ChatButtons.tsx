import { zaloUrl, messengerUrl, telUrl } from "@/lib/shop";

export function ChatButtons() {
  if (!zaloUrl && !messengerUrl && !telUrl) return null;
  return (
    <div className="float-chat">
      {zaloUrl && <a href={zaloUrl} target="_blank" rel="noopener" className="fc zalo" title="Chat Zalo">Zalo</a>}
      {messengerUrl && <a href={messengerUrl} target="_blank" rel="noopener" className="fc mess" title="Chat Messenger">Chat</a>}
      {telUrl && <a href={telUrl} className="fc tel" title="Gọi điện">☎</a>}
    </div>
  );
}
