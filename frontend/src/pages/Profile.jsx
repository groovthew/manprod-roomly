import { useState } from "react";
import { useAuth } from "../auth.jsx";

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const [form, setForm] = useState({
    name: user.name,
    email: user.email || "",
    phone: user.phone,
    address: user.address
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ password: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);
    try {
      await updateProfile(form);
      setSuccess(true);
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePwChange = (e) => setPwForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);
    if (pwForm.password !== pwForm.confirm) {
      setPwError("Konfirmasi password tidak cocok");
      return;
    }
    if (pwForm.password.length < 6) {
      setPwError("Password minimal 6 karakter");
      return;
    }
    setPwLoading(true);
    try {
      await updateProfile({ password: pwForm.password });
      setPwSuccess(true);
      setPwForm({ password: "", confirm: "" });
      setTimeout(() => setPwOpen(false), 1500);
    } catch (err) {
      setPwError(err.message);
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1>👤 Profil Saya</h1>
        <p>Identitas Anda akan otomatis dipakai saat memesan layanan.</p>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">{user.name.charAt(0).toUpperCase()}</div>
        <div className="profile-meta">
          <h2>{user.name}</h2>
          <p className="muted">@{user.username}{user.email ? ` · ${user.email}` : ""}</p>
          <span className={`role-badge ${user.role}`}>{user.role === "admin" ? "🛡️ Admin" : "👤 Pelanggan"}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <h2>Detail Identitas</h2>

        <label>
          Username (tidak dapat diubah)
          <input value={user.username} disabled />
        </label>

        <label>
          Nama Lengkap
          <input name="name" value={form.name} onChange={handleChange} disabled={!editing} required />
        </label>

        <label>
          Email <span className="muted" style={{ fontWeight: 400, fontSize: "0.8rem" }}>(untuk receipt otomatis)</span>
          <input name="email" type="email" value={form.email} onChange={handleChange} disabled={!editing} placeholder="nama@email.com" />
        </label>

        <label>
          Nomor HP / WhatsApp
          <input name="phone" type="tel" value={form.phone} onChange={handleChange} disabled={!editing} />
        </label>

        <label>
          Alamat
          <textarea name="address" value={form.address} onChange={handleChange} rows={3} disabled={!editing} placeholder="Alamat untuk penjemputan/kunjungan layanan" />
        </label>

        {error && <div className="alert error">⚠️ {error}</div>}
        {success && <div className="alert success">✅ Profil berhasil diperbarui</div>}

        <div className="profile-actions">
          {!editing ? (
            <button type="button" className="btn btn-primary" onClick={() => { setEditing(true); setSuccess(false); }}>
              ✏️ Edit Profil
            </button>
          ) : (
            <>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Menyimpan..." : "💾 Simpan"}
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEditing(false);
                  setForm({ name: user.name, email: user.email || "", phone: user.phone, address: user.address });
                  setError(null);
                }}
              >
                Batal
              </button>
            </>
          )}
          <button type="button" className="btn btn-danger" onClick={logout}>🚪 Logout</button>
        </div>
      </form>

      <div className="profile-form" style={{ marginTop: "1.5rem" }}>
        <div className="profile-form-toggle">
          <h2>🔒 Keamanan Akun</h2>
          <button type="button" className="link-btn" onClick={() => { setPwOpen((v) => !v); setPwError(null); setPwSuccess(false); }}>
            {pwOpen ? "Tutup" : "Ganti Password"}
          </button>
        </div>

        {pwOpen && (
          <form onSubmit={handlePwSubmit}>
            <label>
              Password Baru
              <input
                name="password"
                type="password"
                value={pwForm.password}
                onChange={handlePwChange}
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
                required
              />
            </label>
            <label>
              Konfirmasi Password
              <input
                name="confirm"
                type="password"
                value={pwForm.confirm}
                onChange={handlePwChange}
                placeholder="Ulangi password baru"
                autoComplete="new-password"
                required
              />
            </label>
            {pwError && <div className="alert error">⚠️ {pwError}</div>}
            {pwSuccess && <div className="alert success">✅ Password berhasil diganti</div>}
            <button type="submit" className="btn btn-primary" disabled={pwLoading}>
              {pwLoading ? "Menyimpan..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
