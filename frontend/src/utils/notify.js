/* =====================================================
   Browser push notifications (Notification API)
   OS-level popup — muncul walau tab di background.
   Tanpa backend. Hanya aktif saat tab Roomly terbuka.
   ===================================================== */

const ICON = "/icon-192.png";

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission() {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return "unsupported";
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

const STATUS_MESSAGE = {
  Diterima: (s) => `📥 Pesanan ${s} Anda telah diterima sistem.`,
  Dikonfirmasi: (s) => `✅ Pesanan ${s} Anda sudah dikonfirmasi admin.`,
  Dijemput: (s) => `🚚 Driver sedang menjemput pesanan ${s} Anda.`,
  Diproses: (s) => `⚙️ Pesanan ${s} Anda sedang diproses.`,
  Diantar: (s) => `📦 Pesanan ${s} Anda sedang diantar ke lokasi!`,
  Selesai: (s) => `🎉 Pesanan ${s} selesai. Terima kasih telah memakai Roomly!`,
  Dibatalkan: (s) => `❌ Pesanan ${s} Anda dibatalkan.`
};

export function showOrderNotification(booking, onClick) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  const svc = booking.service?.name || "Anda";
  const make = STATUS_MESSAGE[booking.status];
  const body = make ? make(svc) : `Status pesanan: ${booking.status}`;
  try {
    const n = new Notification("Update Pesanan Roomly", {
      body,
      icon: ICON,
      badge: ICON,
      tag: `roomly-order-${booking.id}`,
      renotify: true
    });
    n.onclick = () => {
      window.focus();
      if (onClick) onClick(booking);
      n.close();
    };
  } catch {
    /* some browsers throw if constructed without a service worker on mobile */
  }
}

export function showSimpleNotification(title, body) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: ICON });
  } catch {}
}
