import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatRupiah, formatDateTime } from "../api.js";
import { useAuth } from "../auth.jsx";

const statusClass = (s) =>
  ({
    "Diterima": "status-pending",
    "Dikonfirmasi": "status-confirmed",
    "Dijemput": "status-driver",
    "Diproses": "status-processing",
    "Diantar": "status-driver",
    "Selesai": "status-done",
    "Dibatalkan": "status-cancelled"
  }[s] || "");

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUserBookings(user.id)
      .then(setBookings)
      .finally(() => setLoading(false));
  }, [user.id]);

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.type === filter);

  return (
    <div className="bookings-page">
      <div className="page-header">
        <h1>📋 Pesanan Saya</h1>
        <p>Pantau status pesanan Anda secara real-time.</p>
      </div>

      <div className="filter-tabs">
        <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
          Semua ({bookings.length})
        </button>
        <button className={filter === "laundry" ? "active" : ""} onClick={() => setFilter("laundry")}>
          🧺 Laundry ({bookings.filter((b) => b.type === "laundry").length})
        </button>
        <button className={filter === "cleaning" ? "active" : ""} onClick={() => setFilter("cleaning")}>
          🧹 Cleaning ({bookings.filter((b) => b.type === "cleaning").length})
        </button>
      </div>

      {loading && <p className="empty">Memuat...</p>}
      {!loading && filtered.length === 0 && (
        <div className="empty">
          <p>Belum ada pesanan.</p>
          <p>Pesan layanan Roomly sekarang!</p>
          <div style={{ marginTop: "1rem", display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link to="/laundry" className="btn btn-primary">🧺 Pesan Laundry</Link>
            <Link to="/cleaning" className="btn btn-secondary">🧹 Pesan Cleaning</Link>
          </div>
        </div>
      )}

      <div className="bookings-grid">
        {filtered.map((booking) => (
          <div key={booking.id} className="booking-card">
            <div className="booking-card-header">
              <div>
                <span className="booking-type">{booking.type === "laundry" ? "🧺 Laundry" : "🧹 Cleaning"}</span>
                <h3>{booking.service.name}</h3>
              </div>
              <span className={`status-badge ${statusClass(booking.status)}`}>{booking.status}</span>
            </div>

            <div className="booking-card-body">
              <div className="booking-info">
                {booking.type === "laundry" ? (
                  <span>📅 Penjemputan: {booking.pickupDate}</span>
                ) : (
                  <span>📅 Jadwal: {booking.scheduleDate} pukul {booking.scheduleTime}</span>
                )}
                <span>📍 {booking.address}</span>
                {booking.type === "laundry" && booking.driver && (
                  <span className="driver-tag">🛵 Driver: <strong>{booking.driver.name}</strong> · {booking.driver.phone}</span>
                )}
                {booking.notes && <span>📝 {booking.notes}</span>}
                <span className="muted">Dipesan {formatDateTime(booking.createdAt)}</span>
              </div>

              <div className="booking-total">
                <span>Total</span>
                <strong>{formatRupiah(booking.totalPrice)}</strong>
              </div>
            </div>

            <Link to={`/tracking/${booking.id}`} className="btn btn-primary btn-block">
              📍 Lihat Live Tracking
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
