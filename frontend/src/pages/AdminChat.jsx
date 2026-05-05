import { useState, useEffect, useRef, useCallback } from "react";
import { api, formatDateTime } from "../api.js";
import { useAuth } from "../auth.jsx";

export default function AdminChat() {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);

  const loadChats = useCallback(async () => {
    try {
      const list = await api.getAllSupportChats();
      setChats(list);
    } catch {}
  }, []);

  useEffect(() => {
    loadChats();
    const interval = setInterval(loadChats, 3000);
    return () => clearInterval(interval);
  }, [loadChats]);

  const activeChat = chats.find((c) => c.userId === activeUserId);

  useEffect(() => {
    if (activeChat) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages.length]);

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
    if (!activeChat) return;
    if (!text.trim() && !imageBase64) return;
    setSending(true);
    try {
      await api.sendSupportMessage(activeChat.userId, {
        senderId: user.id,
        senderName: user.name,
        senderRole: "admin",
        text: text.trim(),
        image: imageBase64
      });
      setText("");
      clearImage();
      await loadChats();
    } catch (err) {
      alert("Gagal mengirim: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="admin-chat-page">
      <div className="page-header">
        <h1>💬 Customer Support</h1>
        <p>Daftar percakapan customer. Klik salah satu untuk membalas.</p>
      </div>

      <div className="admin-chat-layout">
        <aside className="admin-chat-list">
          <h3>Percakapan ({chats.length})</h3>
          {chats.length === 0 && (
            <p className="empty-small">Belum ada chat dari customer.</p>
          )}
          {chats.map((c) => {
            const lastMsg = c.messages[c.messages.length - 1];
            return (
              <button
                key={c.userId}
                type="button"
                className={`admin-chat-item ${activeUserId === c.userId ? "active" : ""}`}
                onClick={() => setActiveUserId(c.userId)}
              >
                <div className="admin-chat-avatar">
                  {c.userName.charAt(0).toUpperCase()}
                </div>
                <div className="admin-chat-meta">
                  <strong>{c.userName}</strong>
                  <span className="admin-chat-preview">
                    {lastMsg
                      ? lastMsg.image
                        ? "📷 Foto"
                        : lastMsg.text
                      : "Belum ada pesan"}
                  </span>
                  <span className="admin-chat-time">
                    {formatDateTime(c.lastMessageAt)}
                  </span>
                </div>
              </button>
            );
          })}
        </aside>

        <section className="admin-chat-thread">
          {!activeChat && (
            <div className="admin-chat-empty">
              <span>💬</span>
              <p>Pilih percakapan untuk mulai membalas customer.</p>
            </div>
          )}

          {activeChat && (
            <>
              <div className="admin-chat-thread-header">
                <div className="admin-chat-avatar large">
                  {activeChat.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <strong>{activeChat.userName}</strong>
                  <span>{activeChat.messages.length} pesan</span>
                </div>
              </div>

              <div className="admin-chat-messages">
                {activeChat.messages.length === 0 && (
                  <p className="empty-small">Belum ada pesan dari customer ini.</p>
                )}
                {activeChat.messages.map((msg) => {
                  const isAdmin = msg.senderRole === "admin";
                  return (
                    <div
                      key={msg.id}
                      className={`fchat-bubble ${isAdmin ? "me" : "other"}`}
                    >
                      <span className="fchat-sender">
                        {isAdmin ? "🛡️ Anda (Admin)" : `👤 ${msg.senderName}`}
                      </span>
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
                  <button onClick={clearImage}>✕</button>
                </div>
              )}

              <form className="fchat-input" onSubmit={handleSend}>
                <button
                  type="button"
                  className="fchat-photo"
                  onClick={() => fileRef.current?.click()}
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
                  placeholder={`Balas ke ${activeChat.userName}...`}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="fchat-send"
                  disabled={sending || (!text.trim() && !imageBase64)}
                >
                  ➤
                </button>
              </form>
            </>
          )}
        </section>
      </div>

      {viewImage && (
        <div className="fchat-lightbox" onClick={() => setViewImage(null)}>
          <img src={viewImage} alt="full" />
        </div>
      )}
    </div>
  );
}
