import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Home() {
  const { user } = useAuth();
  const primaryTo = user ? "/laundry" : "/login";
  const secondaryTo = user ? "/cleaning" : "/laundry";

  return (
    <div className="home">
      <section className="hero-modern">
        <div className="hero-content">
          <span className="hero-badge">⭐ No.1 Laundry & Cleaning di Indonesia</span>
          <h1>
            Solusi <span className="hero-accent">Bersih</span> &
            <span className="hero-accent">  Praktis </span> untuk Rumahmu
          </h1>
          <p className="hero-subtitle">
            Pesan laundry & cleaning dalam satu klik. Driver profesional, harga transparan,
            dan tracking real-time sampai pesananmu selesai.
          </p>
          <div className="hero-cta">
            <Link to={primaryTo} className="btn btn-primary btn-lg">Pesan Sekarang →</Link>
            <Link to={secondaryTo} className="btn-ghost-modern">Lihat Layanan</Link>
          </div>
          <div className="hero-stats">
            <div><strong>10K+</strong><span>Pelanggan</span></div>
            <div className="divider" />
            <div><strong>50+</strong><span>Outlet</span></div>
            <div className="divider" />
            <div><strong>4.9⭐</strong><span>Rating</span></div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-blob" />
          <div className="hero-blob blob-2" />

          <svg className="hero-illustration" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a5f3fc" />
                <stop offset="100%" stopColor="#67e8f9" />
              </linearGradient>
              <linearGradient id="machine-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#e0f7fa" />
              </linearGradient>
              <linearGradient id="drum-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#0891b2" />
              </linearGradient>
            </defs>

            <ellipse cx="100" cy="380" rx="70" ry="110" fill="#86efac" opacity="0.6" transform="rotate(-25 100 380)" />
            <ellipse cx="430" cy="350" rx="60" ry="130" fill="#a7f3d0" opacity="0.55" transform="rotate(18 430 350)" />
            <ellipse cx="60" cy="280" rx="40" ry="60" fill="#fcd34d" opacity="0.45" transform="rotate(-15 60 280)" />

            <ellipse cx="250" cy="450" rx="180" ry="20" fill="#0e7490" opacity="0.1" />

            <g className="machine-group">
              <rect x="160" y="160" width="220" height="270" rx="28" fill="url(#machine-grad)" stroke="#0891b2" strokeWidth="3" />
              <rect x="180" y="180" width="180" height="42" rx="10" fill="#cffafe" />
              <circle cx="200" cy="201" r="6" fill="#10b981" />
              <circle cx="222" cy="201" r="6" fill="#f59e0b" />
              <rect x="248" y="195" width="100" height="12" rx="3" fill="#0891b2" opacity="0.35" />

              <circle cx="270" cy="320" r="85" fill="#cffafe" stroke="#0891b2" strokeWidth="3" />
              <circle cx="270" cy="320" r="68" fill="#f0fdff" stroke="#a5f3fc" strokeWidth="2" />

              <g className="drum-spin">
                <path d="M225 320 Q250 285 285 305 Q315 325 300 360 Q275 380 240 365 Q215 345 225 320 Z" fill="url(#drum-grad)" opacity="0.65" />
                <path d="M250 330 Q270 315 295 330 Q305 350 285 363 Q260 358 250 330 Z" fill="#22d3ee" opacity="0.5" />
                <circle cx="245" cy="310" r="4" fill="#ffffff" />
                <circle cx="298" cy="320" r="3" fill="#ffffff" />
                <circle cx="287" cy="350" r="5" fill="#ffffff" />
                <circle cx="258" cy="345" r="3" fill="#ffffff" />
              </g>
            </g>

            <g className="bubble-1"><circle cx="120" cy="200" r="10" fill="#cffafe" /><circle cx="115" cy="195" r="3" fill="#ffffff" /></g>
            <g className="bubble-2"><circle cx="420" cy="240" r="14" fill="#a5f3fc" opacity="0.85" /><circle cx="415" cy="234" r="4" fill="#ffffff" /></g>
            <g className="bubble-3"><circle cx="100" cy="320" r="8" fill="#67e8f9" opacity="0.85" /><circle cx="97" cy="316" r="2.5" fill="#ffffff" /></g>
            <g className="bubble-4"><circle cx="430" cy="160" r="7" fill="#67e8f9" opacity="0.7" /></g>
            <g className="bubble-5"><circle cx="80" cy="140" r="5" fill="#a5f3fc" opacity="0.7" /></g>

            <text x="380" y="120" fontSize="36" fill="#7c3aed" opacity="0.7" className="note-1">♪</text>
            <text x="90" y="100" fontSize="28" fill="#7c3aed" opacity="0.6" className="note-2">♫</text>
            <text x="440" y="190" fontSize="22" fill="#7c3aed" opacity="0.7" className="note-3">♪</text>

            <text x="60" y="220" fontSize="26" opacity="0.6" className="sparkle-1">✨</text>
            <text x="430" y="430" fontSize="22" opacity="0.6" className="sparkle-2">✨</text>
          </svg>

          <div className="floating-card card-1">
            <div className="floating-icon teal">🚚</div>
            <div>
              <strong>Pickup 30 Menit</strong>
              <span>Driver siap menjemput</span>
            </div>
          </div>

          <div className="floating-card card-2">
            <div className="floating-icon orange">💰</div>
            <div>
              <strong>Mulai Rp 5.000</strong>
              <span>Harga transparan</span>
            </div>
          </div>

          <div className="floating-card card-3">
            <div className="floating-icon purple">⚡</div>
            <div>
              <strong>Express 6 Jam</strong>
              <span>Selesai super cepat</span>
            </div>
          </div>
        </div>
      </section>

      <section className="services-grid">
        <Link to={user ? "/laundry" : "/login"} className="service-card laundry">
          <div className="service-icon">🧺</div>
          <h2>Booking Laundry Service</h2>
          <p>Cuci, setrika, dry clean & express. Diambil dan diantar driver kami.</p>
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
          <p>Tim cleaning profesional untuk rumah, apartemen, dan area khusus.</p>
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
            <p>Pantau status dari diterima sampai selesai secara real-time.</p>
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
