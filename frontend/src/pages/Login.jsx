import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", phone: "", address: "", role: "user" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />;

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const u = mode === "login" ? await login(form.phone) : await register(form);
      navigate(u.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{mode === "login" ? "Masuk Akun" : "Daftar Akun Baru"}</h1>
        <p className="auth-subtitle">
          {mode === "login" ? "Masuk dengan nomor HP yang terdaftar." : "Buat akun untuk mulai pesan layanan."}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <label>
              Nama Lengkap
              <input name="name" value={form.name} onChange={handleChange} placeholder="Budi Santoso" required />
            </label>
          )}

          <label>
            Nomor HP / WhatsApp
            <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="08xxxxxxxxxx" required />
          </label>

          {mode === "register" && (
            <>
              <label>
                Alamat
                <textarea name="address" value={form.address} onChange={handleChange} rows={3} placeholder="Alamat lengkap" />
              </label>

              <label>
                Daftar sebagai
                <select name="role" value={form.role} onChange={handleChange}>
                  <option value="user">Pelanggan</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </>
          )}

          {error && <div className="alert error">⚠️ {error}</div>}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "login" ? "Belum punya akun? " : "Sudah punya akun? "}
          <button type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}>
            {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
          </button>
        </p>

        <div className="auth-hint">
          💡 Demo admin: phone <code>0800000000</code>
        </div>
      </div>
    </div>
  );
}
