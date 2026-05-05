import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, formatRupiah } from "../api.js";
import { useAuth } from "../auth.jsx";
import ServiceCarousel from "../components/ServiceCarousel.jsx";

const initialForm = { serviceId: "", sessions: 1, scheduleDate: "", scheduleTime: "", notes: "" };
const timeSlots = ["08:00", "10:00", "13:00", "15:00", "17:00"];

export default function CleaningBooking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getCleaningServices().then(setServices).catch((err) => setError(err.message));
  }, []);

  const selectedService = useMemo(
    () => services.find((s) => s.id === form.serviceId),
    [services, form.serviceId]
  );
  const total = selectedService ? selectedService.price * Number(form.sessions || 0) : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const booking = await api.createCleaningBooking({ ...form, userId: user.id });
      setForm(initialForm);
      navigate(`/payment/${booking.id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const profileIncomplete = !user.address;

  return (
    <div className="booking-page">
      <div className="booking-hero">
        <div className="booking-hero-content">
          <div className="booking-hero-text">
            <span className="booking-hero-badge">✨ Layanan Cleaning Profesional</span>
            <h1>
              Rumah <span className="accent">Bersih</span> &amp; <span className="accent">Rapi</span> Tanpa Repot
            </h1>
            <p>Pilih jenis cleaning, tentukan jadwal, dan biarkan tim kami yang bekerja.</p>
          </div>
          <div className="booking-hero-icon">🧹</div>
        </div>
      </div>

      <div className="profile-banner">
        <div>
          <strong>👤 {user.name}</strong>
          <span> · {user.phone}</span>
          <p className="muted">📍 {user.address || <em>Alamat belum diisi</em>}</p>
        </div>
        <Link to="/profile" className="btn btn-secondary">Edit Profil</Link>
      </div>

      {profileIncomplete && (
        <div className="alert error">⚠️ Lengkapi alamat di <Link to="/profile">profil</Link> sebelum memesan.</div>
      )}

      <div className="booking-layout">
        <div className="services-section">
          <h2 className="section-heading">Pilih Layanan Cleaning</h2>
          <ServiceCarousel
            services={services}
            selectedId={form.serviceId}
            onSelect={(id) => setForm((p) => ({ ...p, serviceId: id }))}
          />
        </div>

        <form className="booking-form" onSubmit={handleSubmit}>
          <h2>Detail Pemesanan</h2>

          <div className="form-row">
            <label>
              Jumlah Sesi
              <input
                name="sessions"
                type="number"
                min="1"
                value={form.sessions}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Tanggal Layanan
              <input
                name="scheduleDate"
                type="date"
                value={form.scheduleDate}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </label>
          </div>

          <label>
            Pilih Jam Kedatangan
            <div className="time-slots">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  type="button"
                  className={`time-slot ${form.scheduleTime === time ? "selected" : ""}`}
                  onClick={() => setForm((p) => ({ ...p, scheduleTime: time }))}
                >
                  {time}
                </button>
              ))}
            </div>
          </label>

          <label>
            Catatan (opsional)
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Contoh: Ada hewan peliharaan"
              rows={2}
            />
          </label>

          {selectedService && (
            <div className="summary">
              <div className="summary-row"><span>Layanan</span><strong>{selectedService.name}</strong></div>
              <div className="summary-row"><span>Harga / sesi</span><span>{formatRupiah(selectedService.price)}</span></div>
              <div className="summary-row"><span>Jumlah Sesi</span><span>{form.sessions}</span></div>
              <div className="summary-row total"><span>Total</span><strong>{formatRupiah(total)}</strong></div>
            </div>
          )}

          {error && <div className="alert error">⚠️ {error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || !form.serviceId || !form.scheduleTime || profileIncomplete}
          >
            {loading ? "Memproses..." : "Konfirmasi & Lanjut Pembayaran →"}
          </button>
        </form>
      </div>
    </div>
  );
}
