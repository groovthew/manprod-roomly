import { useState, useEffect } from "react";
import { Routes, Route, Link, NavLink, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import LaundryBooking from "./pages/LaundryBooking.jsx";
import CleaningBooking from "./pages/CleaningBooking.jsx";
import Bookings from "./pages/Bookings.jsx";

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <div className="app">
      <header className="navbar">
        <Link to="/" className="logo">
          <span className="logo-icon">🏠</span>
          <span>Roomly</span>
        </Link>

        <nav className="nav-links">
          <NavLink to="/" end>Beranda</NavLink>
          <NavLink to="/laundry">Laundry</NavLink>
          <NavLink to="/cleaning">Cleaning</NavLink>
          <NavLink to="/bookings">Pesanan</NavLink>
        </nav>

        <button
          className={`hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </header>

      {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} />}

      <nav className={`mobile-nav ${menuOpen ? "open" : ""}`}>
        <NavLink to="/" end>🏠 Beranda</NavLink>
        <NavLink to="/laundry">🧺 Laundry</NavLink>
        <NavLink to="/cleaning">🧹 Cleaning</NavLink>
        <NavLink to="/bookings">📋 Pesanan</NavLink>
      </nav>

      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/laundry" element={<LaundryBooking />} />
          <Route path="/cleaning" element={<CleaningBooking />} />
          <Route path="/bookings" element={<Bookings />} />
        </Routes>
      </main>

      <footer className="footer">
        <p>© 2026 Roomly — Solusi Laundry &amp; Cleaning untuk Rumah Anda</p>
      </footer>
    </div>
  );
}
