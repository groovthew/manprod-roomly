import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import { processMessage, createInitialState, welcomeMessage } from "../utils/chatbot.js";

const uid = () => `${Date.now()}-${Math.floor(Math.random() * 10000)}`;

export default function FloatingChat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [botState, setBotState] = useState(createInitialState());
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);

  const isCustomer = user && user.role !== "admin";
  const storeKey = user ? `roomly:botchat:${user.id}` : null;

  // Load persisted conversation (or seed welcome)
  useEffect(() => {
    if (!isCustomer || !storeKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storeKey) || "null");
      if (saved && saved.messages?.length) {
        setMessages(saved.messages);
        setBotState(saved.botState || createInitialState());
        return;
      }
    } catch {}
    const w = welcomeMessage(user);
    setMessages([{ id: uid(), sender: "bot", text: w.text, quickReplies: w.quickReplies }]);
  }, [isCustomer, storeKey]); // eslint-disable-line

  // Persist on change
  useEffect(() => {
    if (!storeKey || !messages.length) return;
    localStorage.setItem(storeKey, JSON.stringify({ messages, botState }));
  }, [messages, botState, storeKey]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, open]);

  const send = useCallback(async (rawText) => {
    const text = rawText.trim();
    if (!text) return;

    const userMsg = { id: uid(), sender: "user", text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    let result;
    try {
      result = await processMessage(botState, text, { user, api });
    } catch (err) {
      result = {
        messages: [{ text: "😔 Maaf, terjadi kesalahan. Coba lagi ya.", quickReplies: null }],
        state: createInitialState()
      };
    }

    // simulate human-like typing delay
    await new Promise((r) => setTimeout(r, 450));

    setMessages((m) => [
      ...m,
      ...result.messages.map((bm) => ({
        id: uid(), sender: "bot", text: bm.text, quickReplies: bm.quickReplies || null
      }))
    ]);
    setBotState(result.state);
    setTyping(false);

    if (result.navigateTo) {
      setTimeout(() => { setOpen(false); navigate(result.navigateTo); }, 1400);
    }
  }, [botState, user, navigate]);

  const handleQuickReply = (qr) => {
    if (qr.to) {
      setOpen(false);
      navigate(qr.to);
      return;
    }
    send(qr.value || qr.label);
  };

  const handleRestart = () => {
    const w = welcomeMessage(user);
    const fresh = [{ id: uid(), sender: "bot", text: w.text, quickReplies: w.quickReplies }];
    setMessages(fresh);
    setBotState(createInitialState());
  };

  if (!isCustomer) return null;

  // quick replies only render on the LAST bot message
  const lastBotIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === "bot") return i;
    }
    return -1;
  })();

  const renderText = (text) =>
    text.split("\n").map((line, i) => (
      <span key={i}>
        {line.split(/(\*[^*]+\*)/g).map((part, j) =>
          part.startsWith("*") && part.endsWith("*") && part.length > 2
            ? <strong key={j}>{part.slice(1, -1)}</strong>
            : part
        )}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    ));

  return (
    <>
      {!open && (
        <button className="fchat-launcher" onClick={() => setOpen(true)} aria-label="Buka RoomlyBot">
          <span className="fchat-launcher-icon">🤖</span>
          <span className="fchat-launcher-pulse" />
        </button>
      )}

      {open && (
        <div className="fchat-panel">
          <div className="fchat-header">
            <div className="fchat-header-info">
              <div className="fchat-avatar">🤖</div>
              <div>
                <strong>RoomlyBot</strong>
                <span><span className="fchat-online" /> Asisten Virtual · Online</span>
              </div>
            </div>
            <div className="fchat-header-actions">
              <button className="fchat-restart" onClick={handleRestart} title="Mulai ulang percakapan" aria-label="Restart">↻</button>
              <button className="fchat-close" onClick={() => setOpen(false)} aria-label="Tutup">✕</button>
            </div>
          </div>

          <div className="fchat-messages">
            {messages.map((msg, idx) => (
              <div key={msg.id} className={`fchat-row ${msg.sender}`}>
                <div className={`fchat-bubble ${msg.sender === "user" ? "me" : "other"}`}>
                  {msg.sender === "bot" && <span className="fchat-sender">🤖 RoomlyBot</span>}
                  <p>{renderText(msg.text)}</p>
                </div>
                {msg.sender === "bot" && idx === lastBotIdx && msg.quickReplies && !typing && (
                  <div className="fchat-quick-replies">
                    {msg.quickReplies.map((qr, k) => (
                      <button key={k} className="fchat-chip" onClick={() => handleQuickReply(qr)}>
                        {qr.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {typing && (
              <div className="fchat-row bot">
                <div className="fchat-bubble other fchat-typing">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            className="fchat-input"
            onSubmit={(e) => { e.preventDefault(); send(input); }}
          >
            <input
              type="text"
              placeholder="Ketik pesan ke RoomlyBot..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={typing}
            />
            <button type="submit" className="fchat-send" disabled={typing || !input.trim()} aria-label="Kirim">
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
