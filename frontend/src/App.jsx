import { useState, useEffect } from "react";
import { Routes, Route, Link, NavLink, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth.jsx";
import Home from "./pages/Home.jsx";
import LaundryBooking from "./pages/LaundryBooking.jsx";
import CleaningBooking from "./pages/CleaningBooking.jsx";
import MyBookings from "./pages/MyBookings.jsx";
import Tracking from "./pages/Tracking.jsx";
import Payment from "./pages/Payment.jsx";
import Login from "./pages/Login.jsx";
import Profile from "./pages/Profile.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import FloatingChat from "./components/FloatingChat.jsx";
import OrderNotifications from "./components/OrderNotifications.jsx";

function RequireAuth({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="empty">Memuat...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

function Shell() {
  const { user, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => { setMenuOpen(false); }, [location]);
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const isAdmin = user?.role === "admin";

  const navLinks = (
    <>
      <NavLink to="/" end>Beranda</NavLink>
      {!isAdmin && <NavLink to="/laundry">Laundry</NavLink>}
      {!isAdmin && <NavLink to="/cleaning">Cleaning</NavLink>}
      {user && !isAdmin && <NavLink to="/my-bookings">Pesanan Saya</NavLink>}
      {isAdmin && <NavLink to="/admin" end>Admin</NavLink>}
    </>
  );

  return (
    <div className="app">
      <header className="navbar">
        <Link to="/" className="logo">
          <span className="logo-icon">🏠</span>
          <span>Roomly</span>
        </Link>

        <nav className="nav-links">{navLinks}</nav>

        <div className="nav-right">
          {user ? (
            <Link to="/profile" className="profile-chip" title="Buka profil">
              <span className="profile-chip-avatar">{user.name.charAt(0).toUpperCase()}</span>
              <span className="profile-chip-name">{user.name}</span>
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Masuk</Link>
          )}
          <button
            className={`hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {menuOpen && <div className="nav-overlay" onClick={() => setMenuOpen(false)} />}

      <nav className={`mobile-nav ${menuOpen ? "open" : ""}`}>
        <NavLink to="/" end>🏠 Beranda</NavLink>
        {!isAdmin && <NavLink to="/laundry">🧺 Laundry</NavLink>}
        {!isAdmin && <NavLink to="/cleaning">🧹 Cleaning</NavLink>}
        {user && !isAdmin && <NavLink to="/my-bookings">📋 Pesanan Saya</NavLink>}
        {isAdmin && <NavLink to="/admin" end>🛡️ Admin</NavLink>}
        {user && <NavLink to="/profile">👤 Profil</NavLink>}
        {!user && <NavLink to="/login">🔐 Masuk / Daftar</NavLink>}
        {user && <button className="mobile-logout" onClick={logout}>🚪 Logout</button>}
      </nav>

      <main className="main">
        {loading ? (
          <div className="empty">Memuat...</div>
        ) : (
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/laundry" element={<RequireAuth><LaundryBooking /></RequireAuth>} />
            <Route path="/cleaning" element={<RequireAuth><CleaningBooking /></RequireAuth>} />
            <Route path="/my-bookings" element={<RequireAuth><MyBookings /></RequireAuth>} />
            <Route path="/tracking/:id" element={<RequireAuth><Tracking /></RequireAuth>} />
            <Route path="/payment/:id" element={<RequireAuth><Payment /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
            <Route path="/admin" element={<RequireAuth role="admin"><AdminDashboard /></RequireAuth>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>

      <footer className="footer">
        <p>© 2026 Roomly — Solusi Laundry &amp; Cleaning untuk Rumah Anda</p>
      </footer>

      <FloatingChat />
      <OrderNotifications />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
