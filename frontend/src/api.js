const API_BASE = import.meta.env.VITE_API_URL || "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.error || `Request gagal (${res.status})`);
  return data;
}

export const api = {
  register: (payload) => request("/auth/register", { method: "POST", body: JSON.stringify(payload) }),
  login: (username, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  getUser: (id) => request(`/users/${id}`),
  updateUser: (id, payload) => request(`/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),

  getLaundryServices: () => request("/laundry/services"),
  createLaundryBooking: (payload) =>
    request("/laundry/bookings", { method: "POST", body: JSON.stringify(payload) }),

  getCleaningServices: () => request("/cleaning/services"),
  createCleaningBooking: (payload) =>
    request("/cleaning/bookings", { method: "POST", body: JSON.stringify(payload) }),

  getAllBookings: () => request("/bookings"),
  getUserBookings: (userId) => request(`/bookings/user/${userId}`),
  getBooking: (id) => request(`/bookings/${id}`),
  updateStatus: (id, status, note) =>
    request(`/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, note }) }),
  assignDriver: (id, driver) =>
    request(`/bookings/${id}/driver`, { method: "PATCH", body: JSON.stringify(driver) }),
  setPayment: (id, method) =>
    request(`/bookings/${id}/payment`, { method: "PATCH", body: JSON.stringify({ method }) }),
  emailReceipt: (id, pdfBase64) =>
    request(`/bookings/${id}/email-receipt`, { method: "POST", body: JSON.stringify({ pdfBase64 }) })
};

export const formatRupiah = (amount) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
