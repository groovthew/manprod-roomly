import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api, formatRupiah, formatDateTime } from "../api.js";

const STATUSES = ["Diterima", "Dikonfirmasi", "Diproses", "Selesai", "Dibatalkan"];

const statusClass = (s) =>
  ({
    "Diterima": "status-pending",
    "Dikonfirmasi": "status-confirmed",
    "Diproses": "status-processing",
    "Selesai": "status-done",
    "Dibatalkan": "status-cancelled"
  }[s] || "");

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api.getAllBookings();
      setBookings(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const handleStatusChange = async (id, status) => {
    try {
      await api.updateStatus(id, status);
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = bookings
    .filter((b) => filter === "all" || b.type === filter)
    .filter((b) => statusFilter === "all" || b.status === statusFilter);

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "Diterima").length,
    processing: bookings.filter((b) => ["Dikonfirmasi", "Diproses"].includes(b.status)).length,
    done: bookings.filter((b) => b.status === "Selesai").length,
    revenue: bookings.filter((b) => b.status === "Selesai").reduce((sum, b) => sum + b.totalPrice, 0)
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>🛡️ Dashboard Admin</h1>
        <p>Kelola seluruh pesanan dan update status secara real-time.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card"><span>Total Pesanan</span><strong>{stats.total}</strong></div>
        <div className="stat-card"><span>Belum Konfirmasi</span><strong>{stats.pending}</strong></div>
        <div className="stat-card"><span>Sedang Berjalan</span><strong>{stats.processing}</strong></div>
        <div className="stat-card"><span>Selesai</span><strong>{stats.done}</strong></div>
        <div className="stat-card revenue"><span>Pendapatan</span><strong>{formatRupiah(stats.revenue)}</strong></div>
      </div>

      <div className="filter-row">
        <div className="filter-tabs">
          <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>Semua</button>
          <button className={filter === "laundry" ? "active" : ""} onClick={() => setFilter("laundry")}>🧺 Laundry</button>
          <button className={filter === "cleaning" ? "active" : ""} onClick={() => setFilter("cleaning")}>🧹 Cleaning</button>
        </div>

        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="status-filter">
          <option value="all">Semua Status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <div className="alert error">⚠️ {error}</div>}
      {loading && <p className="empty">Memuat...</p>}
      {!loading && filtered.length === 0 && <div className="empty">Tidak ada pesanan untuk filter ini.</div>}

      <div className="admin-bookings">
        {filtered.map((booking) => (
          <div key={booking.id} className="admin-booking-row">
            <div className="row-main">
              <div className="row-header">
                <span className="booking-type">{booking.type === "laundry" ? "🧺 Laundry" : "🧹 Cleaning"}</span>
                <span className={`status-badge ${statusClass(booking.status)}`}>{booking.status}</span>
              </div>
              <h3>{booking.service.name}</h3>
              <div className="row-info">
                <span>👤 {booking.customerName}</span>
                <span>📞 {booking.phone}</span>
                {booking.type === "laundry"
                  ? <span>📅 Penjemputan: {booking.pickupDate}</span>
                  : <span>📅 {booking.scheduleDate} pukul {booking.scheduleTime}</span>}
                <span>💰 {formatRupiah(booking.totalPrice)}</span>
              </div>
              <small>📍 {booking.address}</small>
              {booking.notes && <small>📝 {booking.notes}</small>}
              <small className="row-meta">ID: {booking.id} · Dibuat {formatDateTime(booking.createdAt)}</small>
            </div>

            <div className="row-actions">
              <label>
                Update Status
                <select
                  value={booking.status}
                  onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <Link to={`/tracking/${booking.id}`} className="btn btn-secondary">📍 Lihat Tracking</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
