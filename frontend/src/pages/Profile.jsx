import { useState } from "react";
import { useAuth } from "../auth.jsx";

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone, address: user.address });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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
          <span className={`role-badge ${user.role}`}>{user.role === "admin" ? "🛡️ Admin" : "👤 Pelanggan"}</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="profile-form">
        <h2>Detail Identitas</h2>

        <label>
          Nama Lengkap
          <input name="name" value={form.name} onChange={handleChange} disabled={!editing} required />
        </label>

        <label>
          Nomor HP / WhatsApp
          <input name="phone" type="tel" value={form.phone} onChange={handleChange} disabled={!editing} required />
        </label>

        <label>
          Alamat
          <textarea name="address" value={form.address} onChange={handleChange} rows={3} disabled={!editing} placeholder="Alamat akan dipakai untuk penjemputan/kunjungan layanan" />
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
                onClick={() => { setEditing(false); setForm({ name: user.name, phone: user.phone, address: user.address }); setError(null); }}
              >
                Batal
              </button>
            </>
          )}
          <button type="button" className="btn btn-danger" onClick={logout}>🚪 Logout</button>
        </div>
      </form>
    </div>
  );
}
