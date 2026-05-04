import { jsPDF } from "jspdf";

const METHOD_LABELS = {
  qris: "QRIS",
  cod: "Cash on Delivery",
  transfer: "Transfer Bank"
};

const formatRupiah = (amount) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);

const formatDate = (iso) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

export function generateReceiptPDF(booking, user) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 15;
  let y = 0;

  doc.setFillColor(79, 70, 229);
  doc.rect(0, 0, pageW, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("ROOMLY", margin, 18);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Laundry & Cleaning Service", margin, 25);

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RECEIPT", pageW - margin, 18, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`#${booking.invoiceNumber || booking.id}`, pageW - margin, 25, { align: "right" });

  y = 50;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("DARI", margin, y);
  doc.text("KEPADA", pageW / 2, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  y += 6;
  doc.text("Roomly Indonesia", margin, y);
  doc.text(user.name || "-", pageW / 2, y);
  y += 5;
  doc.text("Kantor Pusat Roomly", margin, y);
  if (user.email) doc.text(user.email, pageW / 2, y);
  y += 5;
  doc.text("admin@roomly.id", margin, y);
  if (user.phone) doc.text(user.phone, pageW / 2, y);
  y += 5;
  if (user.address) {
    const addrLines = doc.splitTextToSize(user.address, (pageW / 2) - margin - 5);
    doc.text(addrLines, pageW / 2, y);
    y += addrLines.length * 4;
  }

  y = Math.max(y, 80);
  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, pageW - margin, y);

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("INFORMASI PESANAN", margin, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`ID Booking      : ${booking.id}`, margin, y);
  y += 5;
  doc.text(`Tipe Layanan    : ${booking.type === "laundry" ? "Laundry" : "Cleaning"}`, margin, y);
  y += 5;
  doc.text(`Tanggal Pesan   : ${formatDate(booking.createdAt)}`, margin, y);
  if (booking.paidAt) {
    y += 5;
    doc.text(`Tanggal Bayar   : ${formatDate(booking.paidAt)}`, margin, y);
  }
  if (booking.type === "laundry") {
    y += 5;
    doc.text(`Tgl Penjemputan : ${booking.pickupDate}`, margin, y);
  } else {
    y += 5;
    doc.text(`Jadwal Layanan  : ${booking.scheduleDate} pukul ${booking.scheduleTime}`, margin, y);
  }

  y += 10;
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, pageW - margin * 2, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("DESKRIPSI", margin + 3, y + 6.5);
  doc.text("QTY", pageW - margin - 50, y + 6.5);
  doc.text("HARGA", pageW - margin - 30, y + 6.5);
  doc.text("TOTAL", pageW - margin - 3, y + 6.5, { align: "right" });

  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(booking.service.name, margin + 3, y);
  const qty = booking.type === "laundry" ? booking.quantity : booking.sessions;
  const unit = booking.service.unit;
  doc.text(`${qty} ${unit}`, pageW - margin - 50, y);
  doc.setFontSize(9);
  doc.text(formatRupiah(booking.service.price), pageW - margin - 30, y);
  doc.setFont("helvetica", "bold");
  doc.text(formatRupiah(booking.totalPrice), pageW - margin - 3, y, { align: "right" });

  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  if (booking.notes) {
    const notesLines = doc.splitTextToSize(`Catatan: ${booking.notes}`, pageW - margin * 2 - 6);
    doc.text(notesLines, margin + 3, y);
    y += notesLines.length * 4;
  }

  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(pageW / 2, y, pageW - margin, y);

  y += 6;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "normal");
  doc.text("Subtotal", pageW / 2, y);
  doc.setTextColor(15, 23, 42);
  doc.text(formatRupiah(booking.totalPrice), pageW - margin, y, { align: "right" });

  y += 6;
  doc.setTextColor(100, 116, 139);
  doc.text("Biaya Layanan", pageW / 2, y);
  doc.setTextColor(15, 23, 42);
  doc.text("Rp 0", pageW - margin, y, { align: "right" });

  y += 8;
  doc.setFillColor(79, 70, 229);
  doc.rect(pageW / 2, y - 5, pageW / 2 - margin, 12, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL DIBAYAR", pageW / 2 + 3, y + 2);
  doc.setFontSize(13);
  doc.text(formatRupiah(booking.totalPrice), pageW - margin - 3, y + 2, { align: "right" });

  y += 18;
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("METODE PEMBAYARAN", margin, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`Metode  : ${METHOD_LABELS[booking.paymentMethod] || booking.paymentMethod}`, margin, y);
  y += 5;
  const statusLabel = booking.paymentStatus === "paid" ? "LUNAS" : "MENUNGGU PEMBAYARAN (COD)";
  doc.setFont("helvetica", "bold");
  if (booking.paymentStatus === "paid") {
    doc.setTextColor(16, 185, 129);
  } else {
    doc.setTextColor(245, 158, 11);
  }
  doc.text(`Status  : ${statusLabel}`, margin, y);

  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.text("Terima kasih telah menggunakan Roomly!", pageW / 2, 270, { align: "center" });
  doc.setFontSize(8);
  doc.text("Receipt ini dibuat secara elektronik dan sah tanpa tanda tangan.", pageW / 2, 275, { align: "center" });
  doc.text("Untuk pertanyaan, hubungi admin@roomly.id", pageW / 2, 280, { align: "center" });

  return doc;
}

export function downloadReceipt(booking, user) {
  const doc = generateReceiptPDF(booking, user);
  const filename = `Roomly-Receipt-${booking.invoiceNumber || booking.id}.pdf`;
  doc.save(filename);
}

export function getReceiptBase64(booking, user) {
  const doc = generateReceiptPDF(booking, user);
  return doc.output("datauristring");
}
