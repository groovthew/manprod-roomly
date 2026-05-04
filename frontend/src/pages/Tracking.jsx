import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { api, formatRupiah, formatDateTime } from "../api.js";

const STEPS_BY_TYPE = {
  laundry: [
    { key: "Diterima", label: "Diterima", icon: "📥", desc: "Pesanan masuk ke sistem" },
    { key: "Dikonfirmasi", label: "Dikonfirmasi", icon: "✅", desc: "Pesanan dikonfirmasi admin" },
    { key: "Dijemput", label: "Dijemput Driver", icon: "🚚", desc: "Driver menjemput pakaian dari rumah Anda" },
    { key: "Diproses", label: "Diproses", icon: "🧼", desc: "Pakaian sedang dicuci & disetrika" },
    { key: "Diantar", label: "Diantar Driver", icon: "📦", desc: "Driver mengantar pesanan kembali" },
    { key: "Selesai", label: "Selesai", icon: "🎉", desc: "Pesanan diterima pelanggan" }
  ],
  cleaning: [
    { key: "Diterima", label: "Diterima", icon: "📥", desc: "Pesanan masuk ke sistem" },
    { key: "Dikonfirmasi", label: "Dikonfirmasi", icon: "✅", desc: "Pesanan dikonfirmasi admin" },
    { key: "Diproses", label: "Diproses", icon: "🧹", desc: "Tim sedang mengerjakan di lokasi" },
    { key: "Selesai", label: "Selesai", icon: "🎉", desc: "Pesanan selesai" }
  ]
};

const findEntry = (timeline, status) => timeline.find((t) => t.status === status);

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

  const steps = STEPS_BY_TYPE[booking.type] || [];
  const cancelled = booking.status === "Dibatalkan";
  const currentIdx = cancelled ? -1 : steps.findIndex((s) => s.key === booking.status);
  const isLaundry = booking.type === "laundry";
  const driverActive = booking.status === "Dijemput" || booking.status === "Diantar";

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
                  <h4>{step.label}</h4>
                  <p className="step-desc">{step.desc}</p>
                  {isDriverStep && booking.driver && (active || reached) && (
                    <p className="step-driver">👤 {booking.driver.name} · {booking.driver.phone}</p>
                  )}
                  {entry && <p className="step-time">{formatDateTime(entry.timestamp)}</p>}
                  {!entry && <p className="step-time muted">Menunggu...</p>}
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
