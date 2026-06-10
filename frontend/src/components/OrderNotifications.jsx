import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth.jsx";
import {
  notificationsSupported,
  notificationPermission,
  requestNotificationPermission,
  showOrderNotification,
  showSimpleNotification
} from "../utils/notify.js";

export default function OrderNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isCustomer = user && user.role !== "admin";
  const [perm, setPerm] = useState(notificationPermission());
  const [dismissed, setDismissed] = useState(false);
  const knownRef = useRef({}); // bookingId -> last seen status

  const storeKey = user ? `roomly:notifStatus:${user.id}` : null;
  const dismissKey = user ? `roomly:notifDismiss:${user.id}` : null;

  // Load baseline statuses + dismiss flag
  useEffect(() => {
    if (!isCustomer || !storeKey) return;
    try {
      knownRef.current = JSON.parse(localStorage.getItem(storeKey) || "{}");
    } catch {
      knownRef.current = {};
    }
    setDismissed(localStorage.getItem(dismissKey) === "1");
  }, [isCustomer, storeKey, dismissKey]);

  // Poll bookings and fire OS notification on status change
  const poll = useCallback(async () => {
    if (!isCustomer) return;
    let bookings;
    try {
      bookings = await api.getUserBookings(user.id);
    } catch {
      return;
    }
    const known = knownRef.current;
    let changed = false;
    for (const b of bookings) {
      const prev = known[b.id];
      if (prev === undefined) {
        known[b.id] = b.status; // new booking — record, don't notify
        changed = true;
      } else if (prev !== b.status) {
        known[b.id] = b.status;
        changed = true;
        showOrderNotification(b, (bk) => navigate(`/tracking/${bk.id}`));
      }
    }
    if (changed && storeKey) localStorage.setItem(storeKey, JSON.stringify(known));
  }, [isCustomer, user, navigate, storeKey]);

  useEffect(() => {
    if (!isCustomer) return;
    poll();
    const iv = setInterval(poll, 12000);
    return () => clearInterval(iv);
  }, [poll, isCustomer]);

  if (!isCustomer || !notificationsSupported()) return null;
  if (perm !== "default" || dismissed) return null;

  const enable = async () => {
    const result = await requestNotificationPermission();
    setPerm(result);
    if (result === "granted") {
      showSimpleNotification(
        "🔔 Notifikasi Roomly aktif!",
        "Anda akan diberi tahu saat status pesanan berubah."
      );
    }
  };

  const later = () => {
    setDismissed(true);
    if (dismissKey) localStorage.setItem(dismissKey, "1");
  };

  return (
    <div className="notif-prompt">
      <div className="notif-prompt-icon">🔔</div>
      <div className="notif-prompt-text">
        <strong>Aktifkan Notifikasi?</strong>
        <span>Dapatkan pemberitahuan langsung saat status pesanan Anda berubah.</span>
      </div>
      <div className="notif-prompt-actions">
        <button className="notif-enable" onClick={enable}>Aktifkan</button>
        <button className="notif-later" onClick={later}>Nanti</button>
      </div>
    </div>
  );
}
