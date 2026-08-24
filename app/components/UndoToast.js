"use client";
import { useEffect } from "react";

// A small "X removed. Undo" bar that auto-dismisses after a few seconds.
// Pass `text` (the message) and `onUndo` (called when clicked); render
// nothing when there's nothing to undo by passing text={null}.
export default function UndoToast({ text, onUndo, onDismiss, seconds = 8 }) {
  useEffect(() => {
    if (!text) return;
    const timer = setTimeout(onDismiss, seconds * 1000);
    return () => clearTimeout(timer);
  }, [text, onDismiss, seconds]);

  if (!text) return null;

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 28,
        transform: "translateX(-50%)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: 16,
        background: "#1a1a1a",
        border: "1px solid rgba(201, 162, 39, 0.35)",
        borderRadius: 12,
        padding: "12px 18px",
        boxShadow: "0 12px 32px rgba(0, 0, 0, 0.5)",
      }}
    >
      <span style={{ fontSize: 14, color: "#f5f5f5" }}>{text}</span>
      <button
        type="button"
        onClick={onUndo}
        style={{ width: "auto", marginBottom: 0, padding: "6px 16px", fontSize: 13 }}
      >
        Undo
      </button>
    </div>
  );
}
