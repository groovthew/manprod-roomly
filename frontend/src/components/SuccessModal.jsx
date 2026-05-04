import { useEffect, useState } from "react";
import { api, formatRupiah } from "../api.js";
import { downloadReceipt, getReceiptBase64 } from "../utils/receipt.js";

const METHOD_LABELS = {
  qris: "QRIS",
  cod: "Cash on Delivery",
  transfer: "Transfer Bank"
};

const CONFETTI_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4"];

export default function SuccessModal({ booking, user, onContinue }) {
  const isCod = booking.paymentMethod === "cod";
  const hasEmail = !!(user && user.email);

  const [emailState, setEmailState] = useState(hasEmail ? "sending" : "no-email");
  const [emailResult, setEmailResult] = useState(null);
  const [emailError, setEmailError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try { downloadReceipt(booking, user); } catch (e) { console.error("Download failed", e); }
    }, 1500);
    return () => clearTimeout(timer);
  }, [booking, user]);

  useEffect(() => {
    if (!hasEmail) return;
    let cancelled = false;
    (async () => {
      try {
        const base64 = getReceiptBase64(booking, user);
        const result = await api.emailReceipt(booking.id, base64);
        if (!cancelled) {
          setEmailResult(result);
          setEmailState("sent");
        }
      } catch (err) {
        if (!cancelled) {
          setEmailError(err.message);
          setEmailState("error");
        }
      }
    })();
    return () => { cancelled = true; };
  }, [booking, user, hasEmail]);

  const handleDownload = () => {
    try { downloadReceipt(booking, user); } catch (e) { alert("Gagal generate PDF: " + e.message); }
  };

  return (
    <div className="success-overlay" role="dialog" aria-live="polite">
      <div className="success-modal">
        <div className="success-confetti" aria-hidden="true">
          {Array.from({ length: 18 }).map((_, i) => {
            const angle = (i / 18) * Math.PI * 2;
            const distance = 120 + Math.random() * 80;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance;
            const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
            const delay = Math.random() * 0.3;
            const duration = 1.2 + Math.random() * 0.6;
            const size = 6 + Math.random() * 6;
            return (
              <span
                key={i}
                className="confetti"
                style={{
                  background: color,
                  width: `${size}px`,
                  height: `${size}px`,
                  "--dx": `${dx}px`,
                  "--dy": `${dy}px`,
                  animationDelay: `${delay}s`,
                  animationDuration: `${duration}s`
                }}
              />
            );
          })}
        </div>

        <div className="success-check-wrap">
          <div className="success-ring" />
          <div className="success-ring delay" />
          <svg className="success-check" viewBox="0 0 80 80" aria-hidden="true">
            <circle className="check-circle" cx="40" cy="40" r="36" />
            <path className="check-path" d="M22 41 L34 53 L58 28" />
          </svg>
        </div>

        <h2 className="success-title">
          {isCod ? "Pesanan Dikonfirmasi!" : "Transaksi Berhasil!"}
        </h2>
        <p className="success-amount">{formatRupiah(booking.totalPrice)}</p>
        <p className="success-method">via {METHOD_LABELS[booking.paymentMethod] || booking.paymentMethod}</p>

        {isCod && <p className="success-note">💵 Siapkan uang tunai saat driver tiba</p>}

        <div className="success-receipt-info">
          {emailState === "sending" && (
            <div className="receipt-row email-sending">
              <span className="spinner" />
              <div>
                <strong>Mengirim receipt ke email...</strong>
                <span>{user.email}</span>
              </div>
            </div>
          )}

          {emailState === "sent" && (
            <div className="receipt-row email-sent">
              <span>✉️</span>
              <div>
                <strong>Receipt terkirim!</strong>
                <code>{emailResult?.sentTo}</code>
                {emailResult?.mode === "demo" && emailResult?.previewUrl && (
                  <a
                    href={emailResult.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="preview-link"
                  >
                    🔍 Lihat preview email →
                  </a>
                )}
              </div>
            </div>
          )}

          {emailState === "error" && (
            <div className="receipt-row email-error">
              <span>❌</span>
              <div>
                <strong>Gagal kirim email</strong>
                <span>{emailError}</span>
              </div>
            </div>
          )}

          {emailState === "no-email" && (
            <div className="receipt-row email-missing">
              <span>⚠️</span>
              <div>
                <strong>Email belum terdaftar</strong>
                <span>Tambahkan email di profil untuk menerima receipt otomatis</span>
              </div>
            </div>
          )}

          <div className="receipt-row invoice">
            <span>📄</span>
            <div>
              <strong>Invoice</strong>
              <code>{booking.invoiceNumber}</code>
            </div>
          </div>
        </div>

        <button className="btn btn-secondary btn-block download-btn" onClick={handleDownload}>
          ⬇️ Download Receipt PDF
        </button>

        <button className="btn btn-primary btn-block success-cta" onClick={onContinue}>
          Lihat Tracking →
        </button>

        <p className="success-hint">PDF receipt akan otomatis ter-download...</p>
      </div>
    </div>
  );
}
