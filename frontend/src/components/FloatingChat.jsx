import { useState, useEffect, useRef, useCallback } from "react";
import { api, formatDateTime } from "../api.js";
import { useAuth } from "../auth.jsx";

export default function FloatingChat() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastSeenRef = useRef(0);
  const endRef = useRef(null);
  const fileRef = useRef(null);

  const isCustomer = user && user.role !== "admin";

  const loadMessages = useCallback(async () => {
    if (!isCustomer) return;
    try {
      const chat = await api.getSupportChat(user.id);
      const msgs = chat.messages || [];
      setMessages(msgs);
      const unseenAdminMsgs = msgs.filter(
        (m, i) => m.senderRole === "admin" && i >= lastSeenRef.current
      ).length;
      if (!open) setUnreadCount(unseenAdminMsgs);
    } catch {}
  }, [isCustomer, user, open]);

  useEffect(() => {
    if (!isCustomer) return;
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages, isCustomer]);

  useEffect(() => {
    if (open) {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
      lastSeenRef.current = messages.length;
      setUnreadCount(0);
    }
  }, [messages, open]);

  if (!isCustomer) return null;

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran foto maksimal 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setImageBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImagePreview(null);
    setImageBase64(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imageBase64) return;
    setSending(true);
    try {
      await api.sendSupportMessage(user.id, {
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        text: text.trim(),
        image: imageBase64
      });
      setText("");
      clearImage();
      await loadMessages();
    } catch (err) {
      alert("Gagal mengirim: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          className="fchat-launcher"
          onClick={() => setOpen(true)}
          aria-label="Buka chat support"
        >
          <span className="fchat-launcher-icon">💬</span>
          {unreadCount > 0 && <span className="fchat-launcher-badge">{unreadCount}</span>}
          <span className="fchat-launcher-pulse" />
        </button>
      )}

      {open && (
        <div className="fchat-panel">
          <div className="fchat-header">
            <div className="fchat-header-info">
              <div className="fchat-avatar">🛡️</div>
              <div>
                <strong>Roomly Support</strong>
                <span><span className="fchat-online" /> Online — siap membantu</span>
              </div>
            </div>
            <button className="fchat-close" onClick={() => setOpen(false)} aria-label="Tutup">
              ✕
            </button>
          </div>

          <div className="fchat-messages">
            {messages.length === 0 && (
              <div className="fchat-welcome">
                <div className="fchat-welcome-icon">👋</div>
                <h4>Halo {user.name}!</h4>
                <p>
                  Ada yang bisa kami bantu? Tulis pertanyaan, keluhan, atau permintaan khusus —
                  admin akan segera membalas.
                </p>
              </div>
            )}
            {messages.map((msg) => {
              const isMe = msg.senderId === user.id;
              return (
                <div key={msg.id} className={`fchat-bubble ${isMe ? "me" : "other"}`}>
                  {!isMe && (
                    <span className="fchat-sender">
                      🛡️ {msg.senderName}
                    </span>
                  )}
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="foto"
                      onClick={() => setViewImage(msg.image)}
                    />
                  )}
                  {msg.text && <p>{msg.text}</p>}
                  <span className="fchat-time">{formatDateTime(msg.createdAt)}</span>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          {imagePreview && (
            <div className="fchat-preview">
              <img src={imagePreview} alt="preview" />
              <button onClick={clearImage} aria-label="Hapus foto">✕</button>
            </div>
          )}

          <form className="fchat-input" onSubmit={handleSend}>
            <button
              type="button"
              className="fchat-photo"
              onClick={() => fileRef.current?.click()}
              aria-label="Kirim foto"
            >
              📷
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleImageSelect}
            />
            <input
              type="text"
              placeholder="Ketik pesan..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={sending}
            />
            <button
              type="submit"
              className="fchat-send"
              disabled={sending || (!text.trim() && !imageBase64)}
              aria-label="Kirim"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {viewImage && (
        <div className="fchat-lightbox" onClick={() => setViewImage(null)}>
          <img src={viewImage} alt="full" />
        </div>
      )}
    </>
  );
}
