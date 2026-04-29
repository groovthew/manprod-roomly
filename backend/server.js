import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const STATUSES = ["Diterima", "Dikonfirmasi", "Diproses", "Selesai", "Dibatalkan"];

const laundryServices = [
  { id: "L1", name: "Cuci Kering", price: 7000, unit: "kg", duration: "1 hari", icon: "👕" },
  { id: "L2", name: "Cuci + Setrika", price: 10000, unit: "kg", duration: "2 hari", icon: "🧺" },
  { id: "L3", name: "Setrika Saja", price: 5000, unit: "kg", duration: "1 hari", icon: "🔥" },
  { id: "L4", name: "Express (6 jam)", price: 15000, unit: "kg", duration: "6 jam", icon: "⚡" },
  { id: "L5", name: "Dry Clean", price: 25000, unit: "pcs", duration: "3 hari", icon: "✨" }
];

const cleaningServices = [
  { id: "C1", name: "Cleaning Standar", price: 75000, unit: "sesi", duration: "2 jam", icon: "🧹" },
  { id: "C2", name: "Deep Cleaning", price: 200000, unit: "sesi", duration: "5 jam", icon: "🧽" },
  { id: "C3", name: "Cleaning Kamar Mandi", price: 50000, unit: "sesi", duration: "1 jam", icon: "🚿" },
  { id: "C4", name: "Cleaning Dapur", price: 80000, unit: "sesi", duration: "2 jam", icon: "🍳" },
  { id: "C5", name: "Cleaning Pasca Renovasi", price: 350000, unit: "sesi", duration: "8 jam", icon: "🔨" }
];

const users = [
  {
    id: "admin-001",
    username: "admin",
    password: "admin123",
    name: "Admin Roomly",
    phone: "0800000000",
    address: "Kantor Pusat Roomly",
    role: "admin",
    createdAt: new Date().toISOString()
  }
];

const sanitize = (user) => {
  if (!user) return user;
  const { password, ...safe } = user;
  return safe;
};

const laundryBookings = [];
const cleaningBookings = [];

const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
const findUserByUsername = (username) =>
  users.find((u) => u.username.toLowerCase() === String(username || "").toLowerCase());
const findUserById = (id) => users.find((u) => u.id === id);
const findBookingById = (id) =>
  laundryBookings.find((b) => b.id === id) || cleaningBookings.find((b) => b.id === id);

const initialTimeline = () => [
  { status: "Diterima", timestamp: new Date().toISOString(), note: "Pesanan masuk ke sistem" }
];

/* ====================
   Health
   ==================== */
app.get("/api/health", (_req, res) => res.json({ status: "ok", service: "Roomly API" }));

/* ====================
   Auth & Users
   ==================== */
app.post("/api/auth/register", (req, res) => {
  const { username, password, name, phone, address, role } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: "Username, password, dan nama wajib diisi" });
  }
  if (String(username).length < 3) return res.status(400).json({ error: "Username minimal 3 karakter" });
  if (String(password).length < 6) return res.status(400).json({ error: "Password minimal 6 karakter" });
  if (findUserByUsername(username)) return res.status(409).json({ error: "Username sudah dipakai" });

  const user = {
    id: generateId("USR"),
    username: String(username).toLowerCase(),
    password,
    name,
    phone: phone || "",
    address: address || "",
    role: role === "admin" ? "admin" : "user",
    createdAt: new Date().toISOString()
  };
  users.push(user);
  res.status(201).json(sanitize(user));
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username dan password wajib diisi" });
  const user = findUserByUsername(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "Username atau password salah" });
  }
  res.json(sanitize(user));
});

app.get("/api/users/:id", (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
  res.json(sanitize(user));
});

app.patch("/api/users/:id", (req, res) => {
  const user = findUserById(req.params.id);
  if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
  const { name, phone, address, password } = req.body;
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  if (password) {
    if (String(password).length < 6) return res.status(400).json({ error: "Password minimal 6 karakter" });
    user.password = password;
  }
  res.json(sanitize(user));
});

/* ====================
   Services
   ==================== */
app.get("/api/laundry/services", (_req, res) => res.json(laundryServices));
app.get("/api/cleaning/services", (_req, res) => res.json(cleaningServices));

/* ====================
   Bookings - Create
   ==================== */
app.post("/api/laundry/bookings", (req, res) => {
  const { userId, serviceId, quantity, pickupDate, notes } = req.body;
  const user = findUserById(userId);
  if (!user) return res.status(404).json({ error: "User tidak ditemukan, silakan login ulang" });
  if (!user.address) return res.status(400).json({ error: "Lengkapi alamat di profil terlebih dahulu" });
  if (!serviceId || !quantity || !pickupDate) return res.status(400).json({ error: "Semua field wajib diisi" });

  const service = laundryServices.find((s) => s.id === serviceId);
  if (!service) return res.status(404).json({ error: "Layanan tidak ditemukan" });

  const qty = Number(quantity);
  if (Number.isNaN(qty) || qty <= 0) return res.status(400).json({ error: "Jumlah harus lebih dari 0" });

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
    timeline: initialTimeline(),
    createdAt: new Date().toISOString()
  };
  laundryBookings.push(booking);
  res.status(201).json(booking);
});

app.post("/api/cleaning/bookings", (req, res) => {
  const { userId, serviceId, sessions, scheduleDate, scheduleTime, notes } = req.body;
  const user = findUserById(userId);
  if (!user) return res.status(404).json({ error: "User tidak ditemukan, silakan login ulang" });
  if (!user.address) return res.status(400).json({ error: "Lengkapi alamat di profil terlebih dahulu" });
  if (!serviceId || !sessions || !scheduleDate || !scheduleTime) {
    return res.status(400).json({ error: "Semua field wajib diisi" });
  }

  const service = cleaningServices.find((s) => s.id === serviceId);
  if (!service) return res.status(404).json({ error: "Layanan tidak ditemukan" });

  const qty = Number(sessions);
  if (Number.isNaN(qty) || qty <= 0) return res.status(400).json({ error: "Jumlah sesi harus lebih dari 0" });

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
    timeline: initialTimeline(),
    createdAt: new Date().toISOString()
  };
  cleaningBookings.push(booking);
  res.status(201).json(booking);
});

/* ====================
   Bookings - Read
   ==================== */
app.get("/api/bookings", (_req, res) => {
  const all = [...laundryBookings, ...cleaningBookings].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(all);
});

app.get("/api/bookings/user/:userId", (req, res) => {
  const all = [...laundryBookings, ...cleaningBookings]
    .filter((b) => b.userId === req.params.userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(all);
});

app.get("/api/bookings/:id", (req, res) => {
  const booking = findBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking tidak ditemukan" });
  res.json(booking);
});

/* ====================
   Bookings - Update Status (admin)
   ==================== */
app.patch("/api/bookings/:id/status", (req, res) => {
  const { status, note } = req.body;
  if (!STATUSES.includes(status)) return res.status(400).json({ error: "Status tidak valid" });

  const booking = findBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking tidak ditemukan" });

  if (booking.status === status) {
    return res.status(400).json({ error: `Pesanan sudah berstatus ${status}` });
  }

  booking.status = status;
  booking.timeline.push({
    status,
    timestamp: new Date().toISOString(),
    note: note || `Status diubah menjadi ${status}`
  });
  res.json(booking);
});

app.listen(PORT, () => {
  console.log(`🏠 Roomly API berjalan di http://localhost:${PORT}`);
  console.log(`👤 Admin default — username: admin / password: admin123`);
});
