/* =====================================================
   RoomlyBot — Smart local conversational assistant
   Rule-based + state machine. Runs 100% in browser.
   Capabilities:
   - Jawab FAQ (harga, jam, layanan, pembayaran, area, cara kerja)
   - Pandu booking laundry/cleaning step-by-step lewat chat
   - Cek status pesanan
   - Rekomendasi layanan
   ===================================================== */

import { formatRupiah } from "../api.js";

export const QUICK_MENU = [
  { label: "🧺 Pesan Laundry", value: "pesan laundry" },
  { label: "🧹 Pesan Cleaning", value: "pesan cleaning" },
  { label: "💰 Lihat Harga", value: "harga" },
  { label: "📦 Cek Pesanan", value: "cek pesanan" },
  { label: "❓ Bantuan", value: "bantuan" }
];

const TIME_SLOTS = ["08:00", "10:00", "13:00", "15:00", "17:00"];

export function createInitialState() {
  return { flow: null, type: null, step: null, draft: {} };
}

const bot = (text, quickReplies) => ({ text, quickReplies: quickReplies || null });

const norm = (s) => String(s || "").toLowerCase().trim();
const has = (t, ...words) => words.some((w) => t.includes(w));

const todayStr = () => new Date().toISOString().split("T")[0];

function parseDate(text) {
  const t = norm(text);
  const today = new Date();
  const fmt = (d) => d.toISOString().split("T")[0];
  if (has(t, "hari ini", "today", "sekarang", "skrg")) return fmt(today);
  if (has(t, "besok", "tomorrow", "bsk", "esok")) {
    const d = new Date(today); d.setDate(d.getDate() + 1); return fmt(d);
  }
  if (has(t, "lusa")) {
    const d = new Date(today); d.setDate(d.getDate() + 2); return fmt(d);
  }
  const iso = t.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, y, m, d] = iso;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  const dmy = t.match(/(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})/);
  if (dmy) {
    let [, d, m, y] = dmy;
    if (y.length === 2) y = "20" + y;
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return null;
}

function parseNumber(text) {
  const m = norm(text).replace(",", ".").match(/[\d.]+/);
  return m ? parseFloat(m[0]) : NaN;
}

function parseTime(text) {
  const t = norm(text);
  for (const slot of TIME_SLOTS) {
    const hour = slot.split(":")[0];
    if (t.includes(slot) || t.includes(hour + ":") || t.includes(hour + ".") ||
        t === hour || t.includes(hour + " ") || t.includes("jam " + hour) || t.includes("pukul " + hour)) {
      return slot;
    }
  }
  return null;
}

/* ---------- FAQ / info responders ---------- */
async function pricingMessage(ctx) {
  const [laundry, cleaning] = await Promise.all([
    ctx.api.getLaundryServices(),
    ctx.api.getCleaningServices()
  ]);
  let txt = "💰 *Daftar Harga Roomly*\n\n🧺 *Laundry:*\n";
  laundry.forEach((s) => { txt += `• ${s.name} — ${formatRupiah(s.price)}/${s.unit} (${s.duration})\n`; });
  txt += "\n🧹 *Cleaning:*\n";
  cleaning.forEach((s) => { txt += `• ${s.name} — ${formatRupiah(s.price)}/${s.unit} (${s.duration})\n`; });
  return txt.trim();
}

function helpMessage() {
  return (
    "🤖 Saya bisa membantu Anda untuk:\n\n" +
    "🧺 Memesan layanan *Laundry*\n" +
    "🧹 Memesan layanan *Cleaning*\n" +
    "💰 Melihat daftar *harga*\n" +
    "📦 *Cek status* pesanan Anda\n" +
    "❓ Menjawab pertanyaan seputar layanan\n\n" +
    "Pilih menu di bawah atau ketik pertanyaan Anda 👇"
  );
}

const STATUS_EMOJI = {
  "Diterima": "📥", "Dikonfirmasi": "✅", "Dijemput": "🛵",
  "Diproses": "⚙️", "Diantar": "🚚", "Selesai": "🎉", "Dibatalkan": "❌"
};

async function ordersMessage(ctx) {
  const bookings = await ctx.api.getUserBookings(ctx.user.id);
  if (!bookings.length) {
    return {
      text: "📦 Anda belum punya pesanan.\n\nYuk buat pesanan pertama Anda!",
      quickReplies: [
        { label: "🧺 Pesan Laundry", value: "pesan laundry" },
        { label: "🧹 Pesan Cleaning", value: "pesan cleaning" }
      ]
    };
  }
  let txt = "📦 *Pesanan Anda:*\n\n";
  bookings.slice(0, 5).forEach((b) => {
    const emoji = STATUS_EMOJI[b.status] || "•";
    const icon = b.type === "laundry" ? "🧺" : "🧹";
    txt += `${icon} *${b.service.name}*\n${emoji} Status: ${b.status} — ${formatRupiah(b.totalPrice)}\n`;
    if (b.type === "laundry" && b.driver) txt += `🛵 Driver: ${b.driver.name}\n`;
    txt += "\n";
  });
  txt += "Mau lihat detail tracking? Buka menu *Pesanan Saya* 📍";
  return { text: txt.trim(), quickReplies: QUICK_MENU };
}

/* ---------- Booking flow starters ---------- */
async function startBooking(type, ctx) {
  if (!ctx.user.address) {
    return {
      messages: [bot(
        "📍 Sebelum memesan, lengkapi *alamat* Anda di halaman Profil dulu ya. Alamat dipakai untuk penjemputan/kunjungan.",
        [{ label: "✏️ Buka Profil", to: "/profile" }]
      )],
      state: createInitialState()
    };
  }
  const services = type === "laundry"
    ? await ctx.api.getLaundryServices()
    : await ctx.api.getCleaningServices();

  const quickReplies = services.map((s) => ({
    label: `${s.icon} ${s.name} · ${formatRupiah(s.price)}`,
    value: s.id
  }));

  const intro = type === "laundry"
    ? "🧺 Baik! Mari pesan *Laundry*. Pilih jenis layanan:"
    : "🧹 Siap! Mari pesan *Cleaning*. Pilih jenis layanan:";

  return {
    messages: [bot(intro, quickReplies)],
    state: { flow: "booking", type, step: "service", draft: {} }
  };
}

/* ---------- Main entry ---------- */
export async function processMessage(state, userText, ctx) {
  const t = norm(userText);

  // ----- Active booking flow -----
  if (state.flow === "booking") {
    // allow cancel anytime
    if (has(t, "batal", "cancel", "stop", "berhenti", "gajadi", "ga jadi")) {
      return {
        messages: [bot("Baik, pemesanan dibatalkan. Ada lagi yang bisa saya bantu? 😊", QUICK_MENU)],
        state: createInitialState()
      };
    }

    const services = state.type === "laundry"
      ? await ctx.api.getLaundryServices()
      : await ctx.api.getCleaningServices();

    if (state.step === "service") {
      const svc = services.find((s) =>
        s.id.toLowerCase() === t ||
        s.name.toLowerCase() === t ||
        s.name.toLowerCase().includes(t) ||
        t.includes(s.name.toLowerCase())
      );
      if (!svc) {
        return {
          messages: [bot("Hmm, saya belum menemukan layanan itu. Silakan pilih salah satu tombol di bawah 👇",
            services.map((s) => ({ label: `${s.icon} ${s.name} · ${formatRupiah(s.price)}`, value: s.id })))],
          state
        };
      }
      const draft = { serviceId: svc.id, serviceName: svc.name, price: svc.price, unit: svc.unit };
      const ask = state.type === "laundry"
        ? `👍 *${svc.name}* dipilih (${formatRupiah(svc.price)}/${svc.unit}).\n\nBerapa *${svc.unit}* yang mau dilaundry? (contoh: 3)`
        : `👍 *${svc.name}* dipilih (${formatRupiah(svc.price)}/sesi).\n\nBerapa *sesi* yang Anda butuhkan? (contoh: 1)`;
      return { messages: [bot(ask)], state: { ...state, step: "qty", draft } };
    }

    if (state.step === "qty") {
      const n = parseNumber(t);
      if (Number.isNaN(n) || n <= 0) {
        return { messages: [bot("Mohon masukkan angka yang valid ya. Contoh: 3")], state };
      }
      const draft = { ...state.draft, qty: n };
      const ask = state.type === "laundry"
        ? `📅 Kapan mau dijemput? Ketik tanggal (contoh: *besok*, *hari ini*, atau *2026-06-15*)`
        : `📅 Kapan jadwal cleaning-nya? Ketik tanggal (contoh: *besok* atau *2026-06-15*)`;
      return { messages: [bot(ask)], state: { ...state, step: "date", draft } };
    }

    if (state.step === "date") {
      const date = parseDate(t);
      if (!date) {
        return { messages: [bot("Format tanggal belum dikenali. Coba ketik *besok*, *hari ini*, atau format *2026-06-15* 📅")], state };
      }
      if (date < todayStr()) {
        return { messages: [bot("Tanggalnya sudah lewat 😅. Pilih tanggal hari ini atau setelahnya ya.")], state };
      }
      const draft = { ...state.draft, date };

      if (state.type === "cleaning") {
        return {
          messages: [bot("⏰ Pilih jam kedatangan tim cleaning:",
            TIME_SLOTS.map((s) => ({ label: s, value: s })))],
          state: { ...state, step: "time", draft }
        };
      }
      // laundry → straight to confirm
      return { messages: [buildConfirm(state.type, draft)], state: { ...state, step: "confirm", draft } };
    }

    if (state.step === "time") {
      const time = parseTime(t);
      if (!time) {
        return {
          messages: [bot("Silakan pilih salah satu slot jam berikut 👇",
            TIME_SLOTS.map((s) => ({ label: s, value: s })))],
          state
        };
      }
      const draft = { ...state.draft, time };
      return { messages: [buildConfirm(state.type, draft)], state: { ...state, step: "confirm", draft } };
    }

    if (state.step === "confirm") {
      if (has(t, "konfirmasi", "ya", "yes", "ok", "oke", "betul", "benar", "lanjut", "bayar", "setuju", "yuk")) {
        const d = state.draft;
        try {
          let booking;
          if (state.type === "laundry") {
            booking = await ctx.api.createLaundryBooking({
              userId: ctx.user.id, serviceId: d.serviceId,
              quantity: d.qty, pickupDate: d.date, notes: "Pesanan via RoomlyBot"
            });
          } else {
            booking = await ctx.api.createCleaningBooking({
              userId: ctx.user.id, serviceId: d.serviceId,
              sessions: d.qty, scheduleDate: d.date, scheduleTime: d.time,
              notes: "Pesanan via RoomlyBot"
            });
          }
          return {
            messages: [bot(
              `🎉 Pesanan berhasil dibuat!\n\n🧾 *${d.serviceName}*\n💰 Total: ${formatRupiah(d.price * d.qty)}\n\nSaya arahkan ke halaman pembayaran ya...`
            )],
            state: createInitialState(),
            navigateTo: `/payment/${booking.id}`
          };
        } catch (err) {
          return {
            messages: [bot(`😔 Maaf, gagal membuat pesanan: ${err.message}\n\nCoba lagi atau lengkapi profil Anda.`, QUICK_MENU)],
            state: createInitialState()
          };
        }
      }
      if (has(t, "tidak", "ga", "gak", "nggak", "no", "batal", "ubah")) {
        return {
          messages: [bot("Baik, pesanan dibatalkan. Mau coba lagi? 😊", QUICK_MENU)],
          state: createInitialState()
        };
      }
      return {
        messages: [bot("Ketik *konfirmasi* untuk lanjut ke pembayaran, atau *batal* untuk membatalkan.",
          [{ label: "✅ Konfirmasi", value: "konfirmasi" }, { label: "❌ Batal", value: "batal" }])],
        state
      };
    }
  }

  // ----- Idle: intent detection -----
  if (has(t, "pesan laundry", "laundry", "cuci", "setrika", "laundri", "dry clean")) {
    return startBooking("laundry", ctx);
  }
  if (has(t, "pesan cleaning", "cleaning", "bersih", "bersihin", "pel", "sapu", "deep clean")) {
    return startBooking("cleaning", ctx);
  }
  if (has(t, "harga", "biaya", "tarif", "price", "berapaan", "daftar harga", "rate")) {
    const txt = await pricingMessage(ctx);
    return { messages: [bot(txt, QUICK_MENU)], state: createInitialState() };
  }
  if (has(t, "cek pesanan", "pesanan", "status", "order", "tracking", "lacak", "pesanan saya")) {
    const m = await ordersMessage(ctx);
    return { messages: [bot(m.text, m.quickReplies)], state: createInitialState() };
  }
  if (has(t, "jam", "buka", "operasional", "kapan buka", "open")) {
    return {
      messages: [bot("🕐 *Jam Operasional Roomly:*\n\nSetiap hari, 08.00 – 20.00 WIB.\n\nLayanan *Express* tersedia untuk laundry (selesai 6 jam) ⚡", QUICK_MENU)],
      state: createInitialState()
    };
  }
  if (has(t, "bayar", "pembayaran", "payment", "qris", "cod", "transfer", "metode")) {
    return {
      messages: [bot("💳 *Metode Pembayaran:*\n\n• QRIS (scan & bayar)\n• COD (bayar saat pesanan diantar)\n• Transfer Bank\n\nPembayaran dipilih otomatis setelah Anda membuat pesanan. 😊", QUICK_MENU)],
      state: createInitialState()
    };
  }
  if (has(t, "lokasi", "area", "jangkauan", "daerah", "coverage", "wilayah", "alamat")) {
    return {
      messages: [bot("📍 Roomly melayani area kota Anda dengan layanan antar-jemput gratis untuk laundry, dan kunjungan ke lokasi untuk cleaning. Masukkan alamat Anda di Profil saat memesan. 🚚", QUICK_MENU)],
      state: createInitialState()
    };
  }
  if (has(t, "cara", "gimana", "bagaimana", "how", "kerja", "proses")) {
    return {
      messages: [bot("📋 *Cara Pesan di Roomly:*\n\n1️⃣ Pilih layanan (laundry/cleaning)\n2️⃣ Tentukan jumlah & jadwal\n3️⃣ Konfirmasi & bayar\n4️⃣ Pantau status real-time\n\nSaya bisa bantu pesankan sekarang! Mau yang mana?", [
        { label: "🧺 Pesan Laundry", value: "pesan laundry" },
        { label: "🧹 Pesan Cleaning", value: "pesan cleaning" }
      ])],
      state: createInitialState()
    };
  }
  if (has(t, "halo", "hai", "hi", "hello", "pagi", "siang", "sore", "malam", "assalam", "permisi")) {
    return {
      messages: [bot(`👋 Halo ${ctx.user.name}! Saya *RoomlyBot*, asisten virtual Anda. Ada yang bisa saya bantu hari ini?`, QUICK_MENU)],
      state: createInitialState()
    };
  }
  if (has(t, "terima kasih", "makasih", "thanks", "thank", "tengkyu", "mksh")) {
    return {
      messages: [bot("Sama-sama! 😊 Senang bisa membantu. Ada lagi yang bisa saya bantu?", QUICK_MENU)],
      state: createInitialState()
    };
  }
  if (has(t, "bantuan", "help", "menu", "bisa apa", "fitur")) {
    return { messages: [bot(helpMessage(), QUICK_MENU)], state: createInitialState() };
  }

  // ----- Fallback -----
  return {
    messages: [bot(
      "Maaf, saya belum sepenuhnya paham 🙏. Tapi saya bisa bantu hal-hal ini:",
      QUICK_MENU
    )],
    state: createInitialState()
  };
}

function buildConfirm(type, draft) {
  let summary = `📝 *Konfirmasi Pesanan*\n\n🧾 Layanan: ${draft.serviceName}\n`;
  if (type === "laundry") {
    summary += `⚖️ Jumlah: ${draft.qty} ${draft.unit}\n📅 Penjemputan: ${draft.date}\n`;
  } else {
    summary += `🔢 Sesi: ${draft.qty}\n📅 Tanggal: ${draft.date}\n⏰ Jam: ${draft.time}\n`;
  }
  summary += `💰 *Total: ${formatRupiah(draft.price * draft.qty)}*\n\nSudah benar? Ketik *konfirmasi* untuk lanjut ke pembayaran.`;
  return bot(summary, [
    { label: "✅ Konfirmasi & Bayar", value: "konfirmasi" },
    { label: "❌ Batal", value: "batal" }
  ]);
}

/* ---------- Welcome message ---------- */
export function welcomeMessage(user) {
  return bot(
    `👋 Halo *${user.name}*! Saya *RoomlyBot* 🤖\n\nSaya siap membantu Anda memesan layanan & menjawab pertanyaan. Pilih menu di bawah atau ketik langsung 👇`,
    QUICK_MENU
  );
}
