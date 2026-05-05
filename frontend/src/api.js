/* =====================================================
   Roomly API — Offline / localStorage mode
   Tidak butuh backend. Semua data disimpan di browser.
   Catatan: data per-device (tidak sync antar browser).
   ===================================================== */

const STORAGE = {
  users: "roomly:users",
  laundry: "roomly:laundryBookings",
  cleaning: "roomly:cleaningBookings"
};

const LAUNDRY_SERVICES = [
  { id: "L1", name: "Cuci Kering", price: 7000, unit: "kg", duration: "1 hari", icon: "👕",
    image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=300&fit=crop",
    description: "Pakaian dicuci bersih dan dikeringkan, siap dikenakan." },
  { id: "L2", name: "Cuci + Setrika", price: 10000, unit: "kg", duration: "2 hari", icon: "🧺",
    image: "https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=400&h=300&fit=crop",
    description: "Cuci bersih plus disetrika rapi dan dilipat." },
  { id: "L3", name: "Setrika Saja", price: 5000, unit: "kg", duration: "1 hari", icon: "🔥",
    image: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400&h=300&fit=crop",
    description: "Pakaian sudah bersih, kami setrika dan lipat rapi." },
  { id: "L4", name: "Express (6 jam)", price: 15000, unit: "kg", duration: "6 jam", icon: "⚡",
    image: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400&h=300&fit=crop",
    description: "Cuci + setrika selesai dalam 6 jam. Cocok untuk kondisi darurat." },
  { id: "L5", name: "Dry Clean", price: 25000, unit: "pcs", duration: "3 hari", icon: "✨",
    image: "https://images.unsplash.com/photo-1469504512102-900f29606341?w=400&h=300&fit=crop",
    description: "Untuk pakaian khusus seperti jas, gaun, atau bahan halus." }
];

const CLEANING_SERVICES = [
  { id: "C1", name: "Cleaning Standar", price: 75000, unit: "sesi", duration: "2 jam", icon: "🧹",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop",
    description: "Sapu, pel, lap permukaan, dan rapikan ruangan utama." },
  { id: "C2", name: "Deep Cleaning", price: 200000, unit: "sesi", duration: "5 jam", icon: "🧽",
    image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&h=300&fit=crop",
    description: "Pembersihan mendalam termasuk noda membandel dan area sulit." },
  { id: "C3", name: "Cleaning Kamar Mandi", price: 50000, unit: "sesi", duration: "1 jam", icon: "🚿",
    image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop",
    description: "Khusus kamar mandi: kerak, lumut, dan sanitasi menyeluruh." },
  { id: "C4", name: "Cleaning Dapur", price: 80000, unit: "sesi", duration: "2 jam", icon: "🍳",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    description: "Bersihkan kompor, sink, lemari, dan minyak yang menempel." },
  { id: "C5", name: "Cleaning Pasca Renovasi", price: 350000, unit: "sesi", duration: "8 jam", icon: "🔨",
    image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&h=300&fit=crop",
    description: "Bersihkan debu, sisa material, dan sanitasi pasca proyek." }
];

const SEED_ADMIN = {
  id: "admin-001",
  username: "admin",
  password: "admin123",
  name: "Admin Roomly",
  email: "admin@roomly.id",
  phone: "0800000000",
  address: "Kantor Pusat Roomly",
  role: "admin",
  createdAt: new Date().toISOString()
};

const STATUS_FLOW = {
  laundry: ["Diterima", "Dikonfirmasi", "Dijemput", "Diproses", "Diantar", "Selesai"],
  cleaning: ["Diterima", "Dikonfirmasi", "Diproses", "Selesai"]
};
const ALL_STATUSES = ["Diterima", "Dikonfirmasi", "Dijemput", "Diproses", "Diantar", "Selesai", "Dibatalkan"];

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));

const read = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};
const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));

const getUsers = () => {
  let users = read(STORAGE.users, null);
  if (!users || !users.find((u) => u.username === "admin")) {
    users = users ? [SEED_ADMIN, ...users.filter((u) => u.username !== "admin")] : [SEED_ADMIN];
    write(STORAGE.users, users);
  }
  return users;
};

const sanitize = (user) => {
  if (!user) return user;
  const { password, ...safe } = user;
  return safe;
};

const initialTimeline = () => [
  { status: "Diterima", timestamp: new Date().toISOString(), note: "Pesanan masuk ke sistem" }
];

const findBookingById = (id) => {
  const all = [...read(STORAGE.laundry, []), ...read(STORAGE.cleaning, [])];
  return all.find((b) => b.id === id);
};

const saveBooking = (booking) => {
  const key = booking.type === "laundry" ? STORAGE.laundry : STORAGE.cleaning;
  const all = read(key, []);
  const idx = all.findIndex((b) => b.id === booking.id);
  if (idx >= 0) all[idx] = booking;
  else all.push(booking);
  write(key, all);
};

const ok = async (data) => {
  await wait();
  return data;
};
const fail = (msg) => Promise.reject(new Error(msg));

export const api = {
  /* ---------- Auth ---------- */
  register: async ({ username, password, name, email, phone, address, role }) => {
    if (!username || !password || !name) return fail("Username, password, dan nama wajib diisi");
    if (String(username).length < 3) return fail("Username minimal 3 karakter");
    if (String(password).length < 6) return fail("Password minimal 6 karakter");
    if (email && !isValidEmail(email)) return fail("Format email tidak valid");

    const users = getUsers();
    if (users.find((u) => u.username.toLowerCase() === String(username).toLowerCase())) {
      return fail("Username sudah dipakai");
    }

    const user = {
      id: generateId("USR"),
      username: String(username).toLowerCase(),
      password,
      name,
      email: email ? String(email).trim().toLowerCase() : "",
      phone: phone || "",
      address: address || "",
      role: role === "admin" ? "admin" : "user",
      createdAt: new Date().toISOString()
    };
    users.push(user);
    write(STORAGE.users, users);
    return ok(sanitize(user));
  },

  login: async (username, password) => {
    if (!username || !password) return fail("Username dan password wajib diisi");
    const users = getUsers();
    const user = users.find((u) => u.username.toLowerCase() === String(username).toLowerCase());
    if (!user || user.password !== password) return fail("Username atau password salah");
    return ok(sanitize(user));
  },

  getUser: async (id) => {
    const users = getUsers();
    const user = users.find((u) => u.id === id);
    if (!user) return fail("User tidak ditemukan");
    return ok(sanitize(user));
  },

  updateUser: async (id, payload) => {
    const users = getUsers();
    const user = users.find((u) => u.id === id);
    if (!user) return fail("User tidak ditemukan");
    const { name, email, phone, address, password } = payload;
    if (email !== undefined) {
      if (email && !isValidEmail(email)) return fail("Format email tidak valid");
      user.email = email ? String(email).trim().toLowerCase() : "";
    }
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (password) {
      if (String(password).length < 6) return fail("Password minimal 6 karakter");
      user.password = password;
    }
    write(STORAGE.users, users);
    return ok(sanitize(user));
  },

  /* ---------- Services ---------- */
  getLaundryServices: async () => ok(LAUNDRY_SERVICES),
  getCleaningServices: async () => ok(CLEANING_SERVICES),

  /* ---------- Bookings ---------- */
  createLaundryBooking: async ({ userId, serviceId, quantity, pickupDate, notes }) => {
    const users = getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return fail("User tidak ditemukan, silakan login ulang");
    if (!user.address) return fail("Lengkapi alamat di profil terlebih dahulu");
    if (!serviceId || !quantity || !pickupDate) return fail("Semua field wajib diisi");

    const service = LAUNDRY_SERVICES.find((s) => s.id === serviceId);
    if (!service) return fail("Layanan tidak ditemukan");

    const qty = Number(quantity);
    if (Number.isNaN(qty) || qty <= 0) return fail("Jumlah harus lebih dari 0");

    const booking = {
      id: generateId("LDY"),
      type: "laundry",
      userId,
      customerName: user.name,
      phone: user.phone,
      address: user.address,
      service: { id: service.id, name: service.name, price: service.price, unit: service.unit, icon: service.icon },
      quantity: qty,
      pickupDate,
      notes: notes || "",
      totalPrice: service.price * qty,
      status: "Diterima",
      driver: null,
      paymentMethod: null,
      paymentStatus: "pending",
      timeline: initialTimeline(),
      messages: [],
      createdAt: new Date().toISOString()
    };
    saveBooking(booking);
    return ok(booking);
  },

  createCleaningBooking: async ({ userId, serviceId, sessions, scheduleDate, scheduleTime, notes }) => {
    const users = getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return fail("User tidak ditemukan, silakan login ulang");
    if (!user.address) return fail("Lengkapi alamat di profil terlebih dahulu");
    if (!serviceId || !sessions || !scheduleDate || !scheduleTime) return fail("Semua field wajib diisi");

    const service = CLEANING_SERVICES.find((s) => s.id === serviceId);
    if (!service) return fail("Layanan tidak ditemukan");

    const qty = Number(sessions);
    if (Number.isNaN(qty) || qty <= 0) return fail("Jumlah sesi harus lebih dari 0");

    const booking = {
      id: generateId("CLN"),
      type: "cleaning",
      userId,
      customerName: user.name,
      phone: user.phone,
      address: user.address,
      service: { id: service.id, name: service.name, price: service.price, unit: service.unit, icon: service.icon },
      sessions: qty,
      scheduleDate,
      scheduleTime,
      notes: notes || "",
      totalPrice: service.price * qty,
      status: "Diterima",
      paymentMethod: null,
      paymentStatus: "pending",
      timeline: initialTimeline(),
      messages: [],
      createdAt: new Date().toISOString()
    };
    saveBooking(booking);
    return ok(booking);
  },

  getAllBookings: async () => {
    const all = [...read(STORAGE.laundry, []), ...read(STORAGE.cleaning, [])].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    return ok(all);
  },

  getUserBookings: async (userId) => {
    const all = [...read(STORAGE.laundry, []), ...read(STORAGE.cleaning, [])]
      .filter((b) => b.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return ok(all);
  },

  getBooking: async (id) => {
    const booking = findBookingById(id);
    if (!booking) return fail("Booking tidak ditemukan");
    return ok(booking);
  },

  updateStatus: async (id, status, note) => {
    if (!ALL_STATUSES.includes(status)) return fail("Status tidak valid");
    const booking = findBookingById(id);
    if (!booking) return fail("Booking tidak ditemukan");

    const allowed = status === "Dibatalkan" || (STATUS_FLOW[booking.type] || []).includes(status);
    if (!allowed) return fail(`Status "${status}" tidak berlaku untuk layanan ${booking.type}`);
    if (booking.status === status) return fail(`Pesanan sudah berstatus ${status}`);
    if ((status === "Dijemput" || status === "Diantar") && !booking.driver) {
      return fail("Tetapkan driver dulu sebelum mengubah status pengantaran");
    }

    let autoNote = note;
    if (!autoNote) {
      if (status === "Dijemput") autoNote = `Driver ${booking.driver.name} sedang menjemput pesanan`;
      else if (status === "Diantar") autoNote = `Driver ${booking.driver.name} sedang mengantar pesanan ke pelanggan`;
      else autoNote = `Status diubah menjadi ${status}`;
    }

    booking.status = status;
    booking.timeline.push({ status, timestamp: new Date().toISOString(), note: autoNote });
    saveBooking(booking);
    return ok(booking);
  },

  assignDriver: async (id, { name, phone, vehicle }) => {
    const booking = findBookingById(id);
    if (!booking) return fail("Booking tidak ditemukan");
    if (booking.type !== "laundry") return fail("Driver hanya untuk layanan laundry");
    if (!name || !phone) return fail("Nama dan nomor HP driver wajib diisi");

    booking.driver = { name, phone, vehicle: vehicle || "" };
    booking.timeline.push({
      status: booking.status,
      timestamp: new Date().toISOString(),
      note: `Driver ditetapkan: ${name} (${phone})`
    });
    saveBooking(booking);
    return ok(booking);
  },

  setPayment: async (id, method) => {
    const allowed = ["qris", "cod", "transfer"];
    if (!allowed.includes(method)) return fail("Metode pembayaran tidak valid");
    const booking = findBookingById(id);
    if (!booking) return fail("Booking tidak ditemukan");
    if (booking.paymentStatus === "paid") return fail("Pesanan ini sudah dibayar");

    booking.paymentMethod = method;
    booking.paymentStatus = method === "cod" ? "cod-pending" : "paid";
    booking.paidAt = new Date().toISOString();
    booking.invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;

    const labels = { qris: "QRIS", cod: "Cash on Delivery", transfer: "Transfer Bank" };
    const note = method === "cod"
      ? `Metode pembayaran: ${labels[method]} (bayar saat pesanan diantar)`
      : `Pembayaran via ${labels[method]} berhasil`;

    booking.timeline.push({ status: booking.status, timestamp: new Date().toISOString(), note });
    saveBooking(booking);
    return ok(booking);
  },

  emailReceipt: async (id) => {
    const booking = findBookingById(id);
    if (!booking) return fail("Booking tidak ditemukan");
    booking.receiptEmailedAt = new Date().toISOString();
    saveBooking(booking);
    return ok({
      success: true,
      mode: "offline",
      sentTo: null,
      previewUrl: null,
      note: "Mode offline: receipt PDF sudah otomatis di-download. Email tidak dikirim."
    });
  },

  /* ---------- Chat ---------- */
  getMessages: async (bookingId) => {
    const booking = findBookingById(bookingId);
    if (!booking) return fail("Booking tidak ditemukan");
    return ok(booking.messages || []);
  },

  sendMessage: async (bookingId, { senderId, senderName, senderRole, text, image }) => {
    if (!senderId || !senderName) return fail("Pengirim wajib diisi");
    if (!text && !image) return fail("Pesan atau foto wajib diisi");
    const booking = findBookingById(bookingId);
    if (!booking) return fail("Booking tidak ditemukan");
    if (!booking.messages) booking.messages = [];

    const message = {
      id: generateId("MSG"),
      senderId,
      senderName,
      senderRole: senderRole || "user",
      text: text || "",
      image: image || null,
      createdAt: new Date().toISOString()
    };
    booking.messages.push(message);
    saveBooking(booking);
    return ok(message);
  }
};

export const formatRupiah = (amount) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
