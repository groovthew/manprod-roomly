import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, formatRupiah } from "../api.js";
import { useAuth } from "../auth.jsx";
import SuccessModal from "../components/SuccessModal.jsx";

const METHODS = [
  {
    id: "qris",
    name: "QRIS",
    icon: "📱",
    desc: "Scan kode QR via mobile banking / e-wallet",
    badge: "Instan"
  },
  {
    id: "cod",
    name: "Cash on Delivery",
    icon: "💵",
    desc: "Bayar tunai saat driver tiba di lokasi",
    badge: "Tanpa Aplikasi"
  },
  {
    id: "transfer",
    name: "Transfer Bank",
    icon: "🏦",
    desc: "Transfer ke rekening Roomly",
    badge: "Manual"
  }
];

export default function Payment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [paidBooking, setPaidBooking] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState("qris");
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    api.getBooking(id)
      .then((b) => {
        if (b.paymentStatus === "paid" || b.paymentStatus === "cod-pending") {
          navigate(`/tracking/${id}`, { replace: true });
          return;
        }
        setBooking(b);
      })
      .catch((err) => setError(err.message));
  }, [id, navigate]);

  const handlePay = async () => {
    setProcessing(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      const updated = await api.setPayment(id, selected);
      setPaidBooking(updated);
      setShowSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleContinue = () => navigate(`/tracking/${id}`);

  if (error) return (
    <div className="empty">
      <p>⚠️ {error}</p>
      <Link to="/my-bookings" className="btn btn-primary" style={{ marginTop: "1rem" }}>← Kembali</Link>
    </div>
  );

  if (!booking) return <div className="empty">Memuat...</div>;

  return (
    <div className="payment-page">
      <div className="page-header">
        <h1>💳 Pilih Metode Pembayaran</h1>
        <p>Selesaikan pembayaran untuk mengaktifkan pesanan Anda.</p>
      </div>

      <div className="payment-summary">
        <div className="payment-summary-row">
          <span>Layanan</span>
          <strong>{booking.service.icon} {booking.service.name}</strong>
        </div>
        <div className="payment-summary-row">
          <span>Tipe</span>
          <span>{booking.type === "laundry" ? "🧺 Laundry" : "🧹 Cleaning"}</span>
        </div>
        <div className="payment-summary-row">
          <span>Jumlah</span>
          <span>
            {booking.type === "laundry"
              ? `${booking.quantity} ${booking.service.unit}`
              : `${booking.sessions} sesi`}
          </span>
        </div>
        <div className="payment-summary-row total">
          <span>Total Pembayaran</span>
          <strong>{formatRupiah(booking.totalPrice)}</strong>
        </div>
      </div>

      <div className="payment-methods">
        <h2>Metode Pembayaran</h2>
        {METHODS.map((m) => (
          <label key={m.id} className={`payment-method ${selected === m.id ? "selected" : ""}`}>
            <input
              type="radio"
              name="payment"
              value={m.id}
              checked={selected === m.id}
              onChange={() => setSelected(m.id)}
            />
            <div className="payment-method-icon">{m.icon}</div>
            <div className="payment-method-info">
              <div className="payment-method-title">
                <h3>{m.name}</h3>
                <span className="payment-method-badge">{m.badge}</span>
              </div>
              <p>{m.desc}</p>
            </div>
            <div className="payment-method-radio" />
          </label>
        ))}

        {selected === "qris" && (
          <div className="payment-detail qris">
            <div className="qris-mock">
              <div className="qris-pattern">
                {Array.from({ length: 169 }).map((_, i) => (
                  <span key={i} style={{ background: Math.random() > 0.55 ? "#0f172a" : "transparent" }} />
                ))}
              </div>
              <div className="qris-corner tl" />
              <div className="qris-corner tr" />
              <div className="qris-corner bl" />
              <div className="qris-logo">🏠 Roomly</div>
            </div>
            <p className="muted">Scan QR di atas dengan aplikasi mobile banking atau e-wallet Anda</p>
          </div>
        )}

        {selected === "transfer" && (
          <div className="payment-detail transfer">
            <h4>Transfer ke salah satu rekening berikut:</h4>
            <div className="bank-list">
              <div className="bank-item">
                <strong>BCA</strong>
                <code>1234567890</code>
                <span>a.n. PT Roomly Indonesia</span>
              </div>
              <div className="bank-item">
                <strong>Mandiri</strong>
                <code>0987654321</code>
                <span>a.n. PT Roomly Indonesia</span>
              </div>
              <div className="bank-item">
                <strong>BRI</strong>
                <code>5544332211</code>
                <span>a.n. PT Roomly Indonesia</span>
              </div>
            </div>
          </div>
        )}

        {selected === "cod" && (
          <div className="payment-detail cod">
            <h4>💵 Bayar saat driver datang</h4>
            <p>Siapkan uang tunai sebesar <strong>{formatRupiah(booking.totalPrice)}</strong> ketika driver kami tiba di lokasi Anda.</p>
            <p className="muted">⚠️ Disarankan menyiapkan uang pas untuk mempermudah transaksi.</p>
          </div>
        )}
      </div>

      <button
        className="btn btn-primary btn-block btn-lg"
        onClick={handlePay}
        disabled={processing}
      >
        {processing ? "Memproses pembayaran..." : `Bayar ${formatRupiah(booking.totalPrice)}`}
      </button>

      <Link to="/my-bookings" className="payment-cancel">Bayar nanti, lihat pesanan saya →</Link>

      {showSuccess && paidBooking && (
        <SuccessModal
          booking={paidBooking}
          user={user}
          onContinue={handleContinue}
        />
      )}
    </div>
  );
}
