import { useState, useEffect, useRef, useCallback } from "react";
import { api, formatDateTime } from "../api.js";
import { useAuth } from "../auth.jsx";

export default function ChatBox({ bookingId, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [viewImage, setViewImage] = useState(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const data = await api.getMessages(bookingId);
      setMessages(data);
    } catch {}
  }, [bookingId]);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [loadMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
      await api.sendMessage(bookingId, {
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
    <div className="chatbox">
      <div className="chatbox-header">
        <span>💬 Chat — {bookingId}</span>
        <button className="chatbox-close" onClick={onClose}>✕</button>
      </div>

      <div className="chatbox-messages">
        {messages.length === 0 && (
          <p className="chatbox-empty">Belum ada pesan. Mulai percakapan!</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === user.id;
          return (
            <div key={msg.id} className={`chat-bubble ${isMe ? "me" : "other"}`}>
              <div className="chat-bubble-name">
                {isMe ? "Anda" : msg.senderName}
                {msg.senderRole === "admin" && !isMe && <span className="chat-admin-badge">Admin</span>}
              </div>
              {msg.image && (
                <img
                  src={msg.image}
                  alt="foto"
                  className="chat-image"
                  onClick={() => setViewImage(msg.image)}
                />
              )}
              {msg.text && <p className="chat-text">{msg.text}</p>}
              <span className="chat-time">{formatDateTime(msg.createdAt)}</span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {imagePreview && (
        <div className="chatbox-image-preview">
          <img src={imagePreview} alt="preview" />
          <button onClick={clearImage}>✕</button>
        </div>
      )}

      <form className="chatbox-input" onSubmit={handleSend}>
        <button type="button" className="chatbox-photo-btn" onClick={() => fileRef.current?.click()}>
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
        <button type="submit" className="chatbox-send" disabled={sending || (!text.trim() && !imageBase64)}>
          {sending ? "..." : "➤"}
        </button>
      </form>

      {viewImage && (
        <div className="chat-lightbox" onClick={() => setViewImage(null)}>
          <img src={viewImage} alt="full" />
        </div>
      )}
    </div>
  );
}
