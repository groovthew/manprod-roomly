import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

let mailer = null;
let mailerMode = "demo";

async function initMailer() {
  if (mailer) return mailer;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    mailer = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    mailerMode = "production";
    console.log(`📧 Email mode: PRODUCTION (${process.env.SMTP_HOST})`);
  } else {
    const testAccount = await nodemailer.createTestAccount();
    mailer = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: { user: testAccount.user, pass: testAccount.pass }
    });
    mailerMode = "demo";
    console.log(`📧 Email mode: DEMO (Ethereal — preview URL akan muncul setelah kirim email)`);
    console.log(`   Akun Ethereal: ${testAccount.user}`);
  }
  return mailer;
}

const STATUS_FLOW = {
  laundry: ["Diterima", "Dikonfirmasi", "Dijemput", "Diproses", "Diantar", "Selesai"],
  cleaning: ["Diterima", "Dikonfirmasi", "Diproses", "Selesai"]
};
const ALL_STATUSES = ["Diterima", "Dikonfirmasi", "Dijemput", "Diproses", "Diantar", "Selesai", "Dibatalkan"];

const isStatusAllowed = (type, status) =>
  status === "Dibatalkan" || (STATUS_FLOW[type] || []).includes(status);

const laundryServices = [
  {
    id: "L1", name: "Cuci Kering", price: 7000, unit: "kg", duration: "1 hari", icon: "👕",
    image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=300&fit=crop",
    description: "Pakaian dicuci bersih dan dikeringkan, siap dikenakan."
  },
  {
    id: "L2", name: "Cuci + Setrika", price: 10000, unit: "kg", duration: "2 hari", icon: "🧺",
    image: "https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=400&h=300&fit=crop",
    description: "Cuci bersih plus disetrika rapi dan dilipat."
  },
  {
    id: "L3", name: "Setrika Saja", price: 5000, unit: "kg", duration: "1 hari", icon: "🔥",
    image: "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?w=400&h=300&fit=crop",
    description: "Pakaian sudah bersih, kami setrika dan lipat rapi."
  },
  {
    id: "L4", name: "Express (6 jam)", price: 15000, unit: "kg", duration: "6 jam", icon: "⚡",
    image: "https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=400&h=300&fit=crop",
    description: "Cuci + setrika selesai dalam 6 jam. Cocok untuk kondisi darurat."
  },
  {
    id: "L5", name: "Dry Clean", price: 25000, unit: "pcs", duration: "3 hari", icon: "✨",
    image: "https://images.unsplash.com/photo-1469504512102-900f29606341?w=400&h=300&fit=crop",
    description: "Untuk pakaian khusus seperti jas, gaun, atau bahan halus."
  }
];

const cleaningServices = [
  {
    id: "C1", name: "Cleaning Standar", price: 75000, unit: "sesi", duration: "2 jam", icon: "🧹",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop",
    description: "Sapu, pel, lap permukaan, dan rapikan ruangan utama."
  },
  {
    id: "C2", name: "Deep Cleaning", price: 200000, unit: "sesi", duration: "5 jam", icon: "🧽",
    image: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&h=300&fit=crop",
    description: "Pembersihan mendalam termasuk noda membandel dan area sulit."
  },
  {
    id: "C3", name: "Cleaning Kamar Mandi", price: 50000, unit: "sesi", duration: "1 jam", icon: "🚿",
    image: "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=300&fit=crop",
    description: "Khusus kamar mandi: kerak, lumut, dan sanitasi menyeluruh."
  },
  {
    id: "C4", name: "Cleaning Dapur", price: 80000, unit: "sesi", duration: "2 jam", icon: "🍳",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    description: "Bersihkan kompor, sink, lemari, dan minyak yang menempel."
  },
  {
    id: "C5", name: "Cleaning Pasca Renovasi", price: 350000, unit: "sesi", duration: "8 jam", icon: "🔨",
    image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&h=300&fit=crop",
    description: "Bersihkan debu, sisa material, dan sanitasi pasca proyek."
  }
];

const users = [
  {
    id: "admin-001",
    username: "admin",
    password: "admin123",
    name: "Admin Roomly",
    email: "admin@roomly.id",
    phone: "0800000000",
    address: "Kantor Pusat Roomly",
    role: "admin",
    createdAt: new Date().toISOString()
  }
];

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());

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
  const { username, password, name, email, phone, address, role } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: "Username, password, dan nama wajib diisi" });
  }
  if (String(username).length < 3) return res.status(400).json({ error: "Username minimal 3 karakter" });
  if (String(password).length < 6) return res.status(400).json({ error: "Password minimal 6 karakter" });
  if (findUserByUsername(username)) return res.status(409).json({ error: "Username sudah dipakai" });
  if (email && !isValidEmail(email)) return res.status(400).json({ error: "Format email tidak valid" });

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
  const { name, email, phone, address, password } = req.body;
  if (email !== undefined) {
    if (email && !isValidEmail(email)) return res.status(400).json({ error: "Format email tidak valid" });
    user.email = email ? String(email).trim().toLowerCase() : "";
  }
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
    driver: null,
    paymentMethod: null,
    paymentStatus: "pending",
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
    paymentMethod: null,
    paymentStatus: "pending",
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
  if (!ALL_STATUSES.includes(status)) return res.status(400).json({ error: "Status tidak valid" });

  const booking = findBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking tidak ditemukan" });

  if (!isStatusAllowed(booking.type, status)) {
    return res.status(400).json({ error: `Status "${status}" tidak berlaku untuk layanan ${booking.type}` });
  }

  if (booking.status === status) {
    return res.status(400).json({ error: `Pesanan sudah berstatus ${status}` });
  }

  if ((status === "Dijemput" || status === "Diantar") && !booking.driver) {
    return res.status(400).json({ error: "Tetapkan driver dulu sebelum mengubah status pengantaran" });
  }

  let autoNote = note;
  if (!autoNote) {
    if (status === "Dijemput") autoNote = `Driver ${booking.driver.name} sedang menjemput pesanan`;
    else if (status === "Diantar") autoNote = `Driver ${booking.driver.name} sedang mengantar pesanan ke pelanggan`;
    else autoNote = `Status diubah menjadi ${status}`;
  }

  booking.status = status;
  booking.timeline.push({
    status,
    timestamp: new Date().toISOString(),
    note: autoNote
  });
  res.json(booking);
});

/* ====================
   Bookings - Assign Driver (laundry only, admin)
   ==================== */
app.patch("/api/bookings/:id/driver", (req, res) => {
  const { name, phone, vehicle } = req.body;
  const booking = findBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking tidak ditemukan" });
  if (booking.type !== "laundry") return res.status(400).json({ error: "Driver hanya untuk layanan laundry" });
  if (!name || !phone) return res.status(400).json({ error: "Nama dan nomor HP driver wajib diisi" });

  booking.driver = { name, phone, vehicle: vehicle || "" };
  booking.timeline.push({
    status: booking.status,
    timestamp: new Date().toISOString(),
    note: `Driver ditetapkan: ${name} (${phone})`
  });
  res.json(booking);
});

/* ====================
   Bookings - Payment
   ==================== */
app.patch("/api/bookings/:id/payment", (req, res) => {
  const { method } = req.body;
  const allowed = ["qris", "cod", "transfer"];
  if (!allowed.includes(method)) {
    return res.status(400).json({ error: "Metode pembayaran tidak valid" });
  }
  const booking = findBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking tidak ditemukan" });

  if (booking.paymentStatus === "paid") {
    return res.status(400).json({ error: "Pesanan ini sudah dibayar" });
  }

  booking.paymentMethod = method;
  booking.paymentStatus = method === "cod" ? "cod-pending" : "paid";
  booking.paidAt = new Date().toISOString();
  booking.invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;
  booking.receiptEmailedTo = null;
  booking.receiptEmailedAt = null;

  const labels = { qris: "QRIS", cod: "Cash on Delivery", transfer: "Transfer Bank" };
  const note = method === "cod"
    ? `Metode pembayaran: ${labels[method]} (bayar saat pesanan diantar)`
    : `Pembayaran via ${labels[method]} berhasil`;

  booking.timeline.push({
    status: booking.status,
    timestamp: new Date().toISOString(),
    note
  });

  res.json(booking);
});

/* ====================
   Email Receipt
   ==================== */
app.post("/api/bookings/:id/email-receipt", async (req, res) => {
  const { pdfBase64 } = req.body;
  if (!pdfBase64) return res.status(400).json({ error: "Data PDF tidak ditemukan" });

  const booking = findBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking tidak ditemukan" });

  const user = findUserById(booking.userId);
  if (!user || !user.email) {
    return res.status(400).json({ error: "Email belum terdaftar di profil. Tambahkan email dulu di halaman Profil." });
  }

  try {
    const t = await initMailer();
    const base64 = pdfBase64.replace(/^data:application\/pdf;base64,/, "");
    const pdfBuffer = Buffer.from(base64, "base64");
    const labels = { qris: "QRIS", cod: "Cash on Delivery", transfer: "Transfer Bank" };
    const isCod = booking.paymentMethod === "cod";
    const formattedTotal = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(booking.totalPrice);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 30px;">
        <div style="background: linear-gradient(135deg, #4f46e5, #06b6d4); color: white; padding: 32px; border-radius: 16px 16px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 28px;">🏠 Roomly</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">Laundry & Cleaning Service</p>
        </div>
        <div style="background: white; padding: 32px; border-radius: 0 0 16px 16px;">
          <h2 style="color: #0f172a; margin-top: 0;">Halo ${user.name}! 👋</h2>
          <p style="color: #475569; line-height: 1.6;">
            Terima kasih telah menggunakan Roomly. ${isCod
              ? "Pesanan Anda telah dikonfirmasi. Siapkan uang tunai saat driver kami tiba."
              : "Pembayaran Anda telah berhasil kami terima."}
          </p>
          <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; margin: 24px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="color: #64748b; padding: 6px 0;">Invoice</td>
                <td style="text-align: right; font-weight: 700; color: #0f172a;">${booking.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 6px 0;">Layanan</td>
                <td style="text-align: right; color: #0f172a;">${booking.service.name}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 6px 0;">Metode</td>
                <td style="text-align: right; color: #0f172a;">${labels[booking.paymentMethod]}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 6px 0;">Status</td>
                <td style="text-align: right;">
                  <span style="background: ${isCod ? "#fef3c7" : "#d1fae5"}; color: ${isCod ? "#92400e" : "#065f46"}; padding: 4px 12px; border-radius: 999px; font-weight: 700; font-size: 12px;">
                    ${isCod ? "MENUNGGU PEMBAYARAN" : "LUNAS"}
                  </span>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="border-top: 2px solid #e2e8f0; padding-top: 12px;"></td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 6px 0; font-size: 16px;">Total</td>
                <td style="text-align: right; font-weight: 800; color: #4f46e5; font-size: 20px;">${formattedTotal}</td>
              </tr>
            </table>
          </div>
          <p style="color: #475569; line-height: 1.6;">
            📎 Receipt resmi terlampir dalam format PDF.<br/>
            📍 Pantau status pesanan Anda di <strong>Roomly App</strong>.
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; text-align: center;">
            Email ini dibuat otomatis. Pertanyaan? Hubungi admin@roomly.id<br/>
            © 2026 Roomly Indonesia
          </p>
        </div>
      </div>
    `;

    const info = await t.sendMail({
      from: process.env.SMTP_FROM || `"Roomly" <noreply@roomly.id>`,
      to: user.email,
      subject: `Receipt Roomly — ${booking.invoiceNumber}`,
      text: `Halo ${user.name},\n\nTerima kasih telah menggunakan Roomly.\nInvoice: ${booking.invoiceNumber}\nTotal: ${formattedTotal}\nMetode: ${labels[booking.paymentMethod]}\n\nReceipt PDF terlampir di email ini.\n\n— Tim Roomly`,
      html,
      attachments: [{
        filename: `Roomly-Receipt-${booking.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf"
      }]
    });

    booking.receiptEmailedTo = user.email;
    booking.receiptEmailedAt = new Date().toISOString();
    booking.timeline.push({
      status: booking.status,
      timestamp: new Date().toISOString(),
      note: `Receipt PDF dikirim ke ${user.email}`
    });

    const previewUrl = mailerMode === "demo" ? nodemailer.getTestMessageUrl(info) : null;
    if (previewUrl) console.log(`📧 Preview email: ${previewUrl}`);

    res.json({
      success: true,
      mode: mailerMode,
      messageId: info.messageId,
      previewUrl,
      sentTo: user.email
    });
  } catch (err) {
    console.error("Email error:", err);
    res.status(500).json({ error: "Gagal mengirim email: " + err.message });
  }
});

/* ====================
   Chat Messages
   ==================== */
app.get("/api/bookings/:id/messages", (req, res) => {
  const booking = findBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking tidak ditemukan" });
  res.json(booking.messages || []);
});

app.post("/api/bookings/:id/messages", (req, res) => {
  const { senderId, senderName, senderRole, text, image } = req.body;
  if (!senderId || !senderName) return res.status(400).json({ error: "Pengirim wajib diisi" });
  if (!text && !image) return res.status(400).json({ error: "Pesan atau foto wajib diisi" });

  const booking = findBookingById(req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking tidak ditemukan" });

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
  res.status(201).json(message);
});

app.listen(PORT, async () => {
  console.log(`🏠 Roomly API berjalan di http://localhost:${PORT}`);
  console.log(`👤 Admin default — username: admin / password: admin123`);
  await initMailer();
});
