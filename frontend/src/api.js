const API_BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Terjadi kesalahan");
  return data;
}

export const api = {
  getLaundryServices: () => request("/laundry/services"),
  createLaundryBooking: (payload) =>
    request("/laundry/bookings", { method: "POST", body: JSON.stringify(payload) }),

  getCleaningServices: () => request("/cleaning/services"),
  createCleaningBooking: (payload) =>
    request("/cleaning/bookings", { method: "POST", body: JSON.stringify(payload) }),

  getAllBookings: () => request("/bookings"),
  updateStatus: (id, status) =>
    request(`/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) })
};

export const formatRupiah = (amount) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
