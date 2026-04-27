import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

const laundryBookings = [];
const cleaningBookings = [];

const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "Roomly API" });
});

app.get("/api/laundry/services", (_req, res) => {
  res.json(laundryServices);
});

app.get("/api/laundry/bookings", (_req, res) => {
  res.json(laundryBookings);
});

app.post("/api/laundry/bookings", (req, res) => {
  const { customerName, phone, address, serviceId, quantity, pickupDate, notes } = req.body;

  if (!customerName || !phone || !address || !serviceId || !quantity || !pickupDate) {
    return res.status(400).json({ error: "Semua field wajib diisi" });
  }

  const service = laundryServices.find((s) => s.id === serviceId);
  if (!service) {
    return res.status(404).json({ error: "Layanan tidak ditemukan" });
  }

  const qty = Number(quantity);
  if (Number.isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: "Jumlah harus lebih dari 0" });
  }

  const booking = {
    id: generateId("LDY"),
    type: "laundry",
    customerName,
    phone,
    address,
    service: { id: service.id, name: service.name, price: service.price, unit: service.unit },
    quantity: qty,
    pickupDate,
    notes: notes || "",
    totalPrice: service.price * qty,
    status: "Menunggu Konfirmasi",
    createdAt: new Date().toISOString()
  };

  laundryBookings.push(booking);
  res.status(201).json(booking);
});

app.get("/api/cleaning/services", (_req, res) => {
  res.json(cleaningServices);
});

app.get("/api/cleaning/bookings", (_req, res) => {
  res.json(cleaningBookings);
});

app.post("/api/cleaning/bookings", (req, res) => {
  const { customerName, phone, address, serviceId, sessions, scheduleDate, scheduleTime, notes } = req.body;

  if (!customerName || !phone || !address || !serviceId || !sessions || !scheduleDate || !scheduleTime) {
    return res.status(400).json({ error: "Semua field wajib diisi" });
  }

  const service = cleaningServices.find((s) => s.id === serviceId);
  if (!service) {
    return res.status(404).json({ error: "Layanan tidak ditemukan" });
  }

  const qty = Number(sessions);
  if (Number.isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: "Jumlah sesi harus lebih dari 0" });
  }

  const booking = {
    id: generateId("CLN"),
    type: "cleaning",
    customerName,
    phone,
    address,
    service: { id: service.id, name: service.name, price: service.price, unit: service.unit },
    sessions: qty,
    scheduleDate,
    scheduleTime,
    notes: notes || "",
    totalPrice: service.price * qty,
    status: "Menunggu Konfirmasi",
    createdAt: new Date().toISOString()
  };

  cleaningBookings.push(booking);
  res.status(201).json(booking);
});

app.get("/api/bookings", (_req, res) => {
  const all = [...laundryBookings, ...cleaningBookings].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(all);
});

app.patch("/api/bookings/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const allowed = ["Menunggu Konfirmasi", "Diproses", "Selesai", "Dibatalkan"];

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Status tidak valid" });
  }

  const booking =
    laundryBookings.find((b) => b.id === id) || cleaningBookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: "Booking tidak ditemukan" });
  }

  booking.status = status;
  res.json(booking);
});

app.listen(PORT, () => {
  console.log(`🏠 Roomly API berjalan di http://localhost:${PORT}`);
});
