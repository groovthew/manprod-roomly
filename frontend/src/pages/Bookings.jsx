import { useEffect, useState } from "react";
import { api, formatRupiah } from "../api.js";

const STATUSES = ["Menunggu Konfirmasi", "Diproses", "Selesai", "Dibatalkan"];

const statusClass = (status) =>
  ({
    "Menunggu Konfirmasi": "status-pending",
    "Diproses": "status-processing",
    "Selesai": "status-done",
    "Dibatalkan": "status-cancelled"
  }[status] || "");

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getAllBookings();
      setBookings(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusChange = async (id, status) => {
    await api.updateStatus(id, status);
    load();
  };

  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.type === filter);

  return (
    <div className="bookings-page">
      <div className="page-header">
        <h1>📋 Daftar Pesanan</h1>
        <p>Kelola dan pantau semua pesanan layanan Anda di sini.</p>
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
          <p>Mulai pesan layanan Roomly sekarang!</p>
        </div>
      )}

      <div className="bookings-grid">
        {filtered.map((booking) => (
          <div key={booking.id} className="booking-card">
            <div className="booking-card-header">
              <div>
                <span className="booking-type">
                  {booking.type === "laundry" ? "🧺 Laundry" : "🧹 Cleaning"}
                </span>
                <h3>{booking.service.name}</h3>
              </div>
              <span className={`status-badge ${statusClass(booking.status)}`}>{booking.status}</span>
            </div>

            <div className="booking-card-body">
              <div className="booking-info">
                <span>👤 {booking.customerName}</span>
                <span>📞 {booking.phone}</span>
                <span>📍 {booking.address}</span>
                {booking.type === "laundry" ? (
                  <span>📅 Penjemputan: {booking.pickupDate}</span>
                ) : (
                  <span>📅 Jadwal: {booking.scheduleDate} pukul {booking.scheduleTime}</span>
                )}
                {booking.notes && <span>📝 {booking.notes}</span>}
              </div>

              <div className="booking-total">
                <span>Total</span>
                <strong>{formatRupiah(booking.totalPrice)}</strong>
              </div>
            </div>

            <div className="booking-card-footer">
              <small>ID: {booking.id}</small>
              <select
                value={booking.status}
                onChange={(e) => handleStatusChange(booking.id, e.target.value)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
