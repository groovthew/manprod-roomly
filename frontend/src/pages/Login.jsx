import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

const initialForm = {
  username: "",
  password: "",
  name: "",
  email: "",
  phone: "",
  address: "",
  role: "user"
};

export default function Login() {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to={user.role === "admin" ? "/admin" : "/"} replace />;

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const u = mode === "login"
        ? await login(form.username, form.password)
        : await register(form);
      navigate(u.role === "admin" ? "/admin" : "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError(null);
    setForm(initialForm);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>{mode === "login" ? "Masuk Akun" : "Daftar Akun Baru"}</h1>
        <p className="auth-subtitle">
          {mode === "login"
            ? "Masuk dengan username dan password Anda."
            : "Buat akun untuk mulai pesan layanan Roomly."}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Username
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="contoh: budi123"
              autoComplete="username"
              required
            />
          </label>

          <label>
            Password
            <div className="password-wrapper">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange}
                placeholder={mode === "register" ? "Minimal 6 karakter" : "Masukkan password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </label>

          {mode === "register" && (
            <>
              <label>
                Nama Lengkap
                <input name="name" value={form.name} onChange={handleChange} placeholder="Budi Santoso" required />
              </label>

              <label>
                Email
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="nama@email.com (untuk receipt otomatis)"
                />
              </label>

              <label>
                Nomor HP / WhatsApp
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="08xxxxxxxxxx" />
              </label>

              <label>
                Alamat
                <textarea name="address" value={form.address} onChange={handleChange} rows={3} placeholder="Alamat lengkap (bisa diisi nanti di profil)" />
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
          <button type="button" onClick={switchMode}>
            {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
          </button>
        </p>
      </div>
    </div>
  );
}
