import { useEffect, useMemo, useState } from "react";
import { api, formatRupiah } from "../api.js";

const initialForm = {
  customerName: "",
  phone: "",
  address: "",
  serviceId: "",
  sessions: 1,
  scheduleDate: "",
  scheduleTime: "",
  notes: ""
};

const timeSlots = ["08:00", "10:00", "13:00", "15:00", "17:00"];

export default function CleaningBooking() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getCleaningServices()
      .then(setServices)
      .catch((err) => setError(err.message));
  }, []);

  const selectedService = useMemo(
    () => services.find((s) => s.id === form.serviceId),
    [services, form.serviceId]
  );

  const total = selectedService ? selectedService.price * Number(form.sessions || 0) : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const booking = await api.createCleaningBooking(form);
      setSuccess(booking);
      setForm(initialForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="booking-page">
      <div className="page-header">
        <h1>🧹 Booking Cleaning Service</h1>
        <p>Pilih jenis cleaning dan tentukan jadwal kunjungan tim kami.</p>
      </div>

      <div className="booking-layout">
        <div className="services-list">
          <h2>Pilih Layanan</h2>
          {services.map((service) => (
            <button
              key={service.id}
              type="button"
              className={`service-option ${form.serviceId === service.id ? "selected" : ""}`}
              onClick={() => setForm((prev) => ({ ...prev, serviceId: service.id }))}
            >
              <div className="service-option-icon">{service.icon}</div>
              <div className="service-option-info">
                <h3>{service.name}</h3>
                <p className="duration">⏱ {service.duration}</p>
              </div>
              <div className="service-option-price">
                {formatRupiah(service.price)}
                <span>/{service.unit}</span>
              </div>
            </button>
          ))}
        </div>

        <form className="booking-form" onSubmit={handleSubmit}>
          <h2>Detail Pemesanan</h2>

          <label>
            Nama Lengkap
            <input
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
              placeholder="Contoh: Siti Aminah"
              required
            />
          </label>

          <label>
            Nomor HP / WhatsApp
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="08xxxxxxxxxx"
              required
            />
          </label>

          <label>
            Alamat Lokasi
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Alamat lengkap rumah/apartemen"
              rows={3}
              required
            />
          </label>

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
                  onClick={() => setForm((prev) => ({ ...prev, scheduleTime: time }))}
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
              <div className="summary-row">
                <span>Layanan</span>
                <strong>{selectedService.name}</strong>
              </div>
              <div className="summary-row">
                <span>Harga per sesi</span>
                <span>{formatRupiah(selectedService.price)}</span>
              </div>
              <div className="summary-row">
                <span>Jumlah Sesi</span>
                <span>{form.sessions}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <strong>{formatRupiah(total)}</strong>
              </div>
            </div>
          )}

          {error && <div className="alert error">⚠️ {error}</div>}
          {success && (
            <div className="alert success">
              ✅ Booking berhasil! ID: <strong>{success.id}</strong>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading || !form.serviceId || !form.scheduleTime}
          >
            {loading ? "Memproses..." : "Konfirmasi Pesanan"}
          </button>
        </form>
      </div>
    </div>
  );
}
