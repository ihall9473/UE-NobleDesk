"use client";
import { useEffect, useState } from "react";
import { APP_NAME } from "@/lib/features";

// Hidden once already installed - iOS exposes this as navigator.standalone,
// everywhere else it's the display-mode media query.
export default function AddToHomeScreen() {
  const [installed, setInstalled] = useState(true);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
    setInstalled(!!standalone);
  }, []);

  if (installed) return null;

  return (
    <div className="card" style={{ marginBottom: 28 }}>
      <h3>Install {APP_NAME} on Your Phone</h3>
      <p className="subtitle" style={{ marginBottom: 14 }}>
        Add it to your Home Screen for one-tap access, like a real app - no App Store needed.
      </p>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 240px", minWidth: 220 }}>
          <div className="label-caps" style={{ marginBottom: 6 }}>iPhone / iPad (Safari)</div>
          <ol className="subtitle" style={{ paddingLeft: 20, marginBottom: 0 }}>
            <li style={{ marginBottom: 4 }}>Open this site in Safari</li>
            <li style={{ marginBottom: 4 }}>Tap the Share icon (square with an arrow pointing up) in the toolbar</li>
            <li style={{ marginBottom: 4 }}>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" in the top right</li>
          </ol>
        </div>
        <div style={{ flex: "1 1 240px", minWidth: 220 }}>
          <div className="label-caps" style={{ marginBottom: 6 }}>Android (Chrome)</div>
          <ol className="subtitle" style={{ paddingLeft: 20, marginBottom: 0 }}>
            <li style={{ marginBottom: 4 }}>Open this site in Chrome</li>
            <li style={{ marginBottom: 4 }}>Tap the &#8942; menu in the top right</li>
            <li style={{ marginBottom: 4 }}>Tap "Add to Home screen" (or "Install app")</li>
            <li>Tap "Add" / "Install" to confirm</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
