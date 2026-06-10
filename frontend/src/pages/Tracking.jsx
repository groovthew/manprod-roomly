import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { api, formatRupiah, formatDateTime } from "../api.js";

const STEPS_BY_TYPE = {
  laundry: [
    { key: "Diterima", label: "Diterima", icon: "📥", desc: "Pesanan masuk ke sistem", eta: "± 10 menit" },
    { key: "Dikonfirmasi", label: "Dikonfirmasi", icon: "✅", desc: "Pesanan dikonfirmasi admin", eta: "± 15 menit" },
    { key: "Dijemput", label: "Dijemput Driver", icon: "🚚", desc: "Driver menjemput pakaian dari rumah Anda", eta: "± 30 menit" },
    { key: "Diproses", label: "Diproses", icon: "🧼", desc: "Pakaian sedang dicuci & disetrika", eta: "sesuai layanan" },
    { key: "Diantar", label: "Diantar Driver", icon: "📦", desc: "Driver mengantar pesanan kembali", eta: "± 30 menit" },
    { key: "Selesai", label: "Selesai", icon: "🎉", desc: "Pesanan diterima pelanggan", eta: "—" }
  ],
  cleaning: [
    { key: "Diterima", label: "Diterima", icon: "📥", desc: "Pesanan masuk ke sistem", eta: "± 10 menit" },
    { key: "Dikonfirmasi", label: "Dikonfirmasi", icon: "✅", desc: "Pesanan dikonfirmasi admin", eta: "± 15 menit" },
    { key: "Diproses", label: "Diproses", icon: "🧹", desc: "Tim sedang mengerjakan di lokasi", eta: "sesuai layanan" },
    { key: "Selesai", label: "Selesai", icon: "🎉", desc: "Pesanan selesai", eta: "—" }
  ]
};

const STATUS_THEME = {
  "Diterima": { color: "#f59e0b", bg: "#fffbeb", icon: "📥" },
  "Dikonfirmasi": { color: "#3b82f6", bg: "#eff6ff", icon: "✅" },
  "Dijemput": { color: "#06b6d4", bg: "#ecfeff", icon: "🚚" },
  "Diproses": { color: "#8b5cf6", bg: "#f5f3ff", icon: "⚙️" },
  "Diantar": { color: "#06b6d4", bg: "#ecfeff", icon: "📦" },
  "Selesai": { color: "#10b981", bg: "#ecfdf5", icon: "🎉" },
  "Dibatalkan": { color: "#ef4444", bg: "#fef2f2", icon: "❌" }
};

const findEntry = (timeline, status) => timeline.find((t) => t.status === status);

export default function Tracking() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);
  const prevStatusRef = useRef(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const b = await api.getBooking(id);
      // detect status change for a visible notification
      if (prevStatusRef.current && prevStatusRef.current !== b.status) {
        setToast({ status: b.status });
        setTimeout(() => setToast(null), 6000);
      }
      prevStatusRef.current = b.status;
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

  const steps = STEPS_BY_TYPE[booking.type] || [];
  const cancelled = booking.status === "Dibatalkan";
  const currentIdx = cancelled ? -1 : steps.findIndex((s) => s.key === booking.status);
  const isLaundry = booking.type === "laundry";
  const driverActive = booking.status === "Dijemput" || booking.status === "Diantar";
  const theme = STATUS_THEME[booking.status] || STATUS_THEME["Diterima"];
  const nextStep = !cancelled && currentIdx >= 0 && currentIdx < steps.length - 1
    ? steps[currentIdx + 1] : null;
  const isDone = booking.status === "Selesai";
  const progressPct = cancelled ? 0 : Math.round(((currentIdx + 1) / steps.length) * 100);

  return (
    <div className="tracking-page">
      {toast && (
        <div className="status-toast" style={{ borderColor: (STATUS_THEME[toast.status] || theme).color }}>
          <span className="status-toast-icon">{(STATUS_THEME[toast.status] || theme).icon}</span>
          <div>
            <strong>Status pesanan diperbarui!</strong>
            <p>Sekarang: <b>{toast.status}</b></p>
          </div>
          <button onClick={() => setToast(null)} aria-label="Tutup">✕</button>
        </div>
      )}

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

      {/* Prominent current-status banner (feedback: notifikasi status lebih terlihat) */}
      {!cancelled && (
        <div className="status-hero" style={{ background: theme.bg, borderColor: theme.color }}>
          <div className="status-hero-main">
            <span className="status-hero-icon" style={{ background: theme.color }}>{theme.icon}</span>
            <div>
              <span className="status-hero-label">Status Saat Ini</span>
              <h2 style={{ color: theme.color }}>{booking.status}</h2>
            </div>
          </div>
          <div className="status-hero-next">
            {isDone ? (
              <span className="status-hero-done">✅ Pesanan Anda telah selesai. Terima kasih! 🎉</span>
            ) : nextStep ? (
              <>
                <span className="status-hero-next-label">Selanjutnya</span>
                <strong>{nextStep.icon} {nextStep.label}</strong>
                <span className="status-hero-eta">⏱ Estimasi: {nextStep.eta}</span>
              </>
            ) : null}
          </div>
          <div className="status-hero-progress">
            <div className="status-hero-bar">
              <div className="status-hero-fill" style={{ width: `${progressPct}%`, background: theme.color }} />
            </div>
            <span>{progressPct}%</span>
          </div>
        </div>
      )}

      <div className="tracking-summary">
        <div>
          <span className="booking-type">{isLaundry ? "🧺 Laundry" : "🧹 Cleaning"}</span>
          <h2>{booking.service.name}</h2>
          <p className="muted">{booking.customerName} · {booking.phone}</p>
          <p className="muted">📍 {booking.address}</p>
        </div>
        <div className="tracking-total">
          <span>Total</span>
          <strong>{formatRupiah(booking.totalPrice)}</strong>
        </div>
      </div>

      {isLaundry && booking.driver && (
        <div className={`driver-card ${driverActive ? "active" : ""}`}>
          <div className="driver-avatar">🛵</div>
          <div className="driver-info">
            <div className="driver-label">
              {booking.status === "Dijemput" && <span className="driver-status pickup">🚚 Sedang Menjemput</span>}
              {booking.status === "Diantar" && <span className="driver-status deliver">📦 Sedang Mengantar</span>}
              {!driverActive && <span className="driver-status">🛵 Driver Ditugaskan</span>}
            </div>
            <h3>{booking.driver.name}</h3>
            <p>📞 <a href={`tel:${booking.driver.phone}`}>{booking.driver.phone}</a></p>
            {booking.driver.vehicle && <p className="muted">🚗 {booking.driver.vehicle}</p>}
          </div>
        </div>
      )}

      {isLaundry && !booking.driver && !cancelled && (
        <div className="driver-pending">
          🛵 Driver belum ditugaskan untuk pesanan ini
        </div>
      )}

      {cancelled ? (
        <div className="cancelled-banner">
          <h3>❌ Pesanan Dibatalkan</h3>
          {findEntry(booking.timeline, "Dibatalkan") && (
            <p>Dibatalkan pada {formatDateTime(findEntry(booking.timeline, "Dibatalkan").timestamp)}</p>
          )}
        </div>
      ) : (
        <div className="tracking-stepper">
          {steps.map((step, idx) => {
            const entry = findEntry(booking.timeline, step.key);
            const reached = idx <= currentIdx;
            const active = idx === currentIdx;
            const isDriverStep = step.key === "Dijemput" || step.key === "Diantar";
            return (
              <div key={step.key} className={`step ${reached ? "reached" : ""} ${active ? "active" : ""}`}>
                <div className="step-icon">{reached ? "✓" : step.icon}</div>
                <div className="step-content">
                  <div className="step-head">
                    <h4>{step.label}</h4>
                    {step.eta && step.eta !== "—" && (
                      <span className={`step-eta ${active ? "active" : ""}`}>⏱ {step.eta}</span>
                    )}
                  </div>
                  <p className="step-desc">{step.desc}</p>
                  {isDriverStep && booking.driver && (active || reached) && (
                    <p className="step-driver">👤 {booking.driver.name} · {booking.driver.phone}</p>
                  )}
                  {entry && <p className="step-time">✓ {formatDateTime(entry.timestamp)}</p>}
                  {!entry && active && <p className="step-time pulse-text">⏳ Sedang berlangsung...</p>}
                  {!entry && !active && <p className="step-time muted">Menunggu...</p>}
                </div>
                {idx < steps.length - 1 && <div className="step-line" />}
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
