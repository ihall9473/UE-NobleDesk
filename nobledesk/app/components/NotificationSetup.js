"use client";
import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function NotificationSetup() {
  const [status, setStatus] = useState("checking"); // checking | unsupported | off | on | error

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      const existing = await reg.pushManager.getSubscription();
      setStatus(existing ? "on" : "off");
    });
  }, []);

  async function enableNotifications() {
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("off");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        ),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });
      setStatus("on");
    } catch (err) {
      setStatus("error");
    }
  }

  if (status === "unsupported" || status === "checking" || status === "on") return null;

  return (
    <div className="card" style={{ background: "#fffbea", border: "1px solid #fde68a" }}>
      <div className="row">
        <span>Turn on notifications for new texts on this device?</span>
        <button onClick={enableNotifications}>Enable</button>
      </div>
    </div>
  );
}
