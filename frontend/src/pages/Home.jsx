import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home">
      <section className="hero">
        <h1>Selamat Datang di <span className="brand">Roomly</span></h1>
        <p className="subtitle">
          Solusi praktis untuk laundry dan kebersihan rumah Anda. Pesan dalam satu klik, tenaga profesional siap datang.
        </p>
        <div className="hero-cta">
          {user ? (
            <>
              <Link to="/laundry" className="btn btn-primary">Pesan Laundry</Link>
              <Link to="/cleaning" className="btn btn-secondary">Pesan Cleaning</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary">Masuk / Daftar</Link>
              <Link to="/laundry" className="btn btn-secondary">Lihat Layanan</Link>
            </>
          )}
        </div>
      </section>

      <section className="services-grid">
        <Link to={user ? "/laundry" : "/login"} className="service-card laundry">
          <div className="service-icon">🧺</div>
          <h2>Booking Laundry Service</h2>
          <p>Cuci, setrika, dry clean & express service. Diambil dan diantar langsung ke rumah Anda.</p>
          <ul>
            <li>✓ Cuci Kering & Cuci+Setrika</li>
            <li>✓ Dry Clean Profesional</li>
            <li>✓ Express 6 jam tersedia</li>
          </ul>
          <span className="card-cta">Pesan Sekarang →</span>
        </Link>

        <Link to={user ? "/cleaning" : "/login"} className="service-card cleaning">
          <div className="service-icon">🧹</div>
          <h2>Booking Cleaning Service</h2>
          <p>Tim cleaning profesional untuk rumah, apartemen, kamar mandi, hingga pasca renovasi.</p>
          <ul>
            <li>✓ Standar & Deep Cleaning</li>
            <li>✓ Khusus Dapur & Kamar Mandi</li>
            <li>✓ Pasca Renovasi</li>
          </ul>
          <span className="card-cta">Pesan Sekarang →</span>
        </Link>
      </section>

      <section className="features">
        <h2 className="section-title">Mengapa Memilih Roomly?</h2>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon">⚡</div>
            <h3>Cepat & Praktis</h3>
            <p>Pemesanan online, jadwal fleksibel sesuai kebutuhan Anda.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">📍</div>
            <h3>Live Tracking</h3>
            <p>Pantau status pesanan dari diterima sampai selesai secara real-time.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">⭐</div>
            <h3>Tenaga Terlatih</h3>
            <p>Staf profesional, terverifikasi, dan menggunakan peralatan modern.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🛡️</div>
            <h3>Garansi Kepuasan</h3>
            <p>Tidak puas? Kami akan kerjakan ulang tanpa biaya tambahan.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
