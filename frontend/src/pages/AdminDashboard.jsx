import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api, formatRupiah, formatDateTime } from "../api.js";
import ChatBox from "../components/ChatBox.jsx";

const STATUS_FLOW = {
  laundry: ["Diterima", "Dikonfirmasi", "Dijemput", "Diproses", "Diantar", "Selesai", "Dibatalkan"],
  cleaning: ["Diterima", "Dikonfirmasi", "Diproses", "Selesai", "Dibatalkan"]
};
const ALL_FILTER_STATUSES = ["Diterima", "Dikonfirmasi", "Dijemput", "Diproses", "Diantar", "Selesai", "Dibatalkan"];

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

function DriverForm({ booking, onSaved }) {
  const [form, setForm] = useState({
    name: booking.driver?.name || "",
    phone: booking.driver?.phone || "",
    vehicle: booking.driver?.vehicle || ""
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      await api.assignDriver(booking.id, form);
      onSaved();
    } catch (error) {
      setErr(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="driver-form" onSubmit={handleSubmit}>
      <div className="driver-form-title">🛵 {booking.driver ? "Update Driver" : "Tugaskan Driver"}</div>
      <div className="driver-form-fields">
        <input
          placeholder="Nama driver"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder="No. HP"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          required
        />
        <input
          placeholder="Kendaraan (opsional)"
          value={form.vehicle}
          onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
        />
      </div>
      {err && <div className="alert error" style={{ marginTop: "0.5rem" }}>⚠️ {err}</div>}
      <button type="submit" className="btn btn-secondary btn-sm" disabled={saving} style={{ marginTop: "0.5rem" }}>
        {saving ? "Menyimpan..." : booking.driver ? "Update Driver" : "Simpan Driver"}
      </button>
    </form>
  );
}

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDriver, setExpandedDriver] = useState(null);
  const [openChat, setOpenChat] = useState(null);

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

  const handleDriverSaved = () => {
    setExpandedDriver(null);
    load();
  };

  const filtered = bookings
    .filter((b) => filter === "all" || b.type === filter)
    .filter((b) => statusFilter === "all" || b.status === statusFilter);

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === "Diterima").length,
    processing: bookings.filter((b) => ["Dikonfirmasi", "Dijemput", "Diproses", "Diantar"].includes(b.status)).length,
    done: bookings.filter((b) => b.status === "Selesai").length,
    revenue: bookings.filter((b) => b.status === "Selesai").reduce((sum, b) => sum + b.totalPrice, 0)
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>🛡️ Dashboard Admin</h1>
        <p>Kelola pesanan, tugaskan driver, dan pantau status secara real-time.</p>
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
          {ALL_FILTER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {error && <div className="alert error">⚠️ {error}</div>}
      {loading && <p className="empty">Memuat...</p>}
      {!loading && filtered.length === 0 && <div className="empty">Tidak ada pesanan untuk filter ini.</div>}

      <div className="admin-bookings">
        {filtered.map((booking) => {
          const isLaundry = booking.type === "laundry";
          const statuses = STATUS_FLOW[booking.type] || [];
          return (
            <div key={booking.id} className="admin-booking-row">
              <div className="row-main">
                <div className="row-header">
                  <span className="booking-type">{isLaundry ? "🧺 Laundry" : "🧹 Cleaning"}</span>
                  <span className={`status-badge ${statusClass(booking.status)}`}>{booking.status}</span>
                </div>
                <h3>{booking.service.name}</h3>
                <div className="row-info">
                  <span>👤 {booking.customerName}</span>
                  <span>📞 {booking.phone}</span>
                  {isLaundry
                    ? <span>📅 Penjemputan: {booking.pickupDate}</span>
                    : <span>📅 {booking.scheduleDate} pukul {booking.scheduleTime}</span>}
                  <span>💰 {formatRupiah(booking.totalPrice)}</span>
                </div>
                <small>📍 {booking.address}</small>
                {booking.notes && <small>📝 {booking.notes}</small>}
                {isLaundry && booking.driver && (
                  <small className="driver-tag">🛵 Driver: <strong>{booking.driver.name}</strong> · {booking.driver.phone}</small>
                )}
                <small className="row-meta">ID: {booking.id} · Dibuat {formatDateTime(booking.createdAt)}</small>
              </div>

              <div className="row-actions">
                <label>
                  Update Status
                  <select
                    value={booking.status}
                    onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                  >
                    {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>

                {isLaundry && (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => setExpandedDriver(expandedDriver === booking.id ? null : booking.id)}
                    >
                      🛵 {booking.driver ? "Edit Driver" : "Tugaskan Driver"}
                    </button>
                    {expandedDriver === booking.id && (
                      <DriverForm booking={booking} onSaved={handleDriverSaved} />
                    )}
                  </>
                )}

                <Link to={`/tracking/${booking.id}`} className="btn btn-secondary btn-sm">📍 Lihat Tracking</Link>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setOpenChat(openChat === booking.id ? null : booking.id)}
                >
                  💬 {openChat === booking.id ? "Tutup Chat" : "Chat Customer"}
                </button>
              </div>

              {openChat === booking.id && (
                <ChatBox bookingId={booking.id} onClose={() => setOpenChat(null)} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
