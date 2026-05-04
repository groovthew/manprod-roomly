import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, formatRupiah } from "../api.js";
import { useAuth } from "../auth.jsx";
import ServiceCarousel from "../components/ServiceCarousel.jsx";

const initialForm = { serviceId: "", quantity: 1, pickupDate: "", notes: "" };

export default function LaundryBooking() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getLaundryServices().then(setServices).catch((err) => setError(err.message));
  }, []);

  const selectedService = useMemo(
    () => services.find((s) => s.id === form.serviceId),
    [services, form.serviceId]
  );
  const total = selectedService ? selectedService.price * Number(form.quantity || 0) : 0;

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
      const booking = await api.createLaundryBooking({ ...form, userId: user.id });
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
      <div className="page-header">
        <h1>🧺 Booking Laundry Service</h1>
        <p>Pilih jenis layanan dan jadwal penjemputan. Identitas otomatis dari profil Anda.</p>
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
          <h2 className="section-heading">Pilih Layanan Laundry</h2>
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
              Jumlah ({selectedService?.unit || "kg"})
              <input
                name="quantity"
                type="number"
                min="1"
                step="0.5"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </label>

            <label>
              Tanggal Penjemputan
              <input
                name="pickupDate"
                type="date"
                value={form.pickupDate}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
                required
              />
            </label>
          </div>

          <label>
            Catatan (opsional)
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Contoh: Pisahkan pakaian putih"
              rows={2}
            />
          </label>

          {selectedService && (
            <div className="summary">
              <div className="summary-row"><span>Layanan</span><strong>{selectedService.name}</strong></div>
              <div className="summary-row"><span>Harga / {selectedService.unit}</span><span>{formatRupiah(selectedService.price)}</span></div>
              <div className="summary-row"><span>Jumlah</span><span>{form.quantity} {selectedService.unit}</span></div>
              <div className="summary-row total"><span>Total</span><strong>{formatRupiah(total)}</strong></div>
            </div>
          )}

          {error && <div className="alert error">⚠️ {error}</div>}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || !form.serviceId || profileIncomplete}
          >
            {loading ? "Memproses..." : "Konfirmasi & Lanjut Pembayaran →"}
          </button>
        </form>
      </div>
    </div>
  );
}
