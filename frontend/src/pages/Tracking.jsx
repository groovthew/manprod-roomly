import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api, formatRupiah, formatDateTime } from "../api.js";

const TRACKING_STEPS = [
  { key: "Diterima", label: "Diterima", icon: "📥", desc: "Pesanan masuk ke sistem" },
  { key: "Dikonfirmasi", label: "Dikonfirmasi", icon: "✅", desc: "Pesanan dikonfirmasi admin" },
  { key: "Diproses", label: "Diproses", icon: "⚙️", desc: "Tim sedang mengerjakan" },
  { key: "Selesai", label: "Selesai", icon: "🎉", desc: "Pesanan selesai" }
];

const findEntry = (timeline, status) => timeline.find((t) => t.status === status);
const stepIndex = (status) => TRACKING_STEPS.findIndex((s) => s.key === status);

export default function Tracking() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const b = await api.getBooking(id);
      setBooking(b);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  if (error) return (
    <div className="empty">
      <p>⚠️ {error}</p>
      <Link to="/my-bookings" className="btn btn-primary" style={{ marginTop: "1rem" }}>← Kembali</Link>
    </div>
  );

  if (!booking) return <div className="empty">Memuat tracking...</div>;

  const cancelled = booking.status === "Dibatalkan";
  const currentIdx = cancelled ? -1 : stepIndex(booking.status);

  return (
    <div className="tracking-page">
      <div className="page-header">
        <Link to="/my-bookings" className="back-link">← Kembali ke Pesanan</Link>
        <h1>Order Status</h1>
        <p>
          ID: <code>{booking.id}</code>
          <span className="live-indicator">
            <span className="dot" /> Update otomatis tiap 10 detik
          </span>
        </p>
      </div>

      <div className="tracking-summary">
        <div>
          <span className="booking-type">{booking.type === "laundry" ? "🧺 Laundry" : "🧹 Cleaning"}</span>
          <h2>{booking.service.name}</h2>
          <p className="muted">{booking.customerName} · {booking.phone}</p>
          <p className="muted">📍 {booking.address}</p>
        </div>
        <div className="tracking-total">
          <span>Total</span>
          <strong>{formatRupiah(booking.totalPrice)}</strong>
        </div>
      </div>

      {cancelled ? (
        <div className="cancelled-banner">
          <h3>❌ Pesanan Dibatalkan</h3>
          {findEntry(booking.timeline, "Dibatalkan") && (
            <p>Dibatalkan pada {formatDateTime(findEntry(booking.timeline, "Dibatalkan").timestamp)}</p>
          )}
        </div>
      ) : (
        <div className="tracking-stepper">
          {TRACKING_STEPS.map((step, idx) => {
            const entry = findEntry(booking.timeline, step.key);
            const reached = idx <= currentIdx;
            const active = idx === currentIdx;
            return (
              <div key={step.key} className={`step ${reached ? "reached" : ""} ${active ? "active" : ""}`}>
                <div className="step-icon">{reached ? "✓" : step.icon}</div>
                <div className="step-content">
                  <h4>{step.label}</h4>
                  <p className="step-desc">{step.desc}</p>
                  {entry && <p className="step-time">{formatDateTime(entry.timestamp)}</p>}
                  {!entry && <p className="step-time muted">Menunggu...</p>}
                </div>
                {idx < TRACKING_STEPS.length - 1 && <div className="step-line" />}
              </div>
            );
          })}
        </div>
      )}

      <div className="timeline-history">
        <h3>📜 Riwayat Status</h3>
        {booking.timeline.slice().reverse().map((entry, idx) => (
          <div key={idx} className="history-item">
            <div className="history-bullet" />
            <div>
              <strong>{entry.status}</strong>
              <p className="muted">{formatDateTime(entry.timestamp)}</p>
              {entry.note && <p>{entry.note}</p>}
            </div>
          </div>
        ))}
      </div>

      <button onClick={load} className="btn btn-secondary btn-block" disabled={refreshing}>
        {refreshing ? "Memuat..." : "🔄 Refresh sekarang"}
      </button>
    </div>
  );
}
